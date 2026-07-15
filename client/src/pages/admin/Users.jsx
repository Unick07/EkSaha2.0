import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Search, ShieldBan, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import ActionMenu from "../../components/dashboard/ActionMenu";
import { ConfirmDialog, Modal } from "../../components/dashboard/Modal";
import api from "../../services/http/api";

const formatDate = (value) => {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState("All plans");
  const [role, setRole] = useState("All roles");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.get("/admin/users")
      .then(({ data }) => {
        if (active) setUsers(data);
      })
      .catch((caught) => {
        const message = caught.response?.data?.message || "Could not load users.";
        if (active) setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => users.filter((user) => {
    const searchable = `${user.name || ""} ${user.email || ""}`.toLowerCase();
    return searchable.includes(query.toLowerCase())
      && (plan === "All plans" || (user.plan || "No plan") === plan)
      && (role === "All roles" || user.role === role);
  }), [plan, query, role, users]);

  const plans = useMemo(() => [...new Set(users.map((user) => user.plan || "No plan"))], [users]);
  const roles = useMemo(() => [...new Set(users.map((user) => user.role).filter(Boolean))], [users]);

  const save = (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (editing?.id) {
      setUsers((items) => items.map((user) => user.id === editing.id ? { ...user, ...data } : user));
      toast.success("User updated locally. Real update API wiring is still needed.");
    } else {
      setUsers((items) => [{ id: Date.now(), createdAt: new Date().toISOString(), ...data }, ...items]);
      toast.success("User added locally. Real create API wiring is still needed.");
    }
    setEditing(null);
  };

  const confirmDelete = () => {
    setUsers((items) => items.filter((user) => user.id !== deleting.id));
    setDeleting(null);
    toast.success("User deleted locally. Real delete API wiring is still needed.");
  };

  return <div>
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-bold">User management</h2><p className="mt-1 text-sm text-slate-500">Manage accounts, access and assigned plans.</p></div><Button onClick={() => setEditing({})}><Plus size={16}/>Add user</Button></div>
    <div className="panel mb-5 flex flex-col gap-3 p-4 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3.5 text-slate-400" size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} className="input pl-10" placeholder="Search users..."/></div><select value={plan} onChange={(event) => setPlan(event.target.value)} className="input sm:w-44"><option>All plans</option>{plans.map((item) => <option key={item}>{item}</option>)}</select><select value={role} onChange={(event) => setRole(event.target.value)} className="input sm:w-44"><option>All roles</option>{roles.map((item) => <option key={item}>{item}</option>)}</select></div>
    {loading && <div className="panel p-5 text-sm text-muted">Loading users...</div>}
    {error && <div className="panel border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
    {!loading && !error && <div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-white/5"><tr><th className="p-5">User</th><th>Role</th><th>Plan</th><th>Created</th><th></th></tr></thead><tbody>{filtered.map((user) => <tr className="border-t border-slate-100 dark:border-white/10" key={user.id}><td className="p-5"><div className="font-semibold">{user.name}</div><div className="mt-1 text-xs text-slate-400">{user.email}</div></td><td><span className="rounded-full bg-surface-raised px-2.5 py-1 text-xs font-bold capitalize">{user.role}</span></td><td>{user.plan || "No plan"}</td><td className="text-slate-500">{formatDate(user.createdAt)}</td><td><ActionMenu actions={[{ label: "Edit user", icon: Edit3, onClick: () => setEditing(user) }, { label: "Suspend", icon: ShieldBan, onClick: () => toast.success("Real status API wiring is still needed.") }, { label: "Delete user", icon: Trash2, danger: true, onClick: () => setDeleting(user) }]}/></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="border-t border-border p-6 text-sm text-muted">No users match your filters.</div>}</div></div>}
    <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? "Edit user" : "Add user"}><form onSubmit={save} className="space-y-4"><input name="name" required className="input" defaultValue={editing?.name} placeholder="Full name"/><input name="email" required type="email" className="input" defaultValue={editing?.email} placeholder="Email"/><select name="role" className="input" defaultValue={editing?.role || "user"}><option>user</option><option>admin</option><option>support</option><option>billing</option></select><input name="plan" className="input" defaultValue={editing?.plan || ""} placeholder="Plan name"/><Button className="w-full">{editing?.id ? "Save changes" : "Add user"}</Button></form></Modal>
    <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete user?" description={`${deleting?.name || "This user"} will be removed locally. The real delete API still needs to be wired.`} confirmLabel="Delete user" danger onConfirm={confirmDelete}/>
  </div>;
}
