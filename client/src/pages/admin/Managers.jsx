import { useEffect, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import ActionMenu from "../../components/dashboard/ActionMenu";
import { ConfirmDialog, Modal } from "../../components/dashboard/Modal";
import api from "../../services/http/api";
import { useAdminStore } from "../../store/useAdminStore";

const formatToday = () => new Date().toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

// Types backed by a real D1-backed endpoint — same API the admin, support and
// billing workspaces all call, so every workspace shows identical live data.
const API_ENDPOINTS = { Blog: "/posts" };
const DELETE_SUPPORTED = { Blog: true };

const configs = {
  Services: {
    collection: "services",
    singular: "Service",
    columns: ["Name", "Owner", "Active clients", "Status"],
    fields: [
      { name: "name", label: "Service name" },
      { name: "owner", label: "Owner" },
      { name: "activeClients", label: "Active clients", type: "number" },
      { name: "status", label: "Status", options: ["Active", "Paused"] },
    ],
    values: (item) => [item.name, item.owner, item.activeClients, item.status],
  },
  Blog: {
    collection: "posts",
    singular: "Blog",
    columns: ["Title", "Slug", "Category", "Status", "Updated"],
    fields: [
      { name: "title", label: "Post title" },
      { name: "slug", label: "URL slug", placeholder: "my-blog-post" },
      { name: "excerpt", label: "Excerpt" },
      { name: "content", label: "Markdown content", multiline: true },
      { name: "category", label: "Category" },
      { name: "status", label: "Status", options: ["Draft", "Published"] },
      { name: "updated", label: "Updated", defaultValue: formatToday() },
    ],
    values: (item) => [item.title, item.slug, item.category, item.status, item.updated],
  },
};

export function ResourceManager({ type }) {
  const config = configs[type];
  const endpoint = API_ENDPOINTS[type];
  const records = useAdminStore((state) => state[config.collection]);
  const addRecord = useAdminStore((state) => state.addRecord);
  const updateRecord = useAdminStore((state) => state.updateRecord);
  const deleteRecord = useAdminStore((state) => state.deleteRecord);
  const ingestRecords = useAdminStore((state) => state.ingestRecords);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [loading, setLoading] = useState(Boolean(endpoint));
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!endpoint) return undefined;
    let active = true;
    setLoading(true);
    setLoadError("");
    api.get(endpoint)
      .then(({ data }) => {
        if (active) ingestRecords(config.collection, data);
      })
      .catch((error) => {
        const message = error.response?.data?.message || `Could not load ${type.toLowerCase()}.`;
        if (active) setLoadError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [config.collection, endpoint, ingestRecords, type]);

  const save = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));

    if (endpoint) {
      const isEditing = Boolean(editing?.id);
      try {
        const response = isEditing
          ? await api.patch(`${endpoint}/${editing.id}`, data)
          : await api.post(endpoint, data);
        const record = response.data;
        if (isEditing) updateRecord(config.collection, editing.id, record);
        else ingestRecords(config.collection, [record, ...records]);
        setEditing(null);
        toast.success(type === "Blog" ? "Blog saved and visible in public insights." : `${config.singular} saved.`);
      } catch (error) {
        toast.error(error.response?.data?.message || error.message || `Could not save this ${config.singular.toLowerCase()}.`);
      }
      return;
    }

    if (editing?.id) updateRecord(config.collection, editing.id, data);
    else addRecord(config.collection, data);

    setEditing(null);
    toast.success(`${config.singular} saved.`);
  };

  const confirmDelete = async () => {
    if (endpoint && DELETE_SUPPORTED[type]) {
      try {
        await api.delete(`${endpoint}/${deleting.id}`);
        deleteRecord(config.collection, deleting.id);
        toast.success("Blog removed from public insights.");
      } catch (error) {
        toast.error(error.response?.data?.message || error.message || "Could not delete the public post.");
      } finally {
        setDeleting(null);
      }
      return;
    }

    deleteRecord(config.collection, deleting.id);
    setDeleting(null);
    toast.success("Record deleted.");
  };

  const canDelete = !endpoint || DELETE_SUPPORTED[type];

  return <div>
    <div className="mb-7 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">{type}</h2>
        <p className="mt-1 text-sm text-muted">Create, update and manage {type.toLowerCase()} records.</p>
      </div>
      <Button onClick={() => setEditing({})}><Plus size={16} />Create new</Button>
    </div>

    {endpoint && loading && <div className="panel mb-5 p-5 text-sm text-muted">Loading {type.toLowerCase()}...</div>}
    {endpoint && loadError && <div className="panel mb-5 border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{loadError}</div>}

    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface-raised/60 text-xs uppercase text-muted dark:bg-white/5">
            <tr>{config.columns.map((column) => <th className="p-5" key={column}>{column}</th>)}<th /></tr>
          </thead>
          <tbody>
            {records.map((record) => <tr className="border-t border-border dark:border-white/10" key={record.id}>
              {config.values(record).map((value, index) => <td className="p-5" key={`${record.id}-${config.columns[index]}`}>{value}</td>)}
              <td>
                <ActionMenu actions={[
                  { label: "Edit", icon: Edit3, onClick: () => setEditing(record) },
                  ...(canDelete ? [{ label: "Delete", icon: Trash2, danger: true, onClick: () => setDeleting(record) }] : []),
                ]} />
              </td>
            </tr>)}
          </tbody>
        </table>
        {records.length === 0 && !loading && <div className="border-t border-border p-6 text-sm text-muted dark:border-white/10">No {type.toLowerCase()} yet.</div>}
      </div>
    </div>

    <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={`${editing?.id ? "Edit" : "Create"} ${config.singular}`}>
      <form className="space-y-4" onSubmit={save}>
        {config.fields.filter((field) => !(field.hideWhenEditing && editing?.id)).map((field) => {
          const options = field.options;
          const firstOptionValue = options ? (typeof options[0] === "object" ? options[0]?.value : options[0]) : undefined;
          return <label className="block text-sm font-semibold" key={field.name}>
            {field.label}
            {options ? <select required className="input mt-2" name={field.name} defaultValue={editing?.[field.name] || firstOptionValue}>
              {options.map((option) => {
                const value = typeof option === "object" ? option.value : option;
                const text = typeof option === "object" ? option.label : option;
                return <option key={value} value={value}>{text}</option>;
              })}
            </select> : field.multiline ? <textarea required className="input mt-2 min-h-40 resize-none" name={field.name} defaultValue={editing?.[field.name] || field.defaultValue || ""} placeholder={field.placeholder} /> : <input required className="input mt-2" type={field.type || "text"} name={field.name} defaultValue={editing?.[field.name] || field.defaultValue || ""} placeholder={field.placeholder} />}
          </label>;
        })}
        <Button className="w-full">Save {config.singular.toLowerCase()}</Button>
      </form>
    </Modal>

    {canDelete && <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} title={`Delete ${config.singular.toLowerCase()}?`} description="This record will be removed from the workspace." confirmLabel="Delete" danger onConfirm={confirmDelete} />}
  </div>;
}

