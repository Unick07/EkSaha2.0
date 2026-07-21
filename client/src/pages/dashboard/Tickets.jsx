import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LoaderCircle, Plus, Send } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import { Modal } from "../../components/dashboard/Modal";
import TicketThread from "../../components/dashboard/TicketThread";
import api from "../../services/http/api";
import { useAuth } from "../../hooks/useAuth";
import { ticketNumber } from "../../lib/tickets";

const unreadCount = (ticket, userId) => (ticket.messages || []).filter((message) => message.senderId !== userId && !message.read).length;

const CATEGORIES = [
  { value: "General", emoji: "\u{1F4AC}" },
  { value: "Billing", emoji: "\u{1F4B3}" },
  { value: "Technical", emoji: "\u{1F527}" },
  { value: "Support", emoji: "\u{1F3A7}" },
];

const PRIORITIES = [
  { value: "low", label: "Low", dot: "bg-slate-400", active: "border-slate-400/60 bg-slate-500/10 text-slate-700 dark:text-slate-200" },
  { value: "medium", label: "Medium", dot: "bg-blue-500", active: "border-blue-400/60 bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { value: "high", label: "High", dot: "bg-orange-500", active: "border-orange-400/60 bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  { value: "critical", label: "Critical", dot: "bg-red-500", active: "border-red-400/60 bg-red-500/10 text-red-700 dark:text-red-300" },
];

const MESSAGE_MAX = 2000;
const emptyForm = { subject: "", category: "General", priority: "medium", message: "" };

export default function Tickets() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
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

  const closeCreate = () => {
    if (submitting) return;
    setCreateOpen(false);
    setForm(emptyForm);
  };

  const create = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { data: ticket } = await api.post("/tickets", form);
      setTickets((items) => [ticket, ...items]);
      setCreateOpen(false);
      setForm(emptyForm);
      toast.success("Ticket created.");
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not create ticket.");
    } finally {
      setSubmitting(false);
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
    <div className="mb-7 flex justify-end"><Button onClick={() => setCreateOpen(true)}><Plus size={16}/>New ticket</Button></div>
    {loading && <div className="panel p-5 text-sm text-muted">Loading tickets...</div>}
    {error && <div className="panel border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
    {!loading && !error && <div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-surface-raised text-xs uppercase tracking-wider text-muted"><tr><th className="p-5">Ticket</th><th>Priority</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>{tickets.map(ticket => { const unread = unreadCount(ticket, user?.id); return <tr className="border-t border-border" key={ticket.id}><td className="p-5"><div className="flex items-center gap-2">{unread > 0 && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label={`${unread} unread message${unread > 1 ? "s" : ""}`}/>}<div className={unread > 0 ? "font-extrabold" : "font-semibold"}>{ticket.subject}</div></div><div className="mt-1 text-xs text-muted">Ticket #{ticketNumber(ticket.id)}</div></td><td className="capitalize">{ticket.priority}</td><td><span className="info-pill capitalize">{String(ticket.status).replace(/_/g, " ")}</span></td><td className="text-muted">{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : ""}</td><td><button onClick={() => viewTicket(ticket)} className="text-action">View</button></td></tr>; })}</tbody></table></div>{tickets.length === 0 && <div className="p-6 text-sm text-muted">No tickets yet. Create one to get help from our team.</div>}</div>}
    <Modal open={createOpen} onClose={closeCreate} title="Create a support ticket" description="Tell us what you need help with and we'll get back to you shortly">
      <form onSubmit={create} className="space-y-6">
        <label className="block text-sm font-semibold">Subject
          <input
            required
            value={form.subject}
            onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
            className="input mt-2"
            placeholder="Brief summary of your issue"
          />
        </label>

        <div>
          <span className="block text-sm font-semibold">Category</span>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CATEGORIES.map((option) => {
              const active = form.category === option.value;
              return <button
                key={option.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, category: option.value }))}
                className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${active ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/15" : "border-border bg-surface text-muted hover:border-primary/30 hover:bg-surface-raised"}`}
              >
                <span className="text-lg leading-none">{option.emoji}</span>
                {option.value}
              </button>;
            })}
          </div>
        </div>

        <div>
          <span className="block text-sm font-semibold">Priority</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRIORITIES.map((option) => {
              const active = form.priority === option.value;
              return <button
                key={option.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, priority: option.value }))}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition ${active ? option.active : "border-border bg-surface text-muted hover:bg-surface-raised"}`}
              >
                <span className={`size-2 rounded-full ${option.dot}`}/>
                {option.label}
              </button>;
            })}
          </div>
        </div>

        <label className="block text-sm font-semibold">Description
          <textarea
            required
            maxLength={MESSAGE_MAX}
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            className="input mt-2 min-h-36 resize-none"
            placeholder="Type here..."
          />
          <div className="mt-1.5 text-right text-xs font-normal text-muted">{form.message.length}/{MESSAGE_MAX}</div>
        </label>

        <div className="flex items-center gap-3 pt-1">
          <button type="button" onClick={closeCreate} className="text-sm font-bold text-muted transition hover:text-text">Cancel</button>
          <button
            type="submit"
            disabled={submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? <LoaderCircle size={16} className="animate-spin"/> : <Send size={16}/>}
            {submitting ? "Creating..." : "Create ticket"}
          </button>
        </div>
      </form>
    </Modal>
    <Modal open={Boolean(selected)} onClose={() => setSelectedId(null)} title={selected?.subject} description={`Ticket #${ticketNumber(selected?.id)} | ${selected?.status} | ${selected?.priority} priority`}>
      {selected && <div className="flex max-h-[60vh] flex-col"><TicketThread ticketId={selected.id} currentUserId={user?.id} onSent={() => loadTickets(false)}/></div>}
    </Modal>
  </div>;
}
