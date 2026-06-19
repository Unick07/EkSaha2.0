import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ChevronDown, Play, Star } from "lucide-react";
import { Button, FadeIn, PlanCard, SectionHeading } from "../../components/common/ui";
import { features, plans, services, testimonials, trustedCompanies } from "../../data/siteData";
import { useAppStore } from "../../store/useAppStore";

const faqs = [
  ["What does “unlimited requests” mean?", "Add as many requests as you like to your workspace. We work through them by priority, with most tasks delivered in two to five business days."],
  ["Can I change which services I use?", "Yes. Your subscription is designed to flex with your business. Shift capacity between SEO, web, advertising and IT support each month."],
  ["Is there a long-term contract?", "No. Plans are month-to-month unless you choose annual billing for the 20% discount. You can upgrade, downgrade or cancel from your dashboard."],
  ["Will I have a dedicated contact?", "Growth and Enterprise members get a dedicated strategist. Starter members work with our shared client success team."],
];

function TrustedCompanies() {
  const marqueeCompanies = [...trustedCompanies, ...trustedCompanies];

  return <section className="relative z-10 -mt-12 pb-20">
    <div className="container-shell">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: .65 }}
        className="panel overflow-hidden p-5 shadow-2xl shadow-slate-950/10"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 lg:flex-row lg:items-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-[.2em] text-primary">Trusted collaborations</div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-text">Partnering with teams that move fast.</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-muted sm:min-w-[360px]">
            {[["120+", "teams"], ["34", "active partners"], ["4.9/5", "avg rating"]].map(([value, label]) => <div className="rounded-2xl border border-border bg-surface-raised px-3 py-3" key={label}>
              <div className="text-base text-text">{value}</div>
              <div className="mt-1 uppercase tracking-wider">{label}</div>
            </div>)}
          </div>
        </div>

        <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <motion.div
            className="flex w-max gap-4"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
          >
            {marqueeCompanies.map((company, index) => <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className="flex min-w-56 items-center gap-4 rounded-2xl border border-border bg-surface-raised/80 px-4 py-4 shadow-sm"
              key={`${company.name}-${index}`}
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-sm font-extrabold text-primary-foreground shadow-glow">{company.initials}</span>
              <span>
                <span className="block font-extrabold text-text">{company.name}</span>
                <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-muted">{company.sector}</span>
              </span>
            </motion.div>)}
          </motion.div>
        </div>
      </motion.div>
    </div>
  </section>;
}

