import { motion } from "framer-motion";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function Button({ children, to, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-electric text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600",
    secondary: "border border-slate-200 bg-white text-ink hover:border-blue-300 hover:bg-blue-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10",
    ghost: "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10",
  };
  const classes = `inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${styles[variant]} ${className}`;
  return to ? <Link className={classes} to={to} {...props}>{children}</Link> : <button className={classes} {...props}>{children}</button>;
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
  return <div className={`panel relative flex h-full flex-col p-7 ${plan.popular ? "border-blue-500 ring-4 ring-blue-500/10" : ""}`}>
    {plan.popular && <span className="absolute -top-3 right-6 rounded-full bg-electric px-3 py-1 text-xs font-bold text-white">Most popular</span>}
    <h3 className="text-xl font-bold">{plan.name}</h3>
    <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500 dark:text-slate-400">{plan.description}</p>
    <div className="mt-6 flex items-end gap-1"><span className="text-4xl font-extrabold tracking-tight">${price.toLocaleString()}</span><span className="mb-1 text-sm text-slate-500">/mo</span></div>
    {billing === "yearly" && <span className="mt-1 text-xs font-semibold text-emerald-600">Billed yearly, save 20%</span>}
    <Button to="/signup" variant={plan.popular ? "primary" : "secondary"} className="mt-7 w-full">Start with {plan.name}<ArrowRight size={16} /></Button>
    <div className="mt-7 space-y-3 border-t border-slate-100 pt-6 dark:border-white/10">
      {plan.features.map((feature) => <div className="flex items-start gap-3 text-sm" key={feature}><span className="mt-0.5 rounded-full bg-blue-50 p-1 text-electric dark:bg-blue-500/10"><Check size={12} /></span>{feature}</div>)}
    </div>
  </div>;
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-white/10 ${className}`} />;
}

export function PageLoader() {
  return <div className="grid min-h-[60vh] place-items-center"><LoaderCircle className="animate-spin text-electric" size={32} /></div>;
}