export function AdminSettings() {
  const { settings, updateSettings } = useAdminStore();
  const save = (event) => {
    event.preventDefault();
    updateSettings(Object.fromEntries(new FormData(event.currentTarget)));
    toast.success("Workspace settings saved.");
  };

  return <div>
    <div className="mb-7">
      <h2 className="text-2xl font-bold">Settings</h2>
      <p className="mt-1 text-sm text-muted">Configure plans, roles and operational preferences.</p>
    </div>
    <form onSubmit={save} className="panel max-w-3xl p-7">
      <h3 className="font-bold">Workspace settings</h3>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold">Company name<input name="company" className="input mt-2" defaultValue={settings.company} /></label>
        <label className="text-sm font-semibold">Support email<input name="email" type="email" className="input mt-2" defaultValue={settings.email} /></label>
        <label className="text-sm font-semibold">Default currency<select name="currency" className="input mt-2" defaultValue={settings.currency}><option>USD</option><option>EUR</option><option>GBP</option></select></label>
        <label className="text-sm font-semibold">Default user role<select name="role" className="input mt-2" defaultValue={settings.role}><option>Support Agent</option><option>Billing Manager</option><option>Super Admin</option></select></label>
      </div>
      <Button className="mt-7">Save settings</Button>
    </form>
  </div>;
}
