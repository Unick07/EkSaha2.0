import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Building2, CheckCircle2, ChevronDown, Play, Star, UserRound } from "lucide-react";
import { Button, FadeIn, PlanCard, SectionHeading } from "../../components/common/ui";
import { features, plans, services, testimonials, trustedCompanies } from "../../data/siteData";
import { audienceOptions, individualPricing } from "../../data/pricingData";
import Seo, { SITE_URL } from "../../components/common/Seo";
import JsonLd from "../../components/common/JsonLd";
import { features, plans, services, social, testimonials, trustedCompanies } from "../../data/siteData";
import { useAppStore } from "../../store/useAppStore";

// No LocalBusiness/streetAddress/telephone: EkSaha has no walk-in premises
// and no dedicated business line yet. areaServed is plain Text, which
// schema.org's Organization type accepts directly - no need to model Sydney
// as a nested Place hierarchy for a single descriptive string.
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "EkSaha",
  url: SITE_URL,
  logo: `${SITE_URL}/brand/eksaha-icon.svg`,
  description: "SEO, web, paid media and IT support in one flexible subscription for growing businesses.",
  areaServed: "Sydney, New South Wales, AU",
  sameAs: social.map((item) => item.url),
};

const faqs = [
  ["What does “unlimited requests” mean?", "Add as many requests as you like to your workspace. We work through them by priority, with most tasks delivered in two to five business days."],
  ["Can I change which services I use?", "Yes. Your subscription is designed to flex with your business. Shift capacity between SEO, web, advertising and IT support each month."],
  ["Is there a long-term contract?", "No. Plans are month-to-month unless you choose annual billing for the 20% discount. You can upgrade, downgrade or cancel from your dashboard."],
  ["Will I have a dedicated contact?", "Growth and Enterprise members get a dedicated strategist. Starter members work with our shared client success team."],
];

const pricingAudienceIcons = {
  individuals: UserRound,
  organizations: Building2,
};

function TrustedCompanies() {
  const marqueeGroup = [...trustedCompanies, ...trustedCompanies, ...trustedCompanies];

  const renderCollaboration = (company, index, copy) => <div
    className="group flex h-24 min-w-64 items-center justify-center gap-4 rounded-3xl border border-border/70 bg-surface px-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-brand-navy/10"
    key={`${copy}-${company.name}-${index}`}
  >
    {company.logo && <img
      src={company.logo}
      alt=""
      className="max-h-14 max-w-20 object-contain opacity-80 transition duration-300 group-hover:opacity-100"
      loading="lazy"
    />}
    <span className="text-left">
      <span className="block text-lg font-extrabold tracking-tight text-text transition duration-300 group-hover:text-primary">{company.name}</span>
      <span className="mt-1 block text-[10px] font-bold uppercase tracking-[.2em] text-muted">{company.sector}</span>
    </span>
  </div>;

  return <section className="relative z-10 -mt-12 pb-20">
    <div className="container-shell">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: .65 }}
        className="overflow-hidden rounded-[2rem] bg-surface/95 p-6 shadow-2xl shadow-brand-navy/10 backdrop-blur xl:p-8"
      >
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-[.2em] text-primary">Trusted collaborations</div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-text">Partnering with teams that move fast.</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-muted sm:min-w-[360px]">
            {[["2", "operating countries"], ["4", "core service areas"], ["Worldwide", "service coverage"]].map(([value, label]) => <div className="rounded-2xl bg-surface-raised/70 px-3 py-3 shadow-sm shadow-brand-navy/5" key={label}>
              <div className="text-base text-text">{value}</div>
              <div className="mt-1 uppercase tracking-wider">{label}</div>
            </div>)}
          </div>
        </div>

        <div className="relative mt-8 overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="trusted-collaboration-track">
            <div className="trusted-collaboration-group">{marqueeGroup.map((company, index) => renderCollaboration(company, index, "primary"))}</div>
            <div className="trusted-collaboration-group" aria-hidden="true">{marqueeGroup.map((company, index) => renderCollaboration(company, index, "duplicate"))}</div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>;
}

