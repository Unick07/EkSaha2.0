import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/http/api";
import { Modal } from "../../components/dashboard/Modal";
import TicketThread from "../../components/dashboard/TicketThread";
import { useAuth } from "../../hooks/useAuth";
import { ticketNumber } from "../../lib/tickets";

const formatValue = (value) => value ? String(value).replace(/_/g, " ") : "";
const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
const unreadCount = (ticket, userId) => (ticket.messages || []).filter((message) => message.senderId !== userId && !message.read).length;

export default function Tickets() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [viewingId, setViewingId] = useState(null);
  const viewing = tickets.find((ticket) => ticket.id === viewingId);

  const loadTickets = useCallback((showSpinner = false) => {
    if (showSpinner) setLoading(true);
    return api.get("/tickets")
      .then(({ data }) => {
        setTickets(data);
        setError("");
      })
      .catch((caught) => {
        const message = caught.response?.data?.message || "Could not load tickets.";
        setError(message);
        if (showSpinner) toast.error(message);
      })
      .finally(() => {
        if (showSpinner) setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadTickets(true);
    const interval = window.setInterval(() => loadTickets(false), 15000);
    return () => window.clearInterval(interval);
  }, [loadTickets]);

  useEffect(() => {
    api.get("/admin/users", { params: { roles: "admin,support,billing" } })
      .then(({ data }) => setTeamMembers(data))
      .catch(() => {});
  }, []);

  const updateAdminTicket = async (id, changes, message) => {
    const previous = tickets;
    setTickets((items) => items.map((ticket) => ticket.id === id ? { ...ticket, ...changes } : ticket));
    try {
      const { data } = await api.patch(`/tickets/${id}`, changes);
      setTickets((items) => items.map((ticket) => ticket.id === id ? data : ticket));
      toast.success(message);
    } catch (caught) {
      setTickets(previous);
      toast.error(caught.response?.data?.message || "Ticket update failed.");
    }
  };

  const viewTicket = useCallback(async (ticket) => {
    setViewingId(ticket.id);
    if (unreadCount(ticket, user?.id) === 0) return;
    try {
      const { data } = await api.patch(`/tickets/${ticket.id}/messages/read`);
      setTickets((items) => items.map((item) => item.id === data.id ? data : item));
    } catch {
      // Non-critical: the thread's own fetch also marks messages read.
    }
  }, [user?.id]);

  useEffect(() => {
    const ticketParam = searchParams.get("ticket");
    if (!ticketParam || tickets.length === 0) return;
    const target = tickets.find((ticket) => ticket.id === ticketParam);
    if (target) viewTicket(target);
    setSearchParams((params) => { params.delete("ticket"); return params; }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets]);

  return <div>
    {loading && <div className="panel p-5 text-sm text-muted">Loading tickets...</div>}
    {error && <div className="panel border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
    {!loading && !error && <div className="grid gap-4">{tickets.map((ticket) => { const unread = unreadCount(ticket, user?.id); return <div className="panel flex flex-col justify-between gap-5 p-5 lg:flex-row lg:items-center" key={ticket.id}>
      <div className="flex items-start gap-4">
        <span className={`mt-1 size-2 rounded-full ${ticket.priority === "critical" ? "bg-red-500" : ticket.priority === "high" ? "bg-orange-500" : "bg-primary"}`}/>
        <div>
          <div className="flex items-center gap-2">{unread > 0 && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label={`${unread} unread message${unread > 1 ? "s" : ""}`}/>}<span className={unread > 0 ? "font-extrabold" : "font-semibold"}>{ticket.subject}</span><span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">{ticket.category}</span>{unread > 0 && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">New reply</span>}</div>
          <div className="mt-1 text-xs capitalize text-muted">Ticket #{ticketNumber(ticket.id)} | {ticket.user || "Unknown customer"} | {formatValue(ticket.priority)} priority{ticket.createdAt ? ` | ${formatDate(ticket.createdAt)}` : ""}</div>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select value={ticket.assignedTo || ""} onChange={(event) => updateAdminTicket(ticket.id, { assignedTo: event.target.value || null }, "Ticket assigned.")} className="input py-2 sm:w-44">
          <option value="">Unassigned</option>
          {teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
        </select>
        <select value={ticket.status} onChange={(event) => updateAdminTicket(ticket.id, { status: event.target.value }, "Ticket status updated.")} className="input py-2 sm:w-40"><option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option></select>
        <button onClick={() => viewTicket(ticket)} className="text-action">View</button>
      </div>
    </div>; })}{tickets.length === 0 && <div className="panel p-6 text-sm text-muted">No tickets found.</div>}</div>}

    <Modal open={Boolean(viewing)} onClose={() => setViewingId(null)} title={viewing?.subject} description={`Ticket #${ticketNumber(viewing?.id)} | ${viewing?.user || "Unknown customer"}`} size="lg">
      {viewing && <div className="flex max-h-[70vh] flex-col gap-5">
        <div className="grid shrink-0 gap-3 rounded-2xl border border-border bg-surface-raised p-4 text-sm sm:grid-cols-2">
          <div><span className="text-muted">Status</span><div className="font-semibold capitalize">{formatValue(viewing.status)}</div></div>
          <div><span className="text-muted">Priority</span><div className="font-semibold capitalize">{viewing.priority}</div></div>
          <div><span className="text-muted">Category</span><div className="font-semibold">{viewing.category}</div></div>
          <div><span className="text-muted">Assigned to</span><div className="font-semibold">{viewing.assignee || "Unassigned"}</div></div>
          <div><span className="text-muted">Created</span><div className="font-semibold">{formatDate(viewing.createdAt)}</div></div>
          <div><span className="text-muted">Last updated</span><div className="font-semibold">{formatDate(viewing.updatedAt)}</div></div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <h4 className="mb-3 shrink-0 text-sm font-bold">Conversation</h4>
          <TicketThread ticketId={viewing.id} currentUserId={user?.id} onSent={() => loadTickets(false)}/>
        </div>
      </div>}
    </Modal>
  </div>;
}
