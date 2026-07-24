import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../../services/http/api";

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.get("/admin/stats")
      .then(({ data }) => {
        if (active) setStats(data);
      })
      .catch((caught) => {
        const message = caught.response?.data?.message || "Could not load analytics.";
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

  if (loading) return <div className="panel p-6 text-sm text-muted">Loading analytics...</div>;
  if (error) return <div className="panel border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>;

  const chartData = [
    { label: "Users", value: stats.users || 0 },
    { label: "Subscriptions", value: stats.subscriptions || 0 },
    { label: "Open tickets", value: stats.openTickets || 0 },
    { label: "Published posts", value: stats.publishedPosts || 0 },
  ];

  return <div><div className="mb-7"><h2 className="text-2xl font-bold">Analytics & revenue</h2><p className="mt-1 text-sm text-muted">Live platform totals from the Worker database.</p></div><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{chartData.map((item) => <div className="panel p-5" key={item.label}><div className="text-2xl font-extrabold">{item.value}</div><div className="mt-1 text-sm text-muted">{item.label}</div></div>)}<div className="panel p-5"><div className="text-2xl font-extrabold">${Number(stats.paidInvoiceTotal || 0).toLocaleString()}</div><div className="mt-1 text-sm text-muted">Paid invoice total</div></div></div><div className="panel mt-6 p-6"><h3 className="font-bold">Database totals</h3><div className="mt-6 h-72"><ResponsiveContainer><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#028B7F26"/><XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={11}/><YAxis axisLine={false} tickLine={false} fontSize={11}/><Tooltip/><Bar dataKey="value" fill="#028B7F" radius={[6, 6, 0, 0]}/></BarChart></ResponsiveContainer></div></div></div>;
}
