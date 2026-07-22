import { motion } from "framer-motion";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppStore } from "../../store/useAppStore";
import api from "../../services/http/api";
import { homeForRole } from "../../lib/roles";

export function Button({ children, to, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90",
    secondary: "border border-border bg-surface text-text hover:border-primary/40 hover:bg-primary/10",
    ghost: "text-muted hover:bg-surface-raised",
  };
  const classes = `inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${styles[variant]} ${className}`;
  return to
    ? <Link className={classes} to={to} {...props}>{children}</Link>
    : <button className={classes} {...props}>{children}</button>;
}

export function SectionHeading({ eyebrow, title, copy, center = false }) {
  return <div className={center ? "mx-auto flex max-w-3xl flex-col items-center text-center" : ""}>
    {eyebrow && <span className="eyebrow">{eyebrow}</span>}
    <h2 className="section-title">{title}</h2>
    {copy && <p className="section-copy">{copy}</p>}
  </div>;
}

export function FadeIn({ children, className = "", delay = 0 }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: .55, delay }}>{children}</motion.div>;
}

export function PlanCard({ plan, billing = "monthly" }) {
  const price = billing === "yearly" ? Math.round(plan.monthly * .8) : plan.monthly;
  const user = useAppStore((state) => state.user);
  const navigate = useNavigate();

  // Signed-in users (e.g. a Google sign-in with no plan yet) attach a plan to
  // their existing account instead of being sent through the signup form,
  // which would just fail with "Email already registered".
  const choosePlan = async () => {
    try {
      const { data: availablePlans } = await api.get("/plans");
      const matchedPlan = availablePlans.find((item) => item.name === plan.name);
      if (!matchedPlan) throw new Error("Plan not found");
      await api.post("/subscriptions/me", { planId: matchedPlan.id });
      toast.success(`You're on the ${plan.name} plan.`);
      navigate(homeForRole(user.role));
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not attach this plan.");
    }
  };

  return <div className={`panel relative flex h-full flex-col p-7 ${plan.popular ? "border-primary ring-4 ring-primary/15" : ""}`}>
    {plan.popular && <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">Most popular</span>}
    <h3 className="text-xl font-bold">{plan.name}</h3>
    <p className="mt-2 min-h-12 text-sm leading-6 text-muted">{plan.description}</p>
    <div className="mt-6 flex items-end gap-1"><span className="text-4xl font-extrabold tracking-tight">${price.toLocaleString()}</span><span className="mb-1 text-sm text-muted">/mo</span></div>
    {billing === "yearly" && <span className="mt-1 text-xs font-semibold text-emerald-600">Billed yearly, save 20%</span>}
    {user
      ? <Button onClick={choosePlan} variant={plan.popular ? "primary" : "secondary"} className="mt-7 w-full">{plan.cta || `Start with ${plan.name}`}<ArrowRight size={16} /></Button>
      : <Button to="/signup" variant={plan.popular ? "primary" : "secondary"} className="mt-7 w-full">{plan.cta || `Start with ${plan.name}`}<ArrowRight size={16} /></Button>}
    <div className="mt-7 space-y-3 border-t border-border pt-6">
      {plan.features.map((feature) => <div className="flex items-start gap-3 text-sm" key={feature}><span className="mt-0.5 rounded-full bg-primary/10 p-1 text-primary"><Check size={12} /></span>{feature}</div>)}
    </div>
  </div>;
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-surface-raised ${className}`} />;
}

export function PageLoader() {
  return <div className="grid min-h-[60vh] place-items-center"><LoaderCircle className="animate-spin text-primary" size={32} /></div>;
}
