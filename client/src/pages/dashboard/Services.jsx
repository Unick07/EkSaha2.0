import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import { Modal } from "../../components/dashboard/Modal";
import api from "../../services/http/api";
import useHeaderAction from "../../hooks/useHeaderAction";

const formatPrice = (cents) => cents
  ? `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}/mo`
  : "Included in your plan";

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  const openRequest = useCallback(() => setRequestOpen(true), []);
  useHeaderAction({ label: "New request", icon: Plus, onClick: openRequest });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.get("/services/me")
      .then(({ data }) => { if (active) setServices(data || []); })
      .catch((caught) => {
        const message = caught.response?.data?.message || "Could not load your services.";
        if (active) setError(message);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

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
    {loading && <div className="panel p-6 text-sm text-muted">Loading your services...</div>}
    {error && <div className="panel border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
    {!loading && !error && (services.length === 0
      ? <div className="panel p-6 text-sm text-muted">No active services yet. Create a request and our team will set one up for you.</div>
      : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => <div className="panel p-6" key={service.id}>
          <div className="text-xs font-bold uppercase tracking-wider text-muted">{service.category}</div>
          <h3 className="mt-2 text-lg font-bold">{service.name}</h3>
          {service.description && <p className="mt-2 text-sm leading-6 text-muted">{service.description}</p>}
          <div className="mt-4 text-sm font-semibold text-primary">{formatPrice(service.monthlyPrice)}</div>
        </div>)}
      </div>)}
    <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Create service request" description="The request will also appear in support tickets."><form className="space-y-4" onSubmit={createRequest}><input required name="subject" className="input" placeholder="Request title"/><select name="priority" className="input"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select><textarea required name="details" className="input min-h-32 resize-none" placeholder="Describe the result you need..."/><Button className="w-full">Create request</Button></form></Modal>
  </div>;
}
