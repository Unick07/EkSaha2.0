import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAdminStore } from "../../store/useAdminStore";
import { kpis, revenue } from "./data";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl dark:border-white/10 dark:bg-ink"><div className="font-bold">{label}</div><div className="mt-1 text-electric">${payload[0].value}k</div></div>;
}

export default function Overview() {
  const users = useAdminStore((state) => state.users);
  return <div className="space-y-7">
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{kpis.map(([Icon,value,label,change],i)=><div className="panel p-5" key={label}><div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-electric dark:bg-blue-500/10"><Icon size={20}/></span><span className="flex items-center text-xs font-bold text-emerald-600">{i===3?<ArrowDownRight size={14}/>:<ArrowUpRight size={14}/>} {change}</span></div><div className="mt-5 text-2xl font-extrabold">{value}</div><div className="mt-1 text-sm text-slate-500">{label}</div></div>)}</div>
    <div className="grid gap-7 xl:grid-cols-[1.5fr_.7fr]"><div className="panel p-6"><div><h2 className="font-bold">Revenue overview</h2><p className="mt-1 text-xs text-slate-500">Monthly recurring revenue, 2026</p></div><div className="mt-7 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={revenue}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b822"/><XAxis dataKey="m" axisLine={false} tickLine={false} fontSize={11}/><YAxis axisLine={false} tickLine={false} fontSize={11}/><Tooltip content={<ChartTooltip/>}/><Bar dataKey="v" fill="#3B82F6" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></div><div className="panel p-6"><h2 className="font-bold">Ticket status</h2><p className="mt-1 text-xs text-slate-500">Current support workload</p><div className="h-56"><ResponsiveContainer><PieChart><Pie data={[{n:"Open",v:38},{n:"Progress",v:24},{n:"Resolved",v:67}]} dataKey="v" nameKey="n" innerRadius={52} outerRadius={76} paddingAngle={4}>{["#3B82F6","#F59E0B","#10B981"].map(c=><Cell key={c} fill={c}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div><div className="flex justify-center gap-5">{[["Open","bg-blue-500"],["Progress","bg-amber-500"],["Resolved","bg-emerald-500"]].map(([l,c])=><span className="flex items-center gap-2 text-xs text-slate-500" key={l}><i className={`size-2 rounded-full ${c}`}/>{l}</span>)}</div></div></div>
    <div className="panel overflow-hidden"><div className="flex items-center justify-between p-6"><h2 className="font-bold">Recent signups</h2><Link className="text-sm font-bold text-electric" to="/admin/users">View all</Link></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-white/5"><tr><th className="p-5">User</th><th>Plan</th><th>Status</th><th>Joined</th></tr></thead><tbody>{users.slice(0,4).map((user)=><tr className="border-t border-slate-100 dark:border-white/10" key={user.id}><td className="p-5"><div className="font-semibold">{user.name}</div><div className="text-xs text-slate-400">{user.email}</div></td><td>{user.plan}</td><td>{user.status}</td><td>{user.joined}</td></tr>)}</tbody></table></div></div>
  </div>;
}
