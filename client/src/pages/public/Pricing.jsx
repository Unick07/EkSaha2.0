import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Braces,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Headphones,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  WalletCards,
  Zap,
} from "lucide-react";
import { Button, PlanCard } from "../../components/common/ui";
import { plans } from "../../data/siteData";
import { audienceOptions, individualPricing, organizationComparison, pricingFaqs } from "../../data/pricingData";
import { useAppStore } from "../../store/useAppStore";

const serviceIcons = {
  seo: Search,
  web: Braces,
  ads: Target,
  "it-support": Headphones,
};

const audienceIcons = {
  individuals: UserRound,
  organizations: Building2,
};

const reassurance = [
  { icon: Clock3, label: "Start in days" },
  { icon: WalletCards, label: "Clear monthly pricing" },
  { icon: ShieldCheck, label: "Change or cancel anytime" },
];

function AudienceToggle({ value, onChange }) {
  return <div className="grid w-full grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/10 p-1.5 shadow-2xl shadow-black/20 backdrop-blur-xl" role="tablist" aria-label="Choose pricing for individuals or organizations">
    {audienceOptions.map((option) => {
      const selected = option.id === value;
      const Icon = audienceIcons[option.id];
      return <button
        key={option.id}
        type="button"
        role="tab"
        id={`${option.id}-tab`}
        aria-controls={`${option.id}-panel`}
        aria-selected={selected}
        onClick={() => onChange(option.id)}
        className={`relative min-w-0 rounded-xl px-3 py-3.5 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-on-brand-accent/30 sm:px-5 ${selected ? "text-ink" : "text-white hover:bg-white/10"}`}
      >
        {selected && <motion.span layoutId="audience-highlight" className="absolute inset-0 rounded-xl bg-white shadow-lg" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
        <span className="relative flex items-center gap-3">
          <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${selected ? "bg-primary/10 text-primary" : "bg-white/10 text-on-brand-accent"}`}><Icon size={18} aria-hidden="true" /></span>
          <span className="min-w-0">
            <span className="block text-sm font-extrabold sm:text-base">{option.shortLabel}</span>
            <span className={`mt-0.5 hidden text-xs sm:block ${selected ? "text-muted" : "text-on-brand-muted"}`}>{option.description}</span>
          </span>
        </span>
      </button>;
    })}
  </div>;
}

function BillingToggle({ value, onChange }) {
  return <div className="inline-flex items-center rounded-xl border border-border bg-surface p-1 shadow-sm" aria-label="Billing frequency">
    {["monthly", "yearly"].map((item) => <button
      key={item}
      type="button"
      aria-pressed={value === item}
      onClick={() => onChange(item)}
      className={`rounded-lg px-4 py-2.5 text-sm font-extrabold capitalize transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${value === item ? "bg-ink text-white shadow-sm" : "text-muted hover:bg-surface-raised hover:text-text"}`}
    >{item}{item === "yearly" && <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${value === item ? "bg-on-brand-accent text-ink" : "bg-primary/10 text-primary"}`}>Save 20%</span>}</button>)}
  </div>;
}

function QuickStarts({ selected, onApply }) {
  return <div className="grid gap-3 sm:grid-cols-3">
    {individualPricing.guides.map((guide) => {
      const active = guide.serviceIds.length === selected.length && guide.serviceIds.every((id) => selected.includes(id));
      return <button
        type="button"
        key={guide.name}
        aria-pressed={active}
        onClick={() => onApply(guide.serviceIds)}
        className={`group rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${active ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-surface hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"}`}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="font-extrabold">{guide.name}</span>
          {active ? <CheckCircle2 size={18} className="text-primary" /> : <ArrowRight size={16} className="text-muted transition group-hover:translate-x-0.5 group-hover:text-primary" />}
        </span>
        <span className="mt-1 block text-xs font-bold text-primary">{guide.price}</span>
        <span className="mt-2 block text-xs leading-5 text-muted">{guide.description}</span>
      </button>;
    })}
  </div>;
}