export default function Home() {
  const { billing, setBilling } = useAppStore();
  const [faq, setFaq] = useState(0);
  return <div className="overflow-hidden">
    <section className="relative bg-ink pb-24 pt-20 text-white sm:pt-28 lg:pb-32 lg:pt-36">
      <div className="grid-mask absolute inset-0 opacity-80" />
      <div className="absolute left-[10%] top-20 size-80 rounded-full bg-blue-600/20 blur-[100px]" />
      <div className="container-shell relative">
        <div className="mx-auto max-w-4xl text-center">
          <div className="eyebrow border-blue-400/20 bg-blue-400/10 text-blue-200"><span className="size-1.5 rounded-full bg-cyan shadow-[0_0_12px_#67E8F9]" />Your on-demand digital team</div>
          <h1 className="text-5xl font-extrabold leading-[1.02] tracking-[-.055em] sm:text-6xl lg:text-7xl">Grow faster without growing your <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">headcount.</span></h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-300">SEO, web, paid media and IT support in one flexible subscription. Senior specialists, clear priorities, measurable outcomes.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Button to="/pricing" className="px-7 py-4">View plans <ArrowRight size={17} /></Button><Button to="/contact" variant="secondary" className="border-primary-foreground/25 bg-primary-foreground/10 px-7 py-4 text-primary-foreground hover:bg-primary-foreground/20"><Play size={16} /> Book a free call</Button></div>
          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400"><CheckCircle2 size={14} className="text-cyan" /> Start in 5 days · No long contracts · Cancel anytime</p>
        </div>
      </div>
    </section>

    <TrustedCompanies />

    <section className="py-24 sm:py-32">
      <div className="container-shell"><SectionHeading eyebrow="One team, four disciplines" title="Everything your business needs to move forward." copy="Replace fragmented vendors with one accountable team that understands your goals and works from a shared roadmap." />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {services.map(({ slug, icon: Icon, title, short, metric, metricLabel, accent }, index) => <FadeIn delay={index * .06} key={slug}><a href={`/services/${slug}`} className="panel group block overflow-hidden p-7 transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-start justify-between"><span className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg`}><Icon size={22} /></span><ArrowRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-electric" /></div>
            <h3 className="mt-7 text-xl font-bold">{title}</h3><p className="mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{short}</p>
            <div className="mt-7 border-t border-slate-100 pt-5 dark:border-white/10"><span className="text-2xl font-extrabold">{metric}</span><span className="ml-2 text-xs text-slate-500">{metricLabel}</span></div>
          </a></FadeIn>)}
        </div>
      </div>
    </section>

    <section className="bg-slate-50 py-24 dark:bg-white/[.025] sm:py-32"><div className="container-shell">
      <SectionHeading center eyebrow="Why EkSaha" title="Built for momentum, not meetings." copy="A simpler operating model that keeps your best ideas moving from backlog to impact." />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{features.map(({ icon: Icon, title, copy }, index) => <FadeIn key={title} delay={index * .06} className="panel p-6"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-electric dark:bg-blue-500/10"><Icon size={21} /></span><h3 className="mt-5 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p></FadeIn>)}</div>
    </div></section>

    <section className="py-24 sm:py-32"><div className="container-shell">
      <SectionHeading eyebrow="How it works" title="From kickoff to progress in three steps." />
      <div className="mt-14 grid gap-10 lg:grid-cols-3">{[["01", "Choose your plan", "Pick the capacity and service mix that fits your priorities today."], ["02", "Build your roadmap", "Meet your strategist, share context, and agree on the first 30 days."], ["03", "See work move", "Track requests, speak with specialists, and review live results."]].map(([step, title, copy]) => <div key={step} className="relative"><span className="text-6xl font-extrabold text-blue-100 dark:text-white/5">{step}</span><h3 className="mt-[-18px] text-xl font-bold">{title}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">{copy}</p></div>)}</div>
    </div></section>

    <section className="bg-ink py-24 text-white sm:py-32"><div className="container-shell">
      <SectionHeading center eyebrow="Client stories" title="Small teams. Serious outcomes." copy="Partnerships measured in momentum, not deliverable counts." />
      <div className="mt-14 grid gap-5 lg:grid-cols-3">{testimonials.map((item) => <div key={item.name} className="rounded-3xl border border-white/10 bg-white/[.05] p-7"><div className="flex gap-1 text-amber-400">{[1,2,3,4,5].map(i => <Star key={i} size={15} fill="currentColor" />)}</div><blockquote className="mt-6 text-base leading-7 text-slate-200">“{item.quote}”</blockquote><div className="mt-7 border-t border-white/10 pt-5"><div className="font-bold">{item.name}</div><div className="mt-1 text-xs text-slate-400">{item.role}</div></div></div>)}</div>
    </div></section>

    <section className="py-24 sm:py-32"><div className="container-shell">
      <SectionHeading center eyebrow="Simple pricing" title="One subscription. A full team." copy="Start where you are. Upgrade, downgrade, or pause as priorities change." />
      <div className="mx-auto mt-8 flex w-fit rounded-xl border border-border bg-surface-raised p-1">{["monthly", "yearly"].map(item => <button key={item} onClick={() => setBilling(item)} className={`rounded-lg px-5 py-2 text-sm font-bold capitalize transition ${billing === item ? "bg-primary text-primary-foreground shadow-sm" : "text-muted hover:bg-surface hover:text-text"}`}>{item}{item === "yearly" && <span className="ml-2 text-xs text-emerald-500">-20%</span>}</button>)}</div>
      <div className="mt-10 grid gap-6 lg:grid-cols-3">{plans.map(plan => <PlanCard key={plan.name} plan={plan} billing={billing} />)}</div>
    </div></section>

    <section className="bg-slate-50 py-24 dark:bg-white/[.025] sm:py-32"><div className="container-shell grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
      <SectionHeading eyebrow="FAQ" title="Questions, answered." copy="Still deciding? Book a free 30-minute call and we’ll help you map the right next step." />
      <div className="space-y-3">{faqs.map(([question, answer], index) => <div className="panel overflow-hidden" key={question}><button onClick={() => setFaq(faq === index ? -1 : index)} className="flex w-full items-center justify-between gap-4 p-5 text-left font-bold">{question}<ChevronDown className={`shrink-0 transition ${faq === index ? "rotate-180" : ""}`} size={18} /></button>{faq === index && <p className="px-5 pb-5 text-sm leading-6 text-slate-500">{answer}</p>}</div>)}</div>
    </div></section>

    <section className="py-20"><div className="container-shell"><div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-accent px-7 py-14 text-center text-primary-foreground shadow-glow sm:px-12"><div className="absolute -right-20 -top-20 size-72 rounded-full border-[40px] border-primary-foreground/10" /><h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">Your next growth chapter can start this week.</h2><p className="relative mx-auto mt-4 max-w-xl opacity-85">Tell us where you’re headed. We’ll show you the clearest path there.</p><Button to="/contact" variant="secondary" className="relative mt-8 border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">Book your free strategy call <ArrowRight size={16} /></Button></div></div></section>
  </div>;
}
