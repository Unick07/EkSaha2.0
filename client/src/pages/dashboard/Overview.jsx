import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Clock3, Send, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import { Modal } from "../../components/dashboard/Modal";
import api from "../../services/http/api";

const capitalize = (value) => value ? String(value).replace(/_/g, " ").replace(/^./, (char) => char.toUpperCase()) : "";
const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not scheduled";
const formatAmount = (amount, currency) => amount == null ? null : `${Number(amount).toFixed(2)} ${(currency || "usd").toUpperCase()}`;
const initials = (name) => name ? name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") : "?";

export default function Overview() {
  const [messageOpen, setMessageOpen] = useState(false);

  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const [strategist, setStrategist] = useState(null);
  const [strategistLoading, setStrategistLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get("/subscriptions/me")
      .then(({ data }) => { if (active) setSubscription(data || null); })
      .catch(() => { if (active) setSubscription(null); })
      .finally(() => { if (active) setSubscriptionLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    api.get("/tickets")
      .then(({ data }) => { if (active) setTickets(data || []); })
      .catch(() => { if (active) setTickets([]); })
      .finally(() => { if (active) setTicketsLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    api.get("/users/me/strategist")
      .then(({ data }) => { if (active) setStrategist(data || null); })
      .catch(() => { if (active) setStrategist(null); })
      .finally(() => { if (active) setStrategistLoading(false); });
    return () => { active = false; };
  }, []);

  const sendMessage = (event) => {
    event.preventDefault();
    setMessageOpen(false);
    toast.success(`Message sent to ${strategist?.name?.split(" ")[0] || "your strategist"}.`);
  };

  const resolvedCount = tickets.filter((ticket) => ticket.status === "resolved").length;
  const openCount = tickets.filter((ticket) => ticket.status !== "resolved").length;
  const nextBillingAmount = formatAmount(subscription?.plan?.price, subscription?.currency);

  const stats = [
    [TrendingUp, ticketsLoading ? "-" : String(resolvedCount), "Requests completed", "Resolved support tickets"],
    [Clock3, ticketsLoading ? "-" : String(openCount), "In progress", "Open support tickets"],
    [CalendarDays, subscriptionLoading ? "-" : formatDate(subscription?.endDate), "Next billing date", subscriptionLoading ? "" : (nextBillingAmount ? `${nextBillingAmount} scheduled` : "No active subscription")],
  ];

  return <div className="space-y-7">
    <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-accent p-7 text-primary-foreground">
      <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
        <div>
          <div className="text-sm opacity-80">Current plan</div>
          <h2 className="mt-2 text-3xl font-extrabold">{subscriptionLoading ? "Loading..." : (subscription?.plan?.name || "No active plan")}</h2>
          <p className="mt-2 text-sm opacity-85">{subscriptionLoading ? "" : (subscription ? `${capitalize(subscription.status)} - ${capitalize(subscription.billingCycle)} billing` : "Choose a plan to get started")}</p>
        </div>
        <Button to="/pricing" variant="secondary" className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">Manage plan <ArrowRight size={16}/></Button>
      </div>
    </div>
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{stats.map(([Icon, value, label, copy]) => <div className="panel p-5" key={label}><Icon size={20} className="text-electric"/><div className="mt-5 text-2xl font-extrabold">{value}</div><div className="mt-1 text-sm font-semibold">{label}</div><div className="mt-1 text-xs text-slate-500">{copy}</div></div>)}</div>
    <div className="grid gap-7 xl:grid-cols-[1.3fr_.7fr]">
      <div className="panel p-6">
        <div className="flex items-center justify-between"><h3 className="font-bold">Active work</h3><Button to="/dashboard/services" variant="ghost">View all</Button></div>
        <div className="mt-4 text-sm text-slate-500">No active services yet. Visit the services workspace to request one.</div>
      </div>
      <div className="panel p-6">
        <h3 className="font-bold">Your strategist</h3>
        {strategistLoading ? <p className="mt-6 text-sm text-slate-500">Loading...</p> : strategist ? <>
          <div className="mt-6 flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-blue-500 text-lg font-bold text-white">{initials(strategist.name)}</span>
            <div><div className="font-bold">{strategist.name}</div><div className="text-xs capitalize text-slate-500">{strategist.role}</div></div>
          </div>
          <Button onClick={() => setMessageOpen(true)} variant="secondary" className="mt-6 w-full">Message {strategist.name.split(" ")[0]}</Button>
        </> : <p className="mt-6 text-sm leading-6 text-slate-500">No strategist assigned yet. Our team will pair you with one shortly.</p>}
      </div>
    </div>
    <Modal open={messageOpen} onClose={() => setMessageOpen(false)} title={`Message ${strategist?.name || "your strategist"}`} description="Your strategist will reply in the dashboard and by email."><form onSubmit={sendMessage}><textarea required className="input min-h-36 resize-none" placeholder="Share a question or update..." /><Button className="mt-4 w-full">Send message <Send size={16}/></Button></form></Modal>
  </div>;
}
