import { useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import { Modal } from "../../components/dashboard/Modal";
import api from "../../services/http/api";

export default function Services() {
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
    <div className="panel p-6 text-sm text-slate-500">No active services yet. Create a request and our team will set one up for you.</div>
    <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Create service request" description="The request will also appear in support tickets."><form className="space-y-4" onSubmit={createRequest}><input required name="subject" className="input" placeholder="Request title"/><select name="priority" className="input"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select><textarea required name="details" className="input min-h-32 resize-none" placeholder="Describe the result you need..."/><Button className="w-full">Create request</Button></form></Modal>
  </div>;
}
