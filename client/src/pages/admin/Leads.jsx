import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import toast from "react-hot-toast";
import ActionMenu from "../../components/dashboard/ActionMenu";
import { Modal } from "../../components/dashboard/Modal";
import api from "../../services/http/api";

const STATUSES = ["new", "contacted", "converted", "closed"];

const statusPillClass = {
  new: "bg-primary/10 text-primary",
  contacted: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  converted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  closed: "bg-surface-raised text-muted",
};

const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
const capitalize = (value) => value ? String(value).charAt(0).toUpperCase() + String(value).slice(1) : "";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.get("/admin/leads")
      .then(({ data }) => { if (active) setLeads(data); })
      .catch((caught) => {
        const message = caught.response?.data?.message || "Could not load leads.";
        if (active) setError(message);
        toast.error(message);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const updateStatus = async (lead, status) => {
    const previous = leads;
    setLeads((items) => items.map((item) => item.id === lead.id ? { ...item, status } : item));
    try {
      await api.patch(`/admin/leads/${lead.id}`, { status });
      toast.success("Lead updated.");
    } catch (caught) {
      setLeads(previous);
      toast.error(caught.response?.data?.message || "Could not update this lead.");
    }
  };

  const filtered = statusFilter === "All" ? leads : leads.filter((lead) => lead.status === statusFilter);

  return <div>
    <div className="mb-7">
      <h2 className="text-2xl font-bold">Leads</h2>
      <p className="mt-1 text-sm text-muted">Contact form submissions from the marketing site.</p>
    </div>

    {loading && <div className="panel p-5 text-sm text-muted">Loading leads...</div>}
    {error && <div className="panel border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>}

    {!loading && !error && <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
        {["All", ...STATUSES].map((filter) => <button
          key={filter}
          type="button"
          onClick={() => setStatusFilter(filter)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition ${statusFilter === filter ? "bg-primary text-primary-foreground" : "bg-surface-raised text-muted hover:text-text"}`}
        >{filter}</button>)}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-surface-raised text-xs uppercase text-muted">
            <tr><th className="p-5">Name</th><th>Interested in</th><th>Status</th><th>Received</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((lead) => <tr className="border-t border-border" key={lead.id}>
              <td className="p-5"><div className="font-semibold">{lead.name}</div><div className="mt-1 text-xs text-muted">{lead.email}</div></td>
              <td>{lead.serviceInterest || "Not specified"}</td>
              <td><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusPillClass[lead.status] || "bg-surface-raised text-muted"}`}>{lead.status}</span></td>
              <td className="text-muted">{formatDate(lead.createdAt)}</td>
              <td><ActionMenu actions={[
                { label: "View message", icon: Eye, onClick: () => setViewing(lead) },
                ...STATUSES.filter((status) => status !== lead.status).map((status) => ({
                  label: `Mark ${status}`,
                  onClick: () => updateStatus(lead, status),
                })),
              ]}/></td>
            </tr>)}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="border-t border-border p-6 text-sm text-muted">No leads match this filter.</div>}
      </div>
    </div>}

    <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title={viewing?.name} description={viewing?.email}>
      {viewing && <div className="space-y-4 text-sm">
        <div><span className="text-xs font-bold uppercase tracking-wider text-muted">Interested in</span><p className="mt-1">{viewing.serviceInterest || "Not specified"}</p></div>
        <div><span className="text-xs font-bold uppercase tracking-wider text-muted">Message</span><p className="mt-1 whitespace-pre-wrap leading-6">{viewing.message}</p></div>
        <div><span className="text-xs font-bold uppercase tracking-wider text-muted">Status</span><p className="mt-1 capitalize">{capitalize(viewing.status)} · Received {formatDate(viewing.createdAt)}</p></div>
      </div>}
    </Modal>
  </div>;
}