function IndividualCalculator() {
  const [selected, setSelected] = useState(["seo", "web"]);
  const reduceMotion = useReducedMotion();
  const selectedServices = individualPricing.services.filter((service) => selected.includes(service.id));
  const moduleSubtotal = selectedServices.reduce((sum, service) => sum + service.price, 0);
  const discountRate = individualPricing.discounts[selected.length] || 0;
  const discount = Math.round(moduleSubtotal * discountRate);
  const total = individualPricing.basePrice + moduleSubtotal - discount;
  const toggleService = (id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const contactUrl = useMemo(() => {
    const services = selectedServices.map((service) => service.shortName).join(",");
    return `/contact?audience=individual&services=${encodeURIComponent(services)}&estimate=${total}`;
  }, [selectedServices, total]);

  const discountMessage = selected.length === 0
    ? "Choose a service to get started"
    : selected.length === 1
      ? "Add one more service to unlock 10% off modules"
      : selected.length < 4
        ? `${Math.round(discountRate * 100)}% multi-service saving applied`
        : "Maximum 20% module saving unlocked";

  return <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,.6fr)] lg:items-start">
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-7" aria-labelledby="quick-start-heading">
        <div className="mb-5 flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-extrabold text-primary">1</span>
          <div><h2 id="quick-start-heading" className="text-xl font-extrabold tracking-tight">Pick a starting point</h2><p className="mt-1 text-sm leading-6 text-muted">Use a popular setup, then fine-tune it below.</p></div>
        </div>
        <QuickStarts selected={selected} onApply={setSelected} />
      </section>

      <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm" aria-labelledby="services-heading">
        <div className="flex items-start gap-3 border-b border-border bg-surface-raised/60 p-5 sm:p-7">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-extrabold text-primary">2</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div><h2 id="services-heading" className="text-xl font-extrabold tracking-tight">Tailor your support</h2><p className="mt-1 text-sm leading-6 text-muted">Select only the capabilities you need. Change them anytime.</p></div>
              <span className="w-fit rounded-full bg-primary/10 px-3 py-1.5 text-xs font-extrabold text-primary">{selected.length} of {individualPricing.services.length} selected</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
          {individualPricing.services.map((service) => {
            const checked = selected.includes(service.id);
            const Icon = serviceIcons[service.id];
            return <button
              key={service.id}
              type="button"
              aria-pressed={checked}
              onClick={() => toggleService(service.id)}
              className={`group relative flex min-h-48 flex-col rounded-2xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${checked ? "border-primary bg-primary/[.07] shadow-sm" : "border-border bg-surface hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"}`}
            >
              <span className="flex items-start justify-between gap-4">
                <span className={`grid size-11 place-items-center rounded-xl transition ${checked ? "bg-primary text-primary-foreground" : "bg-surface-raised text-muted group-hover:text-primary"}`}><Icon size={20} aria-hidden="true" /></span>
                <span className={`grid size-6 place-items-center rounded-full border transition ${checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface"}`}>{checked && <Check size={14} strokeWidth={3} />}</span>
              </span>
              <span className="mt-5 flex items-center justify-between gap-3">
                <span className="font-extrabold">{service.name}</span>
                <span className="whitespace-nowrap text-sm font-extrabold text-primary">+${service.price}<span className="font-medium text-muted">/mo</span></span>
              </span>
              <span className="mt-2 block text-sm leading-6 text-muted">{service.description}</span>
            </button>;
          })}
        </div>
      </section>
    </div>

    <aside className="overflow-hidden rounded-3xl border border-border bg-surface shadow-xl shadow-brand-navy/10 lg:sticky lg:top-28" aria-live="polite">
      <div className="bg-ink p-6 text-white sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-extrabold uppercase tracking-[.18em] text-on-brand-accent">Monthly estimate</span>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-on-brand-muted">No setup fee</span>
        </div>
        <div className="mt-4 flex items-end gap-2">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={total}
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="text-5xl font-extrabold tracking-[-.06em]"
            >${total.toLocaleString()}</motion.span>
          </AnimatePresence>
          <span className="mb-1 text-sm text-on-brand-muted">/ month</span>
        </div>
        <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-on-brand-accent"><Sparkles size={14} />{discountMessage}</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-on-brand-accent" animate={{ width: `${Math.min(selected.length / 4 * 100, 100)}%` }} /></div>
        </div>
      </div>

      <div className="p-6 sm:p-7">
        <h3 className="text-sm font-extrabold">Your plan breakdown</h3>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4"><span className="text-muted">Workspace base</span><strong>${individualPricing.basePrice}</strong></div>
          {selectedServices.map((service) => <motion.div layout key={service.id} className="flex justify-between gap-4"><span className="text-muted">{service.shortName}</span><strong>+${service.price}</strong></motion.div>)}
          {discount > 0 && <div className="flex justify-between gap-4 text-emerald-700 dark:text-emerald-300"><span>Bundle saving ({Math.round(discountRate * 100)}%)</span><strong>−${discount}</strong></div>}
          <div className="flex justify-between gap-4 border-t border-border pt-3 text-base"><strong>Total per month</strong><strong>${total.toLocaleString()}</strong></div>
        </div>

        {selected.length > 0
          ? <Button to={contactUrl} className="mt-6 w-full py-3.5">Continue with this plan <ArrowRight size={16} /></Button>
          : <button disabled className="mt-6 inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-surface-raised px-5 py-3.5 text-sm font-bold text-muted">Select a service to continue</button>}
        <p className="mt-3 text-center text-xs leading-5 text-muted">You will review everything with a specialist before committing.</p>

        <div className="mt-6 border-t border-border pt-5">
          <div className="text-xs font-extrabold uppercase tracking-wider text-muted">Included in every plan</div>
          <div className="mt-4 space-y-3">{individualPricing.baseIncludes.map((feature) => <div className="flex gap-2.5 text-sm" key={feature}><CheckCircle2 className="mt-0.5 shrink-0 text-primary" size={16} /><span>{feature}</span></div>)}</div>
        </div>
      </div>
    </aside>
  </div>;
}

