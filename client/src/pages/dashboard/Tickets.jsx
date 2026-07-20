import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import { Modal } from "../../components/dashboard/Modal";
import TicketThread from "../../components/dashboard/TicketThread";
import api from "../../services/http/api";
import { useAuth } from "../../hooks/useAuth";
import { ticketNumber } from "../../lib/tickets";

const unreadCount = (ticket, userId) => (ticket.messages || []).filter((message) => message.senderId !== userId && !message.read).length;

export default function Tickets() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const selected = tickets.find((ticket) => ticket.id === selectedId);

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

  const create = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const { data: ticket } = await api.post("/tickets", {
        subject: data.get("subject"),
        priority: data.get("priority"),
        category: data.get("category"),
        message: data.get("message"),
      });
      setTickets((items) => [ticket, ...items]);
      setCreateOpen(false);
      toast.success("Ticket created.");
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not create ticket.");
    }
  };

  const viewTicket = useCallback(async (ticket) => {
    setSelectedId(ticket.id);
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
    <div className="mb-7 flex items-center justify-between"><div><h2 className="text-2xl font-bold">Support tickets</h2><p className="mt-1 text-sm text-slate-500">Ask for help and follow every conversation.</p></div><Button onClick={() => setCreateOpen(true)}><Plus size={16}/>New ticket</Button></div>
    {loading && <div className="panel p-5 text-sm text-muted">Loading tickets...</div>}
    {error && <div className="panel border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
    {!loading && !error && <div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-surface-raised text-xs uppercase tracking-wider text-muted"><tr><th className="p-5">Ticket</th><th>Priority</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>{tickets.map(ticket => { const unread = unreadCount(ticket, user?.id); return <tr className="border-t border-border" key={ticket.id}><td className="p-5"><div className="flex items-center gap-2">{unread > 0 && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label={`${unread} unread message${unread > 1 ? "s" : ""}`}/>}<div className={unread > 0 ? "font-extrabold" : "font-semibold"}>{ticket.subject}</div></div><div className="mt-1 text-xs text-muted">Ticket #{ticketNumber(ticket.id)}</div></td><td className="capitalize">{ticket.priority}</td><td><span className="info-pill capitalize">{String(ticket.status).replace(/_/g, " ")}</span></td><td className="text-muted">{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : ""}</td><td><button onClick={() => viewTicket(ticket)} className="text-action">View</button></td></tr>; })}</tbody></table></div>{tickets.length === 0 && <div className="p-6 text-sm text-muted">No tickets yet. Create one to get help from our team.</div>}</div>}
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New support ticket"><form onSubmit={create} className="space-y-4"><input name="subject" required className="input" placeholder="What do you need help with?"/><select name="category" className="input" defaultValue="General"><option value="General">General</option><option value="Support">Support</option><option value="Technical">Technical</option><option value="Billing">Billing</option></select><select name="priority" className="input"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select><textarea name="message" required className="input min-h-32 resize-none" placeholder="Add details..."/><Button className="w-full">Create ticket</Button></form></Modal>
    <Modal open={Boolean(selected)} onClose={() => setSelectedId(null)} title={selected?.subject} description={`Ticket #${ticketNumber(selected?.id)} | ${selected?.status} | ${selected?.priority} priority`}>
      {selected && <div className="flex max-h-[60vh] flex-col"><TicketThread ticketId={selected.id} currentUserId={user?.id} onSent={() => loadTickets(false)}/></div>}
    </Modal>
  </div>;
}
