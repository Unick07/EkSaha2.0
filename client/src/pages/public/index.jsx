import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Check, Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import toast from "react-hot-toast";
import { Button, PlanCard, SectionHeading } from "../../components/common/ui";
import { plans, posts, services } from "../../data/siteData";
import { useAdminStore } from "../../store/useAdminStore";
import { useAppStore } from "../../store/useAppStore";

const normalizeStaticPost = (post) => ({ ...post, content: post.content || post.excerpt, source: "static" });
const normalizeAdminPost = (post) => ({
  slug: post.slug || String(post.id),
  category: post.category || "Insights",
  title: post.title,
  excerpt: post.excerpt || "A fresh insight from the EkSaha team.",
  content: post.content || post.excerpt || "",
  date: post.updated || "Recently",
  read: post.read || "4 min",
  source: "admin",
});

function usePublishedPosts() {
  const [serverPosts, setServerPosts] = useState([]);
  const adminPosts = useAdminStore((state) => state.posts);
  useEffect(() => {
    fetch("/api/demo/posts?published=true", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load public posts.");
        return response.json();
      })
      .then(setServerPosts)
      .catch(() => setServerPosts([]));
  }, []);
  const sourcePosts = serverPosts.length > 0 ? serverPosts : adminPosts;
  const publishedAdminPosts = sourcePosts
    .filter((post) => post.status === "Published")
    .map(normalizeAdminPost);

  return [...publishedAdminPosts, ...posts.map(normalizeStaticPost)];
}

