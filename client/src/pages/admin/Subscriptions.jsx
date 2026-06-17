import { CalendarPlus, CirclePause, CirclePlay, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import ActionMenu from "../../components/dashboard/ActionMenu";
import { useAdminStore } from "../../store/useAdminStore";

export default function Subscriptions() {
  const { users, updateUser } = useAdminStore();
  const active = users.filter((user) => user.status === "Active").length;
  const pastDue = users.filter((user) => user.status === "Past due").length;
  const updateStatus = (user, status, message) => {
    updateUser(user.id, { status });
    toast.success(message);
  };

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-2xl font-bold">Subscriptions</h2>
        <p className="mt-1 text-sm text-slate-500">Monitor plan health, billing cycles and payment status.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {[[active, "Active"], [pastDue, "Past due"], [32, "Churned this month"]].map(([value, label]) => (
          <div className="panel p-5" key={label}>
            <div className="text-2xl font-extrabold">{value}</div>
            <div className="mt-1 text-sm text-slate-500">{label}</div>
          </div>
        ))}
      </div>
      <div className="panel mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-white/5">
              <tr><th className="p-5">Customer</th><th>Plan</th><th>Cycle</th><th>Status</th><th>Next billing</th><th></th></tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr className="border-t border-slate-100 dark:border-white/10" key={user.id}>
                  <td className="p-5 font-semibold">{user.name}</td>
                  <td>
                    <select
                      value={user.plan}
                      onChange={(event) => {
                        updateUser(user.id, { plan: event.target.value });
                        toast.success("Plan changed.");
                      }}
                      className="rounded-lg border border-slate-200 bg-transparent px-2 py-1 dark:border-white/10"
                    >
                      <option>Starter</option><option>Growth</option><option>Enterprise</option>
                    </select>
                  </td>
                  <td>{index % 2 ? "Annual" : "Monthly"}</td>
                  <td>{user.status}</td>
                  <td>Jul {index + 1}, 2026</td>
                  <td>
                    <ActionMenu actions={[
                      {
                        label: user.status === "Suspended" ? "Resume subscription" : "Pause subscription",
                        icon: user.status === "Suspended" ? CirclePlay : CirclePause,
                        onClick: () => updateStatus(user, user.status === "Suspended" ? "Active" : "Suspended", "Subscription updated."),
                      },
                      { label: "Extend 30 days", icon: CalendarPlus, onClick: () => toast.success("Subscription extended by 30 days.") },
                      { label: "Cancel subscription", icon: XCircle, danger: true, onClick: () => updateStatus(user, "Cancelled", "Subscription cancelled.") },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