export default function Home() {
  const { billing, setBilling } = useAppStore();
  const [faq, setFaq] = useState(0);
  const [pricingAudience, setPricingAudience] = useState("individuals");
  const [selectedIndividualServices, setSelectedIndividualServices] = useState(["seo", "web"]);
  const selectedModules = individualPricing.services.filter((service) => selectedIndividualServices.includes(service.id));
  const moduleSubtotal = selectedModules.reduce((sum, service) => sum + service.price, 0);
  const individualDiscountRate = individualPricing.discounts[selectedIndividualServices.length] || 0;
  const individualDiscount = Math.round(moduleSubtotal * individualDiscountRate);
  const individualTotal = individualPricing.basePrice + moduleSubtotal - individualDiscount;
  const toggleIndividualService = (id) => setSelectedIndividualServices((current) => current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id]);

  return <div className="overflow-hidden">
    <Seo
      title="On-Demand SEO, Web, Advertising & IT Support"
      description="SEO, web, paid media and IT support in one flexible subscription. Senior specialists, clear priorities, measurable outcomes. Start in 5 days."
      path="/"
    />
    <JsonLd data={organizationSchema} />
    <section className="relative bg-ink pb-24 pt-20 text-white sm:pt-28 lg:pb-32 lg:pt-36">
      <div className="grid-mask absolute inset-0 opacity-80" />
      <div className="absolute left-[10%] top-20 size-80 rounded-full bg-brand-teal/20 blur-[100px]" />
      <div className="container-shell relative">
        <div className="mx-auto max-w-4xl text-center">
          <div className="eyebrow"><span className="size-1.5 rounded-full bg-on-brand-accent shadow-[0_0_12px_#028B7F]" />Your on-demand digital team</div>
          <h1 className="text-5xl font-extrabold leading-[1.02] tracking-[-.055em] sm:text-6xl lg:text-7xl">Grow faster without growing your <span className="bg-gradient-to-r from-brand-teal to-on-brand-accent bg-clip-text text-transparent">headcount.</span></h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-on-brand-muted">SEO, web, paid media and IT support in one flexible subscription. Senior specialists, clear priorities, measurable outcomes.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Button to="/pricing" className="px-7 py-4">View plans <ArrowRight size={17} /></Button><Button to="/contact" variant="secondary" className="border-primary-foreground/25 bg-primary-foreground/10 px-7 py-4 text-primary-foreground hover:bg-primary-foreground/20"><Play size={16} /> Book a free call</Button></div>
          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-on-brand-muted"><CheckCircle2 size={14} className="text-on-brand-accent" /> Start in 5 days · No long contracts · Cancel anytime</p>
        </div>
      </div>
    </section>

    <TrustedCompanies />

    <section className="py-24 sm:py-32">
      <div className="container-shell"><SectionHeading eyebrow="One team, four disciplines" title="Everything your business needs to move forward." copy="Replace fragmented vendors with one accountable team that understands your goals and works from a shared roadmap." />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {services.map(({ slug, icon: Icon, title, short, metric, metricLabel, accent }, index) => <FadeIn delay={index * .06} key={slug}><a href={`/services/${slug}`} className="panel group block overflow-hidden p-7 transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-start justify-between"><span className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg`}><Icon size={22} /></span><ArrowRight className="text-muted/50 transition group-hover:translate-x-1 group-hover:text-primary" /></div>
            <h3 className="mt-7 text-xl font-bold">{title}</h3><p className="mt-3 max-w-md text-sm leading-6 text-muted">{short}</p>
            <div className="mt-7 border-t border-border pt-5 dark:border-white/10"><span className="text-2xl font-extrabold">{metric}</span><span className="ml-2 text-xs text-muted">{metricLabel}</span></div>
          </a></FadeIn>)}
        </div>
      </div>
    </section>

    <section className="bg-surface-raised/60 py-24 sm:py-32"><div className="container-shell">
      <SectionHeading center eyebrow="Why EkSaha" title="Built for momentum, not meetings." copy="A simpler operating model that keeps your best ideas moving from backlog to impact." />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{features.map(({ icon: Icon, title, copy }, index) => <FadeIn key={title} delay={index * .06} className="panel p-6"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={21} /></span><h3 className="mt-5 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{copy}</p></FadeIn>)}</div>
    </div></section>

    <section className="py-24 sm:py-32"><div className="container-shell">
      <SectionHeading eyebrow="How it works" title="From kickoff to progress in three steps." />
      <div className="mt-14 grid gap-10 lg:grid-cols-3">{[["01", "Choose your plan", "Pick the capacity and service mix that fits your priorities today."], ["02", "Build your roadmap", "Meet your strategist, share context, and agree on the first 30 days."], ["03", "See work move", "Track requests, speak with specialists, and review live results."]].map(([step, title, copy]) => <div key={step} className="relative"><span className="text-6xl font-extrabold text-primary/20 dark:text-primary/10">{step}</span><h3 className="mt-[-18px] text-xl font-bold">{title}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-muted">{copy}</p></div>)}</div>
    </div></section>

    <section className="bg-ink py-24 text-white sm:py-32"><div className="container-shell">
      <SectionHeading center eyebrow="Client stories" title="Small teams. Serious outcomes." copy="Partnerships measured in momentum, not deliverable counts." />
      <div className="mt-14 grid gap-5 lg:grid-cols-3">{testimonials.map((item) => <div key={item.name} className="rounded-3xl border border-white/10 bg-white/[.05] p-7"><div className="flex gap-1 text-amber-400">{[1,2,3,4,5].map(i => <Star key={i} size={15} fill="currentColor" />)}</div><blockquote className="mt-6 text-base leading-7 text-white/85">“{item.quote}”</blockquote><div className="mt-7 border-t border-white/10 pt-5"><div className="font-bold">{item.name}</div><div className="mt-1 text-xs text-on-brand-muted">{item.role}</div></div></div>)}</div>
    </div></section>

    <section className="relative overflow-hidden bg-surface-raised/55 py-24 sm:py-32">
      <div className="absolute -right-32 top-8 size-80 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="container-shell relative">
        <div className="overflow-hidden rounded-[2rem] bg-ink p-6 text-white shadow-2xl shadow-brand-navy/15 sm:p-8">
          <div className="grid gap-7 lg:grid-cols-[1fr_minmax(420px,.85fr)] lg:items-end">
            <div className="max-w-2xl">
              <span className="eyebrow">Flexible pricing paths</span>
              <h2 className="text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Choose support built around how you work.</h2>
              <p className="mt-4 leading-7 text-on-brand-muted">Build a focused combination as an individual, or choose coordinated capacity for your organization.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/10 p-1.5" role="tablist" aria-label="Choose individual or organization pricing">
              {audienceOptions.map((option) => {
                const selected = pricingAudience === option.id;
                const Icon = pricingAudienceIcons[option.id];
                return <button
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`home-${option.id}-pricing`}
                  onClick={() => setPricingAudience(option.id)}
                  className={`min-w-0 rounded-xl px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-on-brand-accent/30 sm:px-4 ${selected ? "bg-on-brand-accent text-ink shadow-lg" : "text-white hover:bg-white/10"}`}
                  key={option.id}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${selected ? "bg-ink/10" : "bg-white/10 text-on-brand-accent"}`}><Icon size={17} /></span>
                    <span className="min-w-0"><span className="block text-sm font-extrabold">{option.shortLabel}</span><span className={`mt-0.5 hidden text-[11px] sm:block ${selected ? "text-ink/70" : "text-on-brand-muted"}`}>{option.description}</span></span>
                  </span>
                </button>;
              })}
            </div>
          </div>
        </div>

        {pricingAudience === "individuals"
          ? <div id="home-individuals-pricing" role="tabpanel" className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
            <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-7">
              <div className="flex flex-col justify-between gap-3 border-b border-border pb-5 sm:flex-row sm:items-end">
                <div><span className="text-xs font-extrabold uppercase tracking-[.18em] text-primary">Individual plan builder</span><h3 className="mt-2 text-2xl font-extrabold">Select the specialist support you need.</h3><p className="mt-2 text-sm leading-6 text-muted">Every plan starts with the ${individualPricing.basePrice} workspace base. Add or remove services below.</p></div>
                <span className="w-fit rounded-full bg-primary/10 px-3 py-1.5 text-xs font-extrabold text-primary">{selectedIndividualServices.length} selected</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {individualPricing.services.map((service) => {
                  const selected = selectedIndividualServices.includes(service.id);
                  const Icon = services.find((item) => item.slug === service.id)?.icon;
                  return <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleIndividualService(service.id)}
                    className={`group rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${selected ? "border-primary bg-primary/[.07] shadow-sm" : "border-border bg-surface hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"}`}
                    key={service.id}
                  >
                    <span className="flex items-start justify-between gap-3"><span className={`grid size-10 place-items-center rounded-xl ${selected ? "bg-primary text-primary-foreground" : "bg-surface-raised text-muted group-hover:text-primary"}`}>{Icon && <Icon size={18} />}</span><CheckCircle2 size={19} className={selected ? "text-primary" : "text-border"} /></span>
                    <span className="mt-4 flex items-start justify-between gap-3"><span className="font-extrabold">{service.shortName}</span><span className="whitespace-nowrap text-sm font-extrabold text-primary">+${service.price}/mo</span></span>
                    <span className="mt-2 block text-xs leading-5 text-muted">{service.description}</span>
                  </button>;
                })}
              </div>
            </div>

            <aside className="overflow-hidden rounded-3xl border border-border bg-surface shadow-xl shadow-brand-navy/10" aria-live="polite">
              <div className="bg-ink p-6 text-white">
                <span className="text-xs font-extrabold uppercase tracking-[.18em] text-on-brand-accent">Estimated monthly plan</span>
                <div className="mt-3 flex items-end gap-2"><strong className="text-5xl tracking-[-.05em]">${individualTotal.toLocaleString()}</strong><span className="mb-1 text-sm text-on-brand-muted">/month</span></div>
                <p className="mt-3 text-xs leading-5 text-on-brand-muted">{individualDiscountRate > 0 ? `${Math.round(individualDiscountRate * 100)}% multi-service saving applied.` : "Select two services to unlock a module saving."}</p>
              </div>
              <div className="p-6">
                <div className="space-y-3 text-sm"><div className="flex justify-between gap-3"><span className="text-muted">Workspace base</span><strong>${individualPricing.basePrice}</strong></div>{selectedModules.map((service) => <div className="flex justify-between gap-3" key={service.id}><span className="text-muted">{service.shortName}</span><strong>+${service.price}</strong></div>)}{individualDiscount > 0 && <div className="flex justify-between gap-3 text-emerald-700 dark:text-emerald-300"><span>Bundle saving</span><strong>−${individualDiscount}</strong></div>}</div>
                <Button to="/pricing" className="mt-6 w-full">Open the full plan builder <ArrowRight size={16} /></Button>
                <p className="mt-3 text-center text-xs leading-5 text-muted">Review the complete breakdown before choosing a plan.</p>
              </div>
            </aside>
          </div>
          : <div id="home-organizations-pricing" role="tabpanel" className="mt-8">
            <div className="grid gap-5 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-7 lg:grid-cols-[1fr_auto] lg:items-end">
              <div><span className="text-xs font-extrabold uppercase tracking-[.18em] text-primary">Organization subscriptions</span><h3 className="mt-2 text-2xl font-extrabold">Choose the capacity your team needs.</h3><p className="mt-2 text-sm leading-6 text-muted">Coordinate SEO, web, advertising, and IT support through one accountable delivery model.</p></div>
              <div><div className="mb-2 text-xs font-extrabold uppercase tracking-wider text-muted">Choose billing</div><div className="flex rounded-xl border border-border bg-surface-raised p-1" role="group" aria-label="Billing frequency">{["monthly", "yearly"].map((item) => <button type="button" key={item} onClick={() => setBilling(item)} aria-pressed={billing === item} className={`min-h-10 rounded-lg px-5 py-2 text-sm font-extrabold capitalize transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${billing === item ? "bg-primary text-primary-foreground shadow-md" : "text-text hover:bg-surface"}`}>{item}{item === "yearly" && <span className={`ml-2 text-xs ${billing === item ? "text-primary-foreground" : "text-emerald-700 dark:text-emerald-300"}`}>−20%</span>}</button>)}</div></div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">{["One accountable team", "Clear service coverage", "Room to adapt"].map((label) => <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-xs font-extrabold text-muted shadow-sm" key={label}><CheckCircle2 size={16} className="text-primary" />{label}</div>)}</div>
            <div className="mt-8 grid gap-6 lg:grid-cols-3">{plans.map((plan) => <PlanCard key={plan.name} plan={plan} billing={billing} />)}</div>
            <div className="mt-8 text-center"><Button to="/pricing" variant="secondary">Compare every organization plan <ArrowRight size={16} /></Button></div>
          </div>}
      </div>
    </section>

    <section className="bg-surface-raised/60 py-24 sm:py-32"><div className="container-shell grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
      <SectionHeading eyebrow="FAQ" title="Questions, answered." copy="Still deciding? Book a free 30-minute call and we’ll help you map the right next step." />
      <div className="space-y-3">{faqs.map(([question, answer], index) => <div className="panel overflow-hidden" key={question}><button onClick={() => setFaq(faq === index ? -1 : index)} className="flex w-full items-center justify-between gap-4 p-5 text-left font-bold transition hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-primary/20">{question}<ChevronDown className={`shrink-0 transition ${faq === index ? "rotate-180" : ""}`} size={18} /></button>{faq === index && <p className="px-5 pb-5 text-sm leading-6 text-muted">{answer}</p>}</div>)}</div>
    </div></section>

    <section className="py-20"><div className="container-shell"><div className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-ink px-7 py-14 text-center text-white shadow-2xl shadow-brand-navy/20 sm:px-12"><div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(2,139,127,.24),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(100,216,202,.16),transparent_30%)]" /><div className="absolute -right-20 -top-20 size-72 rounded-full border-[42px] border-brand-teal/15" /><div className="absolute -bottom-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" /><h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">Your next growth chapter can start this week.</h2><p className="relative mx-auto mt-4 max-w-xl text-on-brand-muted">Tell us where you’re headed. We’ll show you the clearest path there.</p><Button to="/contact" className="relative mt-8 shadow-lg shadow-brand-navy/20">Book your free strategy call <ArrowRight size={16} /></Button></div></div></section>
  </div>;
}