function OrganizationPlans() {
  const { billing, setBilling } = useAppStore();
  return <>
    <div className="mb-8 grid gap-6 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.18em] text-primary"><Layers3 size={15} /> One accountable team</span>
        <h2 className="mt-3 text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Scale capability, not overhead.</h2>
        <p className="mt-3 leading-7 text-muted">Choose the service coverage and response time that fits your team. Every tier includes strategy, reporting, and a clear delivery rhythm.</p>
      </div>
      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Choose billing</div>
        <BillingToggle value={billing} onChange={setBilling} />
      </div>
    </div>

    <div className="grid gap-6 lg:grid-cols-3">{plans.map((plan, index) => <motion.div key={plan.name} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: index * 0.07 }}><PlanCard plan={plan} billing={billing} /></motion.div>)}</div>

    <section className="mt-16" aria-labelledby="compare-plans-heading">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><span className="text-xs font-extrabold uppercase tracking-[.18em] text-primary">Full comparison</span><h2 id="compare-plans-heading" className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">See exactly what changes by tier.</h2></div>
        <p className="max-w-md text-sm leading-6 text-muted">Need a mix that does not fit neatly? We can tailor service coverage after a short discovery call.</p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">Detailed comparison of organization plans</caption>
            <thead className="bg-ink text-white"><tr><th scope="col" className="p-5 text-sm font-extrabold">What you get</th>{plans.map((plan) => <th scope="col" className={`p-5 text-base ${plan.popular ? "text-on-brand-accent" : ""}`} key={plan.name}>{plan.name}{plan.popular && <span className="ml-2 rounded-full bg-on-brand-accent/15 px-2 py-1 text-[10px] uppercase tracking-wide">Popular</span>}</th>)}</tr></thead>
            <tbody>{organizationComparison.map((row, rowIndex) => <tr className={`border-t border-border ${rowIndex % 2 ? "bg-surface-raised/40" : ""}`} key={row.label}><th scope="row" className="p-5 font-extrabold">{row.label}</th>{row.values.map((value, index) => <td className="p-5 text-muted" key={`${row.label}-${plans[index].name}`}><span className="flex items-start gap-2"><Check className="mt-0.5 shrink-0 text-primary" size={15} />{value}</span></td>)}</tr>)}</tbody>
          </table>
        </div>
        <div className="border-t border-border bg-surface-raised/60 px-5 py-3 text-center text-xs text-muted sm:hidden">Swipe horizontally to compare all plans →</div>
      </div>
    </section>
  </>;
}

function HowItWorks() {
  const steps = [
    { icon: BarChart3, number: "01", title: "Share your priority", copy: "Tell us the result you need, not a list of technical tasks." },
    { icon: Layers3, number: "02", title: "Confirm your plan", copy: "We validate scope, timing, and the best mix of specialists." },
    { icon: Zap, number: "03", title: "Start in days", copy: "Meet your team, open your workspace, and begin the first sprint." },
  ];
  return <section className="border-y border-border bg-surface-raised/55 py-16 sm:py-20">
    <div className="container-shell">
      <div className="mx-auto max-w-2xl text-center"><span className="eyebrow">Simple from day one</span><h2 className="section-title">From decision to delivery.</h2><p className="section-copy mx-auto">A straightforward onboarding path with a human check before anything begins.</p></div>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">{steps.map(({ icon: Icon, number, title, copy }) => <div key={number} className="relative rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-7">
        <div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={20} /></span><span className="text-3xl font-black text-border">{number}</span></div>
        <h3 className="mt-5 text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
      </div>)}</div>
    </div>
  </section>;
}

