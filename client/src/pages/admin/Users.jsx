import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Search, ShieldBan, Trash2, UserCog } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import ActionMenu from "../../components/dashboard/ActionMenu";
import { ConfirmDialog, Modal } from "../../components/dashboard/Modal";
import api from "../../services/http/api";
import useHeaderAction from "../../hooks/useHeaderAction";

const formatDate = (value) => {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
};

export default function Users({ readOnly = false }) {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState("All plans");
  const [role, setRole] = useState("All roles");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const openAddUser = useCallback(() => setEditing({}), []);
  useHeaderAction({ label: "Add user", icon: Plus, onClick: openAddUser, enabled: !readOnly });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.get("/admin/users", { params: { roles: "user" } })
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

  useEffect(() => {
    if (readOnly) return undefined;
    let active = true;
    api.get("/admin/users", { params: { roles: "admin,support" } })
      .then(({ data }) => {
        if (active) setTeamMembers(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [readOnly]);

  const assignStrategist = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const { data: updated } = await api.patch(`/admin/users/${assigning.id}/assign`, { assignedTo: data.assignedTo || null });
      setUsers((items) => items.map((user) => user.id === updated.id ? updated : user));
      setAssigning(null);
      toast.success("Strategist assigned.");
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not assign strategist.");
    }
  };

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

  const confirmDelete = async () => {
    try {
      await api.delete(`/admin/users/${deleting.id}`);
      setUsers((items) => items.filter((user) => user.id !== deleting.id));
      toast.success(`${deleting.name} was deleted.`);
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not delete this user.");
    } finally {
      setDeleting(null);
    }
  };

  return <div>
    <div className="panel mb-5 flex flex-col gap-3 p-4 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3.5 text-muted/75" size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} className="input pl-10" placeholder="Search users..."/></div><select value={plan} onChange={(event) => setPlan(event.target.value)} className="input sm:w-44"><option>All plans</option>{plans.map((item) => <option key={item}>{item}</option>)}</select><select value={role} onChange={(event) => setRole(event.target.value)} className="input sm:w-44"><option>All roles</option>{roles.map((item) => <option key={item}>{item}</option>)}</select></div>
    {loading && <div className="panel p-5 text-sm text-muted">Loading users...</div>}
    {error && <div className="panel border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
    {!loading && !error && <div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="bg-surface-raised/60 text-xs uppercase tracking-wider text-muted"><tr><th className="p-5">User</th><th>Role</th><th>Plan</th><th>Created</th>{!readOnly && <th></th>}</tr></thead><tbody>{filtered.map((user) => <tr className="border-t border-border" key={user.id}><td className="p-5"><div className="font-semibold">{user.name}</div><div className="mt-1 text-xs text-muted/75">{user.email}</div></td><td><span className="rounded-full bg-surface-raised px-2.5 py-1 text-xs font-bold capitalize">{user.role}</span></td><td>{user.plan || "No plan"}</td><td className="text-muted">{formatDate(user.createdAt)}</td>{!readOnly && <td><ActionMenu actions={[{ label: "Edit user", icon: Edit3, onClick: () => setEditing(user) }, { label: "Assign strategist", icon: UserCog, onClick: () => setAssigning(user) }, { label: "Suspend", icon: ShieldBan, onClick: () => toast.success("Real status API wiring is still needed.") }, { label: "Delete user", icon: Trash2, danger: true, onClick: () => setDeleting(user) }]}/></td>}</tr>)}</tbody></table>{filtered.length === 0 && <div className="border-t border-border p-6 text-sm text-muted">No users match your filters.</div>}</div></div>}
    {!readOnly && <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? "Edit user" : "Add user"}><form onSubmit={save} className="space-y-4"><input name="name" required className="input" defaultValue={editing?.name} placeholder="Full name"/><input name="email" required type="email" className="input" defaultValue={editing?.email} placeholder="Email"/><select name="role" className="input" defaultValue={editing?.role || "user"}><option>user</option><option>admin</option><option>support</option><option>billing</option></select><input name="plan" className="input" defaultValue={editing?.plan || ""} placeholder="Plan name"/><Button className="w-full">{editing?.id ? "Save changes" : "Add user"}</Button></form></Modal>}
    {!readOnly && <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete user?" description={`Are you sure you want to delete ${deleting?.name || "this user"}? This cannot be undone.`} confirmLabel="Delete user" danger onConfirm={confirmDelete}/>}
    {!readOnly && <Modal open={Boolean(assigning)} onClose={() => setAssigning(null)} title="Assign strategist" description={assigning?.name}>
      <form onSubmit={assignStrategist} className="space-y-4">
        <select name="assignedTo" className="input" defaultValue={assigning?.assignedTo || ""}>
          <option value="">Unassigned</option>
          {teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name} ({member.role})</option>)}
        </select>
        <Button className="w-full">Save assignment</Button>
      </form>
    </Modal>}
  </div>;
}

export function UsersReadOnly() {
  return <Users readOnly/>;
}
