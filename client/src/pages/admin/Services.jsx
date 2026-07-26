import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Edit3, Plus, UserMinus, Users as UsersIcon } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import ActionMenu from "../../components/dashboard/ActionMenu";
import { ConfirmDialog, Modal } from "../../components/dashboard/Modal";
import api from "../../services/http/api";
import useHeaderAction from "../../hooks/useHeaderAction";
import { roleBadgeClass } from "../../lib/roles";

const STATUS_FILTERS = ["All", "Active", "Paused", "Archived"];

const statusPillClass = {
  Active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  Paused: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  Archived: "bg-surface-raised text-muted",
};

const formatPrice = (cents) => cents
  ? `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}/mo`
  : "—";

export default function Services({ mode = "admin" }) {
  const canWrite = mode === "admin";
  const canAssign = mode === "admin" || mode === "support";
  const canManageRow = canWrite || canAssign;

  const [services, setServices] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [clientOptions, setClientOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editing, setEditing] = useState(null);
  const [archiving, setArchiving] = useState(null);
  const [managing, setManaging] = useState(null);
  const [managingClients, setManagingClients] = useState([]);
  const [managingLoading, setManagingLoading] = useState(false);

  const openCreate = useCallback(() => setEditing({}), []);
  useHeaderAction({ label: "Create service", icon: Plus, onClick: openCreate, enabled: canWrite });

  const load = () => {
    setLoading(true);
    setError("");
    return Promise.all([api.get("/services"), api.get("/services/workload")])
      .then(([servicesResponse, workloadResponse]) => {
        setServices(servicesResponse.data);
        setWorkload(workloadResponse.data);
      })
      .catch((caught) => {
        const message = caught.response?.data?.message || "Could not load services.";
        setError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!canAssign) return undefined;
    let active = true;
    api.get("/admin/users", { params: { roles: "user" } })
      .then(({ data }) => { if (active) setClientOptions(data); })
      .catch(() => {});
    return () => { active = false; };
  }, [canAssign]);

  const owners = useMemo(() => workload.filter((member) => member.role !== "billing"), [workload]);
  const filtered = useMemo(
    () => statusFilter === "All" ? services : services.filter((service) => service.status === statusFilter),
    [services, statusFilter],
  );

  const save = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      description: form.get("description"),
      category: form.get("category"),
      status: form.get("status"),
      monthlyPrice: Math.round((Number(form.get("price")) || 0) * 100),
      ownerId: form.get("ownerId") || null,
    };
    const isEditing = Boolean(editing?.id);
    try {
      const { data } = isEditing
        ? await api.patch(`/services/${editing.id}`, payload)
        : await api.post("/services", payload);
      setServices((items) => isEditing
        ? items.map((item) => item.id === data.id ? data : item)
        : [data, ...items]);
      setEditing(null);
      toast.success("Service saved.");
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not save this service.");
    }
  };

  const confirmArchive = async () => {
    try {
      await api.delete(`/services/${archiving.id}`);
      setServices((items) => items.map((item) => item.id === archiving.id ? { ...item, status: "Archived" } : item));
      toast.success("Service archived.");
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not archive this service.");
    } finally {
      setArchiving(null);
    }
  };

  const openManage = async (service) => {
    setManaging(service);
    setManagingClients([]);
    setManagingLoading(true);
    try {
      const { data } = await api.get(`/services/${service.id}`);
      setManagingClients(data.clients || []);
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not load clients for this service.");
      setManaging(null);
    } finally {
      setManagingLoading(false);
    }
  };

  const addClient = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const { userId } = Object.fromEntries(new FormData(form));
    if (!userId) return;
    try {
      await api.post(`/services/${managing.id}/clients`, { userId });
      const client = clientOptions.find((item) => item.id === userId);
      setManagingClients((current) => [...current, { id: userId, name: client?.name, email: client?.email, status: "Active", assignedAt: new Date().toISOString() }]);
      setServices((items) => items.map((item) => item.id === managing.id ? { ...item, clientCount: (item.clientCount || 0) + 1 } : item));
      form.reset();
      toast.success("Client assigned.");
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not assign this client.");
    }
  };

  const removeClient = async (userId) => {
    try {
      await api.delete(`/services/${managing.id}/clients/${userId}`);
      setManagingClients((current) => current.filter((client) => client.id !== userId));
      setServices((items) => items.map((item) => item.id === managing.id ? { ...item, clientCount: Math.max(0, (item.clientCount || 0) - 1) } : item));
      toast.success("Client removed.");
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not remove this client.");
    }
  };

  const availableClients = clientOptions.filter((client) => !managingClients.some((assigned) => assigned.id === client.id));

  return <div>
    <div className="mb-4">
      <h2 className="text-lg font-bold">Team workload</h2>
      <p className="mt-1 text-sm text-muted">Clients, services owned and open tickets per team member.</p>
    </div>

    {loading && <div className="panel p-5 text-sm text-muted">Loading services...</div>}
    {error && <div className="panel border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>}

    {!loading && !error && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {workload.map((member) => <div className="panel p-6" key={member.id}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-navy to-brand-teal-deep text-sm font-bold text-white">{member.name?.[0]?.toUpperCase() || "?"}</span>
              <div className="min-w-0"><div className="truncate font-semibold">{member.name}</div><div className="truncate text-xs text-muted">{member.email}</div></div>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${roleBadgeClass[member.role] || "bg-surface-raised text-muted"}`}>{member.role}</span>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5 text-center">
            <div><div className="text-2xl font-extrabold">{member.clientCount}</div><div className="mt-1 text-xs text-muted">Clients</div></div>
            <div><div className="text-2xl font-extrabold">{member.serviceCount}</div><div className="mt-1 text-xs text-muted">Services owned</div></div>
            <div><div className="text-2xl font-extrabold">{member.openTicketCount}</div><div className="mt-1 text-xs text-muted">Open tickets</div></div>
          </div>
        </div>)}
        {workload.length === 0 && <div className="panel p-6 text-sm text-muted sm:col-span-2 xl:col-span-3">No team members yet.</div>}
      </div>

      <div className="panel mt-8 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
          {STATUS_FILTERS.map((filter) => <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${statusFilter === filter ? "bg-primary text-primary-foreground" : "bg-surface-raised text-muted hover:text-text"}`}
          >{filter}</button>)}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-surface-raised/60 text-xs uppercase text-muted">
              <tr><th className="p-5">Service</th><th>Owner</th><th>Active clients</th><th>Open tickets</th><th>Price</th><th>Status</th>{canManageRow && <th></th>}</tr>
            </thead>
            <tbody>
              {filtered.map((service) => <tr className="border-t border-border" key={service.id}>
                <td className="p-5"><div className="font-semibold">{service.name}</div><div className="mt-1 text-xs text-muted">{service.category}</div></td>
                <td>{service.owner || "Unassigned"}</td>
                <td>{service.clientCount ?? 0}</td>
                <td>{service.openTicketCount ?? 0}</td>
                <td>{formatPrice(service.monthlyPrice)}</td>
                <td><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusPillClass[service.status] || "bg-surface-raised text-muted"}`}>{service.status}</span></td>
                {canManageRow && <td><ActionMenu actions={[
                  ...(canWrite ? [{ label: "Edit", icon: Edit3, onClick: () => setEditing(service) }] : []),
                  ...(canAssign ? [{ label: "Manage clients", icon: UsersIcon, onClick: () => openManage(service) }] : []),
                  ...(canWrite ? [{ label: "Archive", icon: Archive, danger: true, disabled: service.status === "Archived", onClick: () => setArchiving(service) }] : []),
                ]}/></td>}
              </tr>)}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="border-t border-border p-6 text-sm text-muted">No services match this filter.</div>}
        </div>
      </div>
    </>}

    {canWrite && <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? "Edit service" : "Create service"}>
      <form className="space-y-4" onSubmit={save}>
        <label className="block text-sm font-semibold">Service name
          <input required name="name" className="input mt-2" defaultValue={editing?.name} placeholder="Web Development"/>
        </label>
        <label className="block text-sm font-semibold">Description
          <textarea name="description" className="input mt-2 min-h-24 resize-none" defaultValue={editing?.description} placeholder="What this service covers"/>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm font-semibold">Category
            <input name="category" className="input mt-2" defaultValue={editing?.category || "General"}/>
          </label>
          <label className="block text-sm font-semibold">Status
            <select name="status" className="input mt-2" defaultValue={editing?.status || "Active"}>
              <option>Active</option><option>Paused</option><option>Archived</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm font-semibold">Price (USD/mo)
            <input name="price" type="number" min="0" step="0.01" className="input mt-2" defaultValue={editing?.monthlyPrice ? (editing.monthlyPrice / 100).toFixed(2) : ""} placeholder="0.00"/>
          </label>
          <label className="block text-sm font-semibold">Owner
            <select name="ownerId" className="input mt-2" defaultValue={editing?.ownerId || ""}>
              <option value="">Unassigned</option>
              {owners.map((member) => <option key={member.id} value={member.id}>{member.name} ({member.role})</option>)}
            </select>
          </label>
        </div>
        <Button className="w-full">Save service</Button>
      </form>
    </Modal>}

    {canWrite && <ConfirmDialog
      open={Boolean(archiving)}
      onClose={() => setArchiving(null)}
      title="Archive service?"
      description={`Are you sure you want to archive ${archiving?.name || "this service"}? It will be hidden from active listings and its history is preserved.`}
      confirmLabel="Archive service"
      danger
      onConfirm={confirmArchive}
    />}

    {canAssign && <Modal open={Boolean(managing)} onClose={() => setManaging(null)} title="Manage clients" description={managing?.name}>
      <div className="space-y-5">
        <form onSubmit={addClient} className="flex gap-2">
          <select required name="userId" className="input flex-1">
            <option value="">Select a client</option>
            {availableClients.map((client) => <option key={client.id} value={client.id}>{client.name} ({client.email})</option>)}
          </select>
          <Button>Add</Button>
        </form>
        <div className="space-y-2">
          {managingLoading && <div className="text-sm text-muted">Loading clients...</div>}
          {!managingLoading && managingClients.map((client) => <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3" key={client.id}>
            <div className="min-w-0"><div className="truncate text-sm font-semibold">{client.name}</div><div className="truncate text-xs text-muted">{client.email}</div></div>
            <button type="button" onClick={() => removeClient(client.id)} className="icon-button shrink-0" aria-label="Remove client"><UserMinus size={16}/></button>
          </div>)}
          {!managingLoading && managingClients.length === 0 && <div className="text-sm text-muted">No clients assigned yet.</div>}
        </div>
      </div>
    </Modal>}
  </div>;
}