function PricingFaq() {
  const [openItem, setOpenItem] = useState(0);
  return <section className="py-16 sm:py-24">
    <div className="container-shell grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <span className="eyebrow">Questions, answered</span>
        <h2 className="section-title">Pricing without the fine print.</h2>
        <p className="section-copy">Everything you need to choose confidently. Still unsure? Talk to a real person.</p>
        <Button to="/contact" variant="secondary" className="mt-6">Ask a question <ArrowRight size={16} /></Button>
      </div>
      <div className="grid gap-3">{pricingFaqs.map((item, index) => {
        const open = openItem === index;
        return <div className={`overflow-hidden rounded-2xl border bg-surface transition ${open ? "border-primary/50 shadow-sm" : "border-border"}`} key={item.question}>
          <button type="button" aria-expanded={open} aria-controls={`pricing-answer-${index}`} onClick={() => setOpenItem(open ? -1 : index)} className="flex w-full items-center justify-between gap-4 p-5 text-left font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-primary/20 sm:p-6">
            {item.question}<span className={`grid size-8 shrink-0 place-items-center rounded-full transition ${open ? "bg-primary text-primary-foreground" : "bg-surface-raised text-muted"}`}><ChevronDown size={17} className={`transition ${open ? "rotate-180" : ""}`} /></span>
          </button>
          <AnimatePresence initial={false}>{open && <motion.div id={`pricing-answer-${index}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}><p className="px-5 pb-5 text-sm leading-7 text-muted sm:px-6 sm:pb-6">{item.answer}</p></motion.div>}</AnimatePresence>
        </div>;
      })}</div>
    </div>
  </section>;
}

export default function Pricing() {
  const [audience, setAudience] = useState("individuals");
  const reduceMotion = useReducedMotion();
  return <>
    <section className="relative overflow-hidden bg-ink pb-20 pt-16 text-white sm:pb-24 sm:pt-20">
      <div className="grid-mask absolute inset-0 opacity-70" aria-hidden="true" />
      <div className="absolute -left-32 top-10 size-96 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
      <div className="absolute -right-20 -top-40 size-[34rem] rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />
      <div className="container-shell relative">
        <div className="mx-auto max-w-4xl text-center">
          <span className="eyebrow"><Sparkles size={13} /> Flexible plans, no long contracts</span>
          <h1 className="text-4xl font-extrabold tracking-[-.055em] sm:text-6xl lg:text-7xl">The right expertise.<br /><span className="text-on-brand-accent">Only when you need it.</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-on-brand-muted sm:text-lg">Build a focused plan for yourself or give your organization a complete digital team—with clear scope, transparent pricing, and room to adapt.</p>
          <div className="mx-auto mt-8 max-w-2xl"><AudienceToggle value={audience} onChange={setAudience} /></div>
        </div>

        <div className="mx-auto mt-9 grid max-w-3xl gap-3 sm:grid-cols-3">{reassurance.map(({ icon: Icon, label }) => <div key={label} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-bold text-on-brand-muted backdrop-blur"><Icon size={15} className="text-on-brand-accent" />{label}</div>)}</div>
      </div>
    </section>

    <section className="py-14 sm:py-20">
      <div className="container-shell">
        <div className="mb-10 flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[.18em] text-primary">{audience === "individuals" ? "Your plan builder" : "Organization subscriptions"}</span>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{audience === "individuals" ? "Build a plan around your priorities." : "Choose the capacity your team needs."}</h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted"><BadgeCheck size={17} className="text-primary" />Prices shown in USD</div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={audience}
            id={`${audience}-panel`}
            role="tabpanel"
            aria-labelledby={`${audience}-tab`}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {audience === "individuals" ? <IndividualCalculator /> : <OrganizationPlans />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>

    <HowItWorks />
    <PricingFaq />

    <section className="pb-16 sm:pb-24">
      <div className="container-shell">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-10 text-center text-white shadow-2xl shadow-brand-navy/20 sm:px-10 sm:py-14 lg:flex lg:items-center lg:justify-between lg:text-left">
          <div className="grid-mask absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="relative max-w-2xl"><span className="text-sm font-bold text-on-brand-accent">Not sure which path fits?</span><h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Tell us the outcome. We’ll shape the plan.</h2><p className="mt-3 text-sm leading-6 text-on-brand-muted sm:text-base">A short, no-pressure conversation is often the fastest way to get clarity.</p></div>
          <Button to="/contact" className="relative mt-7 shrink-0 bg-on-brand-accent px-7 py-4 text-ink shadow-none hover:bg-on-brand-accent/90 lg:mt-0">Get a recommendation <ArrowRight size={17} /></Button>
        </div>
      </div>
    </section>
  </>;
}
