import { useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Send, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import { Modal } from "../../components/dashboard/Modal";
import { serviceItems } from "./data";

export default function Overview() {
  const [messageOpen, setMessageOpen] = useState(false);
  const sendMessage = (event) => {
    event.preventDefault();
    setMessageOpen(false);
    toast.success("Message sent to Amelia.");
  };

  return <div className="space-y-7">
    <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-accent p-7 text-primary-foreground"><div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end"><div><div className="text-sm opacity-80">Current plan</div><h2 className="mt-2 text-3xl font-extrabold">Growth</h2><p className="mt-2 text-sm opacity-85">3 active services | Unlimited requests</p></div><Button to="/pricing" variant="secondary" className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">Manage plan <ArrowRight size={16}/></Button></div></div>
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{[[TrendingUp,"12","Requests completed","+18% this month"],[Clock3,"3","In progress","Across 3 services"],[CalendarDays,"Jul 1","Next billing date","$999.00 scheduled"],[CheckCircle2,"94%","Satisfaction score","From 16 ratings"]].map(([Icon,value,label,copy]) => <div className="panel p-5" key={label}><Icon size={20} className="text-electric"/><div className="mt-5 text-2xl font-extrabold">{value}</div><div className="mt-1 text-sm font-semibold">{label}</div><div className="mt-1 text-xs text-slate-500">{copy}</div></div>)}</div>
    <div className="grid gap-7 xl:grid-cols-[1.3fr_.7fr]"><div className="panel p-6"><div className="flex items-center justify-between"><h3 className="font-bold">Active work</h3><Button to="/dashboard/services" variant="ghost">View all</Button></div><div className="mt-4 space-y-4">{serviceItems.map(({ title, type, progress, width }) => <div className="rounded-2xl border border-slate-100 p-4 dark:border-white/10" key={title}><div className="flex justify-between"><div><div className="font-semibold">{title}</div><div className="mt-1 text-xs text-slate-500">{type}</div></div><span className="h-fit rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/10">ON TRACK</span></div><div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-white/10"><div className={`h-full rounded-full bg-electric ${width}`} /></div><span className="sr-only">{progress}% complete</span></div>)}</div></div><div className="panel p-6"><h3 className="font-bold">Your strategist</h3><div className="mt-6 flex items-center gap-4"><span className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-blue-500 text-lg font-bold text-white">AM</span><div><div className="font-bold">Amelia Morgan</div><div className="text-xs text-slate-500">Growth strategist</div></div></div><p className="mt-6 text-sm leading-6 text-slate-500">Your next strategy call is Thursday, June 18 at 10:00 AM.</p><Button onClick={() => setMessageOpen(true)} variant="secondary" className="mt-6 w-full">Message Amelia</Button></div></div>
    <Modal open={messageOpen} onClose={() => setMessageOpen(false)} title="Message Amelia" description="Your strategist will reply in the dashboard and by email."><form onSubmit={sendMessage}><textarea required className="input min-h-36 resize-none" placeholder="Share a question or update..." /><Button className="mt-4 w-full">Send message <Send size={16}/></Button></form></Modal>
  </div>;
}
