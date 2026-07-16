import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/http/api";

const formatValue = (value) => value ? String(value).replace(/_/g, " ") : "";

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return <div><div className="mb-7"><h2 className="text-2xl font-bold">Support queue</h2><p className="mt-1 text-sm text-muted">Triage, assign and resolve customer requests.</p></div>{loading && <div className="panel p-5 text-sm text-muted">Loading tickets...</div>}{error && <div className="panel border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>}{!loading && !error && <div className="grid gap-4">{tickets.map((ticket) => <div className="panel flex flex-col justify-between gap-5 p-5 lg:flex-row lg:items-center" key={ticket.id}><div className="flex items-start gap-4"><span className={`mt-1 size-2 rounded-full ${ticket.priority === "critical" ? "bg-red-500" : ticket.priority === "high" ? "bg-orange-500" : "bg-primary"}`}/><div><div className="font-semibold">{ticket.subject}</div><div className="mt-1 text-xs capitalize text-muted">{ticket.id} | {ticket.user || "Unknown user"} | {formatValue(ticket.priority)} priority{ticket.createdAt ? ` | ${new Date(ticket.createdAt).toLocaleDateString()}` : ""}</div></div></div><div className="flex flex-col gap-3 sm:flex-row"><select value={ticket.assignee || "Unassigned"} onChange={(event) => updateAdminTicket(ticket.id, { assignedTo: event.target.value === "Unassigned" ? null : event.target.value }, "Ticket assigned.")} className="input py-2 sm:w-40"><option>Unassigned</option></select><select value={ticket.status} onChange={(event) => updateAdminTicket(ticket.id, { status: event.target.value }, "Ticket status updated.")} className="input py-2 sm:w-40"><option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option></select></div></div>)}{tickets.length === 0 && <div className="panel p-6 text-sm text-muted">No tickets found.</div>}</div>}</div>;
}
