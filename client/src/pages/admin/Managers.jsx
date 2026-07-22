import { useEffect, useRef, useState } from "react";
import { Edit3, ImagePlus, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import ActionMenu from "../../components/dashboard/ActionMenu";
import { ConfirmDialog, Modal } from "../../components/dashboard/Modal";
import api from "../../services/http/api";
import { useAdminStore } from "../../store/useAdminStore";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const slugify = (value) => String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

// Bundles the title input with an auto-generated, optionally-editable slug so
// admins don't have to hand-type a URL for every post. Still submits both
// `title` and `slug` as plain form fields, so ResourceManager's save() -
// which just reads FormData - needed no changes.
function TitleSlugField({ label, initialTitle, initialSlug }) {
  const [title, setTitle] = useState(initialTitle || "");
  const [slug, setSlug] = useState(initialSlug || slugify(initialTitle));
  const [slugTouched, setSlugTouched] = useState(Boolean(initialSlug));
  const [editingSlug, setEditingSlug] = useState(false);

  const onTitleChange = (event) => {
    const value = event.target.value;
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const onSlugChange = (event) => {
    setSlug(slugify(event.target.value));
    setSlugTouched(true);
  };

  return <div>
    <label className="block text-sm font-semibold">{label}
      <input required name="title" className="input mt-2" value={title} onChange={onTitleChange} placeholder="Your post title" />
    </label>
    <input type="hidden" name="slug" value={slug} />
    <div className="mt-2 text-xs text-muted">
      {editingSlug ? <span className="inline-flex flex-wrap items-center gap-1.5">
        <span>URL: eksaha.com/blog/</span>
        <input className="input w-auto min-w-0 flex-1 px-2 py-1 text-xs" value={slug} onChange={onSlugChange} placeholder="my-blog-post" />
        <button type="button" onClick={() => setEditingSlug(false)} className="font-bold text-primary hover:text-accent">Done</button>
      </span> : <span>
        URL: eksaha.com/blog/{slug || "..."}{" "}
        <button type="button" onClick={() => setEditingSlug(true)} className="font-bold text-primary hover:text-accent">Edit</button>
      </span>}
    </div>
  </div>;
}

function StatusToggleField({ name, label, initialValue }) {
  const [published, setPublished] = useState(initialValue === "Published");
  return <div>
    <span className="mb-2 block text-sm font-semibold">{label}</span>
    <input type="hidden" name={name} value={published ? "Published" : "Draft"} />
    <button type="button" onClick={() => setPublished((value) => !value)} className="flex items-center gap-3">
      <span className={`relative h-7 w-12 shrink-0 rounded-full border transition ${published ? "border-primary bg-primary" : "border-border bg-surface-raised"}`}>
        <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform ${published ? "translate-x-5" : "translate-x-0.5"}`} />
      </span>
      <span className={`text-sm font-bold ${published ? "text-primary" : "text-muted"}`}>{published ? "Published" : "Draft"}</span>
    </button>
  </div>;
}

function ImageUploadField({ name, label, initialValue }) {
  const [imageUrl, setImageUrl] = useState(initialValue || "");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  const upload = async (file) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Please choose a JPG, PNG, WEBP or GIF image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Images must be under 5MB.");
      return;
    }
    const form = new FormData();
    form.append("image", file);
    setUploading(true);
    setProgress(0);
    try {
      const { data } = await api.post("/admin/upload-image", form, {
        onUploadProgress: (event) => setProgress(event.total ? Math.round((event.loaded / event.total) * 100) : 0),
      });
      setImageUrl(data.url);
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not upload image.");
    } finally {
      setUploading(false);
    }
  };

  return <div>
    <span className="mb-2 block text-sm font-semibold">{label}</span>
    <input type="hidden" name={name} value={imageUrl} />
    {imageUrl ? <div className="relative overflow-hidden rounded-xl border border-border">
      <img src={imageUrl} alt="Featured" className="h-40 w-full object-cover" />
      <button type="button" onClick={() => setImageUrl("")} className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-black/80">
        <X size={13} />Remove
      </button>
    </div> : <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-raised py-9 text-sm text-muted transition hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {uploading ? <>
        <LoaderCircle size={20} className="animate-spin text-primary" />
        <span>Uploading... {progress}%</span>
      </> : <>
        <ImagePlus size={22} />
        <span className="font-semibold">Click to upload a featured image</span>
        <span className="text-xs text-muted">JPG, PNG, WEBP or GIF, up to 5MB</span>
      </>}
    </button>}
    <input ref={inputRef} type="file" accept={IMAGE_TYPES.join(",")} className="hidden" onChange={(event) => upload(event.target.files?.[0])} />
  </div>;
}

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
      { name: "title", label: "Post title", type: "title-slug" },
      { name: "image", label: "Featured image", type: "image" },
      { name: "excerpt", label: "Excerpt" },
      { name: "content", label: "Markdown content", multiline: true },
      { name: "category", label: "Category", options: ["Insights", "SEO", "Web", "Strategy", "Ads", "IT Support"], row: "meta" },
      { name: "status", label: "Status", type: "status-toggle", options: ["Draft", "Published"], row: "meta" },
    ],
    values: (item) => [item.title, item.slug, item.category, item.status, item.updated],
  },
};

function renderField(field, editing) {
  if (field.type === "title-slug") {
    return <TitleSlugField key={field.name} label={field.label} initialTitle={editing?.title} initialSlug={editing?.slug} />;
  }
  if (field.type === "image") {
    return <ImageUploadField key={field.name} name={field.name} label={field.label} initialValue={editing?.[field.name]} />;
  }
  if (field.type === "status-toggle") {
    return <StatusToggleField key={field.name} name={field.name} label={field.label} initialValue={editing?.[field.name]} />;
  }

  const currentValue = editing?.[field.name];
  // A dropdown's options can't cover every value a record might already have
  // (e.g. free-text data from before this field became a fixed list) - if the
  // current value isn't one of them, it's appended so saving never silently
  // swaps it out for whatever option happens to render first.
  const options = field.options && currentValue && !field.options.some((option) => (typeof option === "object" ? option.value : option) === currentValue)
    ? [...field.options, currentValue]
    : field.options;
  const firstOptionValue = options ? (typeof options[0] === "object" ? options[0]?.value : options[0]) : undefined;

  return <label className="block text-sm font-semibold" key={field.name}>
    {field.label}
    {options ? <select required className="input mt-2" name={field.name} defaultValue={currentValue || firstOptionValue}>
      {options.map((option) => {
        const value = typeof option === "object" ? option.value : option;
        const text = typeof option === "object" ? option.label : option;
        return <option key={value} value={value}>{text}</option>;
      })}
    </select> : field.multiline ? <textarea required className="input mt-2 min-h-40 resize-none" name={field.name} defaultValue={currentValue || field.defaultValue || ""} placeholder={field.placeholder} /> : <input required className="input mt-2" type={field.type || "text"} name={field.name} defaultValue={currentValue || field.defaultValue || ""} placeholder={field.placeholder} />}
  </label>;
}

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
        <p className="mt-1 text-sm text-slate-500">Create, update and manage {type.toLowerCase()} records.</p>
      </div>
      <Button onClick={() => setEditing({})}><Plus size={16} />Create new</Button>
    </div>

    {endpoint && loading && <div className="panel mb-5 p-5 text-sm text-muted">Loading {type.toLowerCase()}...</div>}
    {endpoint && loadError && <div className="panel mb-5 border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{loadError}</div>}

    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-white/5">
            <tr>{config.columns.map((column) => <th className="p-5" key={column}>{column}</th>)}<th /></tr>
          </thead>
          <tbody>
            {records.map((record) => <tr className="border-t border-slate-100 dark:border-white/10" key={record.id}>
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
        {records.length === 0 && !loading && <div className="border-t border-slate-100 p-6 text-sm text-slate-500 dark:border-white/10">No {type.toLowerCase()} yet.</div>}
      </div>
    </div>

    <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={`${editing?.id ? "Edit" : "Create"} ${config.singular}`}>
      <form className="space-y-5" onSubmit={save}>
        {(() => {
          const fields = config.fields.filter((field) => !(field.hideWhenEditing && editing?.id));
          const nodes = [];
          for (let i = 0; i < fields.length; i += 1) {
            const field = fields[i];
            const next = fields[i + 1];
            if (field.row && next?.row === field.row) {
              nodes.push(<div className="grid grid-cols-2 gap-4" key={`row-${field.row}`}>{renderField(field, editing)}{renderField(next, editing)}</div>);
              i += 1;
            } else {
              nodes.push(renderField(field, editing));
            }
          }
          return nodes;
        })()}
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
      <p className="mt-1 text-sm text-slate-500">Configure plans, roles and operational preferences.</p>
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
