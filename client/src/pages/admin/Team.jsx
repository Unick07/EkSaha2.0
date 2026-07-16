import { useEffect, useState } from "react";
import { Plus, Shield, UserMinus } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import ActionMenu from "../../components/dashboard/ActionMenu";
import { ConfirmDialog, Modal } from "../../components/dashboard/Modal";
import api from "../../services/http/api";

const TEAM_ROLES = ["admin", "support", "billing"];

const formatDate = (value) => {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
};

const roleBadgeClass = {
  admin: "bg-primary/10 text-primary",
  support: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  billing: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
};

export default function Team() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [roleEditing, setRoleEditing] = useState(null);
  const [removing, setRemoving] = useState(null);

  const loadTeam = () => {
    setLoading(true);
    setError("");
    return api.get("/admin/users", { params: { roles: TEAM_ROLES.join(",") } })
      .then(({ data }) => setMembers(data))
      .catch((caught) => {
        const message = caught.response?.data?.message || "Could not load team members.";
        setError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const addMember = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const { data: member } = await api.post("/admin/team", data);
      setMembers((items) => [member, ...items]);
      setAddOpen(false);
      event.currentTarget.reset();
      toast.success("Team member added.");
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not add team member.");
    }
  };

  const changeRole = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const { data: member } = await api.patch(`/admin/users/${roleEditing.id}/role`, { role: data.role });
      setMembers((items) => items.map((item) => item.id === member.id ? member : item));
      setRoleEditing(null);
      toast.success("Role updated.");
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not update role.");
    }
  };

  const confirmRemove = async () => {
    try {
      await api.patch(`/admin/users/${removing.id}/role`, { role: "user" });
      setMembers((items) => items.filter((item) => item.id !== removing.id));
      toast.success(`${removing.name} was removed from the team.`);
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not remove team member.");
    } finally {
      setRemoving(null);
    }
  };

  return <div>
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-bold">Team management</h2><p className="mt-1 text-sm text-muted">Manage admin, support and billing access.</p></div><Button onClick={() => setAddOpen(true)}><Plus size={16}/>Add team member</Button></div>
    {loading && <div className="panel p-5 text-sm text-muted">Loading team...</div>}
    {error && <div className="panel border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
    {!loading && !error && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {members.map((member) => <div className="panel flex flex-col gap-4 p-5" key={member.id}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground">{member.name?.[0]?.toUpperCase() || "?"}</span>
            <div className="min-w-0"><div className="truncate font-semibold">{member.name}</div><div className="truncate text-xs text-muted">{member.email}</div></div>
          </div>
          <ActionMenu actions={[
            { label: "Change role", icon: Shield, onClick: () => setRoleEditing(member) },
            { label: "Remove from team", icon: UserMinus, danger: true, onClick: () => setRemoving(member) },
          ]}/>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className={`rounded-full px-2.5 py-1 font-bold capitalize ${roleBadgeClass[member.role] || "bg-surface-raised text-muted"}`}>{member.role}</span>
          <span className="text-muted">Joined {formatDate(member.createdAt)}</span>
        </div>
      </div>)}
      {members.length === 0 && <div className="panel p-6 text-sm text-muted sm:col-span-2 xl:col-span-3">No team members yet. Add one to get started.</div>}
    </div>}

    <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add team member" description="They will be able to sign in with this email and password.">
      <form onSubmit={addMember} className="space-y-4">
        <input name="name" required className="input" placeholder="Full name"/>
        <input name="email" required type="email" className="input" placeholder="Email"/>
        <input name="password" required type="password" minLength={8} className="input" placeholder="Password (min 8 characters)"/>
        <select name="role" required className="input" defaultValue="admin">
          <option value="admin">Admin</option>
          <option value="support">Support</option>
          <option value="billing">Billing</option>
        </select>
        <Button className="w-full">Add team member</Button>
      </form>
    </Modal>

    <Modal open={Boolean(roleEditing)} onClose={() => setRoleEditing(null)} title="Change role" description={roleEditing?.name}>
      <form onSubmit={changeRole} className="space-y-4">
        <select name="role" required className="input" defaultValue={roleEditing?.role}>
          <option value="admin">Admin</option>
          <option value="support">Support</option>
          <option value="billing">Billing</option>
        </select>
        <Button className="w-full">Save role</Button>
      </form>
    </Modal>

    <ConfirmDialog
      open={Boolean(removing)}
      onClose={() => setRemoving(null)}
      title="Remove from team?"
      description={`${removing?.name || "This member"} will lose admin access and become a regular user.`}
      confirmLabel="Remove from team"
      danger
      onConfirm={confirmRemove}
    />
  </div>;
}
