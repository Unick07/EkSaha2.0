import { CalendarPlus, CirclePause, CirclePlay, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ActionMenu from "../../components/dashboard/ActionMenu";
import api from "../../services/http/api";

const formatDate = (value) => value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "Not set";

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.get("/admin/subscriptions")
      .then(({ data }) => {
        if (active) setSubscriptions(data);
      })
      .catch((caught) => {
        const message = caught.response?.data?.message || "Could not load subscriptions.";
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

  const counts = useMemo(() => ({
    active: subscriptions.filter((item) => item.status === "active").length,
    pastDue: subscriptions.filter((item) => item.status === "past_due").length,
    cancelled: subscriptions.filter((item) => item.status === "cancelled").length,
  }), [subscriptions]);

  const updateStatus = async (subscription, status, message) => {
    const previous = subscriptions;
    setSubscriptions((items) => items.map((item) => item.id === subscription.id ? { ...item, status } : item));
    try {
      await api.patch(`/subscriptions/${subscription.id}`, { status });
      toast.success(message);
    } catch (caught) {
      setSubscriptions(previous);
      toast.error(caught.response?.data?.message || "Subscription update failed.");
    }
  };

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-2xl font-bold">Subscriptions</h2>
        <p className="mt-1 text-sm text-muted">Monitor plan health, billing cycles and payment status.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {[[counts.active, "Active"], [counts.pastDue, "Past due"], [counts.cancelled, "Cancelled"]].map(([value, label]) => (
          <div className="panel p-5" key={label}>
            <div className="text-2xl font-extrabold">{value}</div>
            <div className="mt-1 text-sm text-muted">{label}</div>
          </div>
        ))}
      </div>
      {loading && <div className="panel mt-6 p-5 text-sm text-muted">Loading subscriptions...</div>}
      {error && <div className="panel mt-6 border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
      {!loading && !error && <div className="panel mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-surface-raised text-xs uppercase text-muted">
              <tr><th className="p-5">Customer</th><th>Plan</th><th>Cycle</th><th>Status</th><th>Start</th><th>End</th><th></th></tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr className="border-t border-border" key={subscription.id}>
                  <td className="p-5"><div className="font-semibold">{subscription.user_name || subscription.user?.name || "Unknown user"}</div><div className="mt-1 text-xs text-muted">{subscription.user_email || subscription.user?.email}</div></td>
                  <td>{subscription.plan_name || subscription.plan?.name || "No plan"}</td>
                  <td className="capitalize">{subscription.billing_cycle || subscription.billingCycle}</td>
                  <td className="capitalize">{String(subscription.status || "").replace(/_/g, " ")}</td>
                  <td>{formatDate(subscription.start_date || subscription.startDate)}</td>
                  <td>{formatDate(subscription.end_date || subscription.endDate)}</td>
                  <td>
                    <ActionMenu actions={[
                      {
                        label: subscription.status === "paused" ? "Resume subscription" : "Pause subscription",
                        icon: subscription.status === "paused" ? CirclePlay : CirclePause,
                        onClick: () => updateStatus(subscription, subscription.status === "paused" ? "active" : "paused", "Subscription updated."),
                      },
                      { label: "Extend 30 days", icon: CalendarPlus, onClick: () => toast.success("Real end-date update wiring is still needed.") },
                      { label: "Cancel subscription", icon: XCircle, danger: true, onClick: () => updateStatus(subscription, "cancelled", "Subscription cancelled.") },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {subscriptions.length === 0 && <div className="border-t border-border p-6 text-sm text-muted">No subscriptions found.</div>}
        </div>
      </div>}
    </div>
  );
}
