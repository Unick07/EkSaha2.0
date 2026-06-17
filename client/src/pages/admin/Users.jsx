import { useState } from "react";
import { Edit3, Plus, Search, ShieldBan, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import ActionMenu from "../../components/dashboard/ActionMenu";
import { ConfirmDialog, Modal } from "../../components/dashboard/Modal";
import { useAdminStore } from "../../store/useAdminStore";

export default function Users() {
  const { users, addUser, updateUser, deleteUser } = useAdminStore();
  const [query,setQuery]=useState("");
  const [plan,setPlan]=useState("All plans");
  const [status,setStatus]=useState("All statuses");
  const [editing,setEditing]=useState(null);
  const [deleting,setDeleting]=useState(null);
  const filtered=users.filter((user)=>(user.name+user.email).toLowerCase().includes(query.toLowerCase())&&(plan==="All plans"||user.plan===plan)&&(status==="All statuses"||user.status===status));
  const save=(event)=>{event.preventDefault();const data=Object.fromEntries(new FormData(event.currentTarget));if(editing?.id)updateUser(editing.id,data);else addUser(data);setEditing(null);toast.success(editing?.id?"User updated.":"User added.");};

  return <div>
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-bold">User management</h2><p className="mt-1 text-sm text-slate-500">Manage accounts, access and assigned plans.</p></div><Button onClick={()=>setEditing({})}><Plus size={16}/>Add user</Button></div>
    <div className="panel mb-5 flex flex-col gap-3 p-4 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3.5 text-slate-400" size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} className="input pl-10" placeholder="Search users..."/></div><select value={plan} onChange={e=>setPlan(e.target.value)} className="input sm:w-44"><option>All plans</option><option>Starter</option><option>Growth</option><option>Enterprise</option></select><select value={status} onChange={e=>setStatus(e.target.value)} className="input sm:w-44"><option>All statuses</option><option>Active</option><option>Trial</option><option>Past due</option><option>Suspended</option></select></div>
    <div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-white/5"><tr><th className="p-5">User</th><th>Plan</th><th>Status</th><th>Joined</th><th></th></tr></thead><tbody>{filtered.map(user=><tr className="border-t border-slate-100 dark:border-white/10" key={user.id}><td className="p-5"><div className="font-semibold">{user.name}</div><div className="mt-1 text-xs text-slate-400">{user.email}</div></td><td>{user.plan}</td><td><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.status==="Active"?"bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10":"bg-amber-50 text-amber-600 dark:bg-amber-500/10"}`}>{user.status}</span></td><td className="text-slate-500">{user.joined}</td><td><ActionMenu actions={[{label:"Edit user",icon:Edit3,onClick:()=>setEditing(user)},{label:user.status==="Suspended"?"Reactivate":"Suspend",icon:ShieldBan,onClick:()=>{updateUser(user.id,{status:user.status==="Suspended"?"Active":"Suspended"});toast.success("User status updated.");}},{label:"Delete user",icon:Trash2,danger:true,onClick:()=>setDeleting(user)}]}/></td></tr>)}</tbody></table></div></div>
    <Modal open={Boolean(editing)} onClose={()=>setEditing(null)} title={editing?.id?"Edit user":"Add user"}><form onSubmit={save} className="space-y-4"><input name="name" required className="input" defaultValue={editing?.name} placeholder="Full name"/><input name="email" required type="email" className="input" defaultValue={editing?.email} placeholder="Email"/><select name="plan" className="input" defaultValue={editing?.plan||"Starter"}><option>Starter</option><option>Growth</option><option>Enterprise</option></select><select name="status" className="input" defaultValue={editing?.status||"Active"}><option>Active</option><option>Trial</option><option>Past due</option><option>Suspended</option></select><Button className="w-full">{editing?.id?"Save changes":"Add user"}</Button></form></Modal>
    <ConfirmDialog open={Boolean(deleting)} onClose={()=>setDeleting(null)} title="Delete user?" description={`${deleting?.name || "This user"} will be permanently removed from the demo workspace.`} confirmLabel="Delete user" danger onConfirm={()=>{deleteUser(deleting.id);setDeleting(null);toast.success("User deleted.");}}/>
  </div>;
}
