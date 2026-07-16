import { useState } from "react";
import { CheckCircle2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import { Modal } from "../../components/dashboard/Modal";
import api from "../../services/http/api";
import { serviceItems } from "./data";

export default function Services() {
  const [selected, setSelected] = useState(null);
  const [requestOpen, setRequestOpen] = useState(false);

  const createRequest = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await api.post("/tickets", {
        subject: data.get("subject"),
        priority: data.get("priority"),
        message: data.get("details"),
      });
      setRequestOpen(false);
      toast.success("Service request created.");
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not create service request.");
    }
  };

  return <div>
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-bold">Your service workspace</h2><p className="mt-1 text-sm text-slate-500">Track progress and manage priorities across your subscription.</p></div><Button onClick={() => setRequestOpen(true)}><Plus size={16}/>New request</Button></div>
    <div className="grid gap-6 lg:grid-cols-3">{serviceItems.map(({ title,type,status,progress,width,icon:Icon,...service }) => <div className="panel p-6" key={title}><div className="flex items-start justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-electric dark:bg-blue-500/10"><Icon/></span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10">{status}</span></div><div className="mt-6 text-xs font-bold uppercase tracking-wider text-electric">{type}</div><h3 className="mt-2 text-xl font-bold">{title}</h3><div className="mt-6 flex justify-between text-xs"><span className="text-slate-500">Monthly roadmap</span><span className="font-bold">{progress}%</span></div><div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-white/10"><div className={`h-full rounded-full bg-electric ${width}`} /></div><Button onClick={() => setSelected({ title,type,status,progress,...service })} variant="secondary" className="mt-6 w-full">Open workspace</Button></div>)}</div>
    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title} description={`${selected?.type} workspace status and current priorities.`}><div className="space-y-3">{selected?.tasks?.map((task) => <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 dark:border-white/10" key={task}><CheckCircle2 className="text-emerald-500" size={18}/><span className="font-semibold">{task}</span></div>)}</div><Button onClick={() => { setSelected(null); setRequestOpen(true); }} className="mt-5 w-full">Add a priority</Button></Modal>
    <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Create service request" description="The request will also appear in support tickets."><form className="space-y-4" onSubmit={createRequest}><input required name="subject" className="input" placeholder="Request title"/><select name="priority" className="input"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select><textarea required name="details" className="input min-h-32 resize-none" placeholder="Describe the result you need..."/><Button className="w-full">Create request</Button></form></Modal>
  </div>;
}
