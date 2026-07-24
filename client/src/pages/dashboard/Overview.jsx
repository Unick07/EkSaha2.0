import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Clock3, MailWarning, Send, Sparkles, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import { Modal } from "../../components/dashboard/Modal";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/http/api";

const capitalize = (value) => value ? String(value).replace(/_/g, " ").replace(/^./, (char) => char.toUpperCase()) : "";
const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not scheduled";
const formatAmount = (amount, currency) => amount == null ? null : `${Number(amount).toFixed(2)} ${(currency || "usd").toUpperCase()}`;
const initials = (name) => name ? name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") : "?";

export default function Overview() {
  const { user } = useAuth();
  const [messageOpen, setMessageOpen] = useState(false);
  const [resending, setResending] = useState(false);

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

  const resendVerification = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification");
      toast.success("Verification email sent.");
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not send the verification email.");
    } finally {
      setResending(false);
    }
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
    <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-brand-navy to-brand-teal-deep p-7 text-white">
      <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
        <div>
          <div className="text-sm opacity-80">Current plan</div>
          <h2 className="mt-2 text-3xl font-extrabold">{subscriptionLoading ? "Loading..." : (subscription?.plan?.name || "No active plan")}</h2>
          <p className="mt-2 text-sm opacity-85">{subscriptionLoading ? "" : (subscription ? `${capitalize(subscription.status)} - ${capitalize(subscription.billingCycle)} billing` : "Choose a plan to get started")}</p>
        </div>
        <Button to={subscription ? "/pricing" : "/signup?step=2&google=true"} variant="secondary" className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">{subscriptionLoading || subscription ? "Manage plan" : "Choose your plan"} <ArrowRight size={16}/></Button>
      </div>
    </div>
    {user && !user.emailVerified && <div className="panel flex flex-col items-start justify-between gap-4 border-2 border-dashed border-amber-400/50 bg-amber-500/10 p-6 sm:flex-row sm:items-center">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-amber-600"><MailWarning size={20}/></span>
        <div>
          <h3 className="font-bold">Please verify your email address</h3>
          <p className="mt-1 text-sm text-muted">We sent a verification code to {user.email}. Check your inbox to confirm your account.</p>
        </div>
      </div>
      <Button onClick={resendVerification} disabled={resending} className="w-full shrink-0 sm:w-auto">{resending ? "Sending..." : "Resend verification"}</Button>
    </div>}
    {!subscriptionLoading && !subscription && <div className="panel flex flex-col items-start justify-between gap-4 border-2 border-dashed border-primary/40 bg-primary/5 p-6 sm:flex-row sm:items-center">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary"><Sparkles size={20}/></span>
        <div>
          <h3 className="font-bold">Choose a plan to unlock your dashboard</h3>
          <p className="mt-1 text-sm text-muted">You're signed in, but no plan is attached to your account yet — this is common right after signing up with Google. Pick a plan to get full access to services, tickets and billing.</p>
        </div>
      </div>
      <Button to="/signup?step=2&google=true" className="w-full shrink-0 sm:w-auto">Choose your plan <ArrowRight size={16}/></Button>
    </div>}
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{stats.map(([Icon, value, label, copy]) => <div className="panel p-5" key={label}><Icon size={20} className="text-electric"/><div className="mt-5 text-2xl font-extrabold">{value}</div><div className="mt-1 text-sm font-semibold">{label}</div><div className="mt-1 text-xs text-muted">{copy}</div></div>)}</div>
    <div className="grid gap-7 xl:grid-cols-[1.3fr_.7fr]">
      <div className="panel p-6">
        <div className="flex items-center justify-between"><h3 className="font-bold">Active work</h3><Button to="/dashboard/services" variant="ghost">View all</Button></div>
        <div className="mt-4 text-sm text-muted">No active services yet. Visit the services workspace to request one.</div>
      </div>
      <div className="panel p-6">
        <h3 className="font-bold">Your strategist</h3>
        {strategistLoading ? <p className="mt-6 text-sm text-muted">Loading...</p> : strategist ? <>
          <div className="mt-6 flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-brand-navy to-brand-teal text-lg font-bold text-white">{initials(strategist.name)}</span>
            <div><div className="font-bold">{strategist.name}</div><div className="text-xs capitalize text-muted">{strategist.role}</div></div>
          </div>
          <Button onClick={() => setMessageOpen(true)} variant="secondary" className="mt-6 w-full">Message {strategist.name.split(" ")[0]}</Button>
        </> : <p className="mt-6 text-sm leading-6 text-muted">No strategist assigned yet. Our team will pair you with one shortly.</p>}
      </div>
    </div>
    <Modal open={messageOpen} onClose={() => setMessageOpen(false)} title={`Message ${strategist?.name || "your strategist"}`} description="Your strategist will reply in the dashboard and by email."><form onSubmit={sendMessage}><textarea required className="input min-h-36 resize-none" placeholder="Share a question or update..." /><Button className="mt-4 w-full">Send message <Send size={16}/></Button></form></Modal>
  </div>;
}
