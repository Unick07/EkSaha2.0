import { useState } from "react";
import { Plus, Send } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import { Modal } from "../../components/dashboard/Modal";
import { useAdminStore } from "../../store/useAdminStore";
import { useUserDashboardStore } from "../../store/useUserDashboardStore";

export default function Tickets() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const { tickets, createTicket, replyTicket } = useUserDashboardStore();
  const receiveUserTicket = useAdminStore((state) => state.receiveUserTicket);
  const selected = tickets.find((ticket) => ticket.id === selectedId);

  const create = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const ticket = {
      id: `NX-${Date.now().toString().slice(-5)}`,
      subject: data.get("subject"),
      priority: data.get("priority"),
      message: data.get("message"),
      user: "Jordan Lee",
    };
    createTicket(ticket);
    receiveUserTicket(ticket);
    fetch("/api/demo/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ticket),
    }).catch(() => toast.error("Ticket saved locally, but admin sync failed."));
    setCreateOpen(false);
    toast.success("Ticket created.");
  };
  const reply = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    replyTicket(selected.id, data.get("reply"));
    event.currentTarget.reset();
    toast.success("Reply added.");
  };

  return <div>
    <div className="mb-7 flex items-center justify-between"><div><h2 className="text-2xl font-bold">Support tickets</h2><p className="mt-1 text-sm text-slate-500">Ask for help and follow every conversation.</p></div><Button onClick={() => setCreateOpen(true)}><Plus size={16}/>New ticket</Button></div>
    <div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-white/5"><tr><th className="p-5">Ticket</th><th>Priority</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>{tickets.map(ticket => <tr className="border-t border-slate-100 dark:border-white/10" key={ticket.id}><td className="p-5"><div className="font-semibold">{ticket.subject}</div><div className="mt-1 text-xs text-slate-400">{ticket.id}</div></td><td><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold dark:bg-white/10">{ticket.priority}</span></td><td><span className="text-xs font-bold text-blue-600">{ticket.status}</span></td><td className="text-slate-500">{ticket.updated}</td><td><button onClick={() => setSelectedId(ticket.id)} className="font-bold text-electric">View</button></td></tr>)}</tbody></table></div></div>
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New support ticket"><form onSubmit={create} className="space-y-4"><input name="subject" required className="input" placeholder="What do you need help with?"/><select name="priority" className="input"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select><textarea name="message" required className="input min-h-32 resize-none" placeholder="Add details..."/><Button className="w-full">Create ticket</Button></form></Modal>
    <Modal open={Boolean(selected)} onClose={() => setSelectedId(null)} title={selected?.subject} description={`${selected?.id} | ${selected?.status} | ${selected?.priority} priority`}><div className="space-y-3">{selected?.messages.map((message,index) => <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 dark:bg-white/5" key={`${message}-${index}`}>{message}</div>)}</div><form onSubmit={reply} className="mt-5 flex gap-2"><input name="reply" required className="input" placeholder="Write a reply..."/><Button><Send size={16}/></Button></form></Modal>
  </div>;
}