export function ServicePage() {
  const { slug } = useParams();
  const service = services.find((item) => item.slug === slug) || services[0];
  const Icon = service.icon;
  return <>
    <section className="bg-ink py-24 text-white"><div className="container-shell grid items-center gap-12 lg:grid-cols-2"><div><span className="eyebrow">EkSaha / {service.slug}</span><h1 className="text-5xl font-extrabold tracking-[-.05em] sm:text-6xl">{service.title}</h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">{service.short}</p><div className="mt-8 flex gap-3"><Button to="/contact">Talk to a specialist <ArrowRight size={16} /></Button><Button to="/pricing" variant="secondary" className="hero-secondary-button">View plans</Button></div></div><div className="relative mx-auto grid aspect-square w-full max-w-md place-items-center rounded-[3rem] border border-white/10 bg-white/5"><div className={`absolute inset-12 rounded-full bg-gradient-to-br ${service.accent} opacity-20 blur-3xl`} /><Icon className="relative text-white" size={110} strokeWidth={1.2} /><div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-ink/70 p-5 backdrop-blur"><div className="text-3xl font-extrabold">{service.metric}</div><div className="text-sm text-slate-400">{service.metricLabel}</div></div></div></div></section>
    <section className="py-24"><div className="container-shell"><SectionHeading eyebrow="What’s included" title="A complete system, not a collection of tasks." /><div className="mt-12 grid gap-5 md:grid-cols-2">{service.features.map((feature, index) => <div key={feature} className="panel flex items-center gap-5 p-6"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-electric dark:bg-primary/10">0{index + 1}</span><div><h3 className="font-bold">{feature}</h3><p className="mt-1 text-sm text-slate-500">Strategy, execution and reporting handled by a specialist in your workspace.</p></div></div>)}</div></div></section>
    <section className="bg-slate-50 py-24 dark:bg-white/[.025]"><div className="container-shell grid gap-10 lg:grid-cols-2"><div><SectionHeading eyebrow="Our toolkit" title="Powered by proven tools and sharp judgment." /><div className="mt-8 flex flex-wrap gap-3">{service.tools.map(tool => <span className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold dark:border-white/10 dark:bg-white/5" key={tool}>{tool}</span>)}</div></div><div className="rounded-3xl bg-ink p-8 text-white"><div className="text-sm text-primary">Recent client result</div><div className="mt-4 text-5xl font-extrabold">{service.metric}</div><p className="mt-4 leading-7 text-slate-300">Achieved through a focused 90-day roadmap, weekly iteration and transparent performance reporting.</p><Button to="/contact" className="mt-7">Build my roadmap</Button></div></div></section>
  </>;
}

export function Pricing() {
  const { billing, setBilling } = useAppStore();
  const allFeatures = ["Core service access", "Request volume", "Strategy calls", "Response target", "Analytics dashboard", "Dedicated strategist"];
  return <><section className="bg-ink py-24 text-center text-white"><div className="container-shell"><span className="eyebrow">Pricing</span><h1 className="text-5xl font-extrabold tracking-[-.05em]">A better team. A simpler bill.</h1><p className="mx-auto mt-5 max-w-2xl text-slate-300">No setup fees, hidden markups or long contracts. Just clear capacity and an experienced team.</p><div className="mx-auto mt-8 flex w-fit rounded-xl border border-white/15 bg-white/10 p-1">{["monthly", "yearly"].map(item => <button key={item} onClick={() => setBilling(item)} className={`rounded-lg px-5 py-2 text-sm font-bold capitalize transition ${billing === item ? "bg-primary text-primary-foreground" : "text-slate-300 hover:bg-white/10"}`}>{item}</button>)}</div></div></section><section className="py-20"><div className="container-shell"><div className="grid gap-6 lg:grid-cols-3">{plans.map(plan => <PlanCard plan={plan} billing={billing} key={plan.name} />)}</div><div className="mt-20 overflow-x-auto rounded-3xl border border-border"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-surface-raised"><tr><th className="p-5">Compare plans</th>{plans.map(p => <th className="p-5" key={p.name}>{p.name}</th>)}</tr></thead><tbody>{allFeatures.map((feature, i) => <tr className="border-t border-border" key={feature}><td className="p-5 font-semibold">{feature}</td>{plans.map((p, pi) => <td className="p-5 text-muted" key={p.name}>{i === 0 ? (pi === 0 ? "1 service" : pi === 1 ? "3 services" : "All services") : i === 1 ? (pi === 0 ? "10 / month" : "Unlimited") : <Check size={17} className="text-primary" />}</td>)}</tr>)}</tbody></table></div></div></section></>;
}

export function About() {
  const values = [["Clarity over theatre", "Useful work, plain language and an honest view of what moves the needle."], ["Own the outcome", "We care about the result after the deliverable, not just the handoff."], ["Small teams, senior people", "Lean collaboration with experienced specialists close to the work."]];
  return <><section className="py-24 sm:py-32"><div className="container-shell grid items-end gap-12 lg:grid-cols-2"><div><span className="eyebrow">About EkSaha</span><h1 className="text-5xl font-extrabold tracking-[-.05em] sm:text-6xl">Technology should create leverage, not overhead.</h1></div><p className="text-lg leading-8 text-slate-500">We started EkSaha to give ambitious small teams access to the digital capability usually reserved for much larger companies. One experienced team, one clear subscription, zero agency fog.</p></div></section><section className="bg-ink py-24 text-white"><div className="container-shell grid gap-5 lg:grid-cols-3">{values.map(([title, copy], i) => <div className="rounded-3xl border border-white/10 bg-white/5 p-7" key={title}><div className="text-sm font-bold text-primary">0{i+1}</div><h2 className="mt-10 text-xl font-bold">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{copy}</p></div>)}</div></section><section className="py-24"><div className="container-shell"><SectionHeading eyebrow="Our team" title="Specialists who stay close to the work." /><div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{["Amelia / Strategy", "Noah / Engineering", "Lina / Growth", "Sam / Client success"].map((person, i) => <div className="panel overflow-hidden" key={person}><div className={`aspect-[4/3] bg-gradient-to-br ${services[i].accent} opacity-80`} /><div className="p-5 font-bold">{person}</div></div>)}</div></div></section></>;
}

export function Blog() {
  const publishedPosts = usePublishedPosts();
  return <><section className="bg-slate-50 py-24 text-center dark:bg-white/[.025]"><div className="container-shell"><span className="eyebrow">EkSaha field notes</span><h1 className="text-5xl font-extrabold tracking-[-.05em]">Ideas for better digital operations.</h1><p className="mx-auto mt-5 max-w-xl text-slate-500">Practical thinking on growth, websites and resilient IT for small teams.</p></div></section><section className="py-20"><div className="container-shell grid gap-6 lg:grid-cols-3">{publishedPosts.map((post, i) => <Link to={`/insights/${post.slug}`} className="panel group overflow-hidden" key={`${post.source}-${post.slug}`}><div className={`h-48 bg-gradient-to-br ${services[i % services.length].accent}`} /><div className="p-6"><div className="text-xs font-bold uppercase tracking-wider text-electric">{post.category}</div><h2 className="mt-3 text-xl font-bold leading-7 group-hover:text-electric">{post.title}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{post.excerpt}</p><div className="mt-6 flex gap-4 text-xs text-slate-400"><span className="flex gap-1"><Calendar size={13}/>{post.date}</span><span className="flex gap-1"><Clock size={13}/>{post.read}</span></div></div></Link>)}</div>{publishedPosts.length === 0 && <div className="container-shell"><div className="panel p-10 text-center text-slate-500">No published insights yet.</div></div>}</section></>;
}

export function BlogPost() {
  const { slug } = useParams(); const publishedPosts = usePublishedPosts(); const post = publishedPosts.find(p => p.slug === slug) || publishedPosts[0];
  if (!post) return <NotFound />;
  return <article><header className="bg-ink py-24 text-white"><div className="container-shell max-w-4xl"><Link to="/insights" className="flex items-center gap-2 text-sm text-primary"><ArrowLeft size={15}/> Back to insights</Link><div className="mt-10 text-sm font-bold uppercase tracking-wider text-primary">{post.category}</div><h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">{post.title}</h1><div className="mt-6 flex gap-5 text-sm text-slate-400"><span>{post.date}</span><span>{post.read} read</span></div></div></header><div className="container-shell max-w-3xl py-20 text-lg leading-8 text-slate-600 dark:text-slate-300"><p className="text-xl leading-9">{post.excerpt}</p>{post.content.split("\n").filter(Boolean).map((paragraph, index) => <p className="mt-5" key={`${post.slug}-${index}`}>{paragraph}</p>)}</div></article>;
}

export function Contact() {
  const submit = e => { e.preventDefault(); e.currentTarget.reset(); toast.success("Thanks — we’ll be in touch within one business day."); };
  return <section className="py-24"><div className="container-shell grid gap-14 lg:grid-cols-[.8fr_1.2fr]"><div><span className="eyebrow">Let’s talk</span><h1 className="text-5xl font-extrabold tracking-[-.05em]">What are you trying to move forward?</h1><p className="mt-6 text-lg leading-8 text-slate-500">Tell us about the goal, the friction, or the idea. We’ll come back with a clear point of view.</p><div className="mt-10 space-y-5 text-sm"><div className="flex gap-3"><Mail className="text-electric" size={19}/>hello@eksaha.com</div><div className="flex gap-3"><Phone className="text-electric" size={19}/>+1 (555) 014-8820</div><div className="flex gap-3"><MapPin className="text-electric" size={19}/>Remote-first · working worldwide</div></div></div><form onSubmit={submit} className="panel grid gap-5 p-7 sm:grid-cols-2"><label className="text-sm font-semibold">Name<input required className="input mt-2" placeholder="Your name"/></label><label className="text-sm font-semibold">Work email<input required type="email" className="input mt-2" placeholder="you@company.com"/></label><label className="text-sm font-semibold sm:col-span-2">What can we help with?<select className="input mt-2"><option>SEO & organic growth</option><option>Website design & development</option><option>Digital advertising</option><option>IT support</option><option>A combination</option></select></label><label className="text-sm font-semibold sm:col-span-2">Tell us a little more<textarea required className="input mt-2 min-h-36 resize-none" placeholder="Goals, timing, current challenges..."/></label><Button className="sm:col-span-2">Send inquiry <Send size={16}/></Button></form></div></section>;
}

export function NotFound() {
  return <section className="grid min-h-[70vh] place-items-center text-center"><div><div className="text-8xl font-extrabold text-primary/15 dark:text-white/10">404</div><h1 className="mt-[-25px] text-3xl font-bold">This page took a wrong turn.</h1><p className="mt-4 text-slate-500">The link may be old, but your next step doesn’t have to be.</p><Button to="/" className="mt-7">Back home</Button></div></section>;
}
