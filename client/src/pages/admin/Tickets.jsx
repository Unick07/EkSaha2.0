import toast from "react-hot-toast";
import { useEffect } from "react";
import { useAdminStore } from "../../store/useAdminStore";

export default function Tickets() {
  const { tickets, updateTicket, ingestTickets } = useAdminStore();
  useEffect(() => {
    fetch("/api/demo/tickets")
      .then((response) => response.json())
      .then(ingestTickets)
      .catch(() => toast.error("Could not sync latest tickets."));
  }, [ingestTickets]);

  const updateAdminTicket = (id, changes, message) => {
    updateTicket(id, changes);
    fetch(`/api/demo/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    }).catch(() => toast.error("Ticket updated locally, but server sync failed."));
    toast.success(message);
  };
  return <div><div className="mb-7"><h2 className="text-2xl font-bold">Support queue</h2><p className="mt-1 text-sm text-muted">Triage, assign and resolve customer requests. User-created tickets appear here instantly.</p></div><div className="grid gap-4">{tickets.map(ticket=><div className={`panel flex flex-col justify-between gap-5 p-5 lg:flex-row lg:items-center ${ticket.source === "User dashboard" ? "border-primary ring-4 ring-primary/15" : ""}`} key={ticket.id}><div className="flex items-start gap-4"><span className={`mt-1 size-2 rounded-full ${ticket.priority==="Critical"?"bg-red-500":ticket.priority==="High"?"bg-orange-500":"bg-primary"}`}/><div><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{ticket.subject}</span>{ticket.source === "User dashboard" && <span className="info-pill uppercase tracking-wider">New user ticket</span>}</div><div className="mt-1 text-xs text-muted">{ticket.id} | {ticket.user} | {ticket.priority} priority{ticket.createdAt ? ` | ${ticket.createdAt}` : ""}</div></div></div><div className="flex flex-col gap-3 sm:flex-row"><select value={ticket.assignee} onChange={(e)=>updateAdminTicket(ticket.id,{assignee:e.target.value,source:undefined},"Ticket assigned.")} className="input py-2 sm:w-40"><option>Unassigned</option><option>Amelia</option><option>Noah</option><option>Lina</option><option>Sam</option></select><select value={ticket.status} onChange={(e)=>updateAdminTicket(ticket.id,{status:e.target.value,source:undefined},"Ticket status updated.")} className="input py-2 sm:w-40"><option>Open</option><option>In Progress</option><option>Resolved</option></select></div></div>)}</div></div>;
}
