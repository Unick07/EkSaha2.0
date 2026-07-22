import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Check, Clock, Link2, Linkedin, Mail, MapPin, Phone, Send, Twitter } from "lucide-react";
import toast from "react-hot-toast";
import { Button, PlanCard, SectionHeading } from "../../components/common/ui";
import { plans, posts, services } from "../../data/siteData";
import { useAdminStore } from "../../store/useAdminStore";
import { useAppStore } from "../../store/useAppStore";

// Raw ISO timestamps from the server ("2026-07-22T00:28:05.113Z") and the
// static posts' already-readable strings ("May 28, 2026") both parse fine
// here, so every post's date renders the same human way regardless of source.
function formatPostDate(value) {
  if (!value) return "Recently";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const slugifyHeading = (value) => String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

// A small, dependency-free stand-in for a real markdown parser: just enough
// to recognize headings, blockquotes, fenced code and lists so the content
// area can style them properly and the table of contents has something to
// link to. Nothing beyond this line-by-line block scanning (no inline bold/
// italic/links) - a full parser is a bigger addition than this redesign calls for.
function parseContentBlocks(content) {
  const lines = String(content || "").split("\n");
  const blocks = [];
  const seenIds = new Set();
  let list = null;
  let i = 0;

  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  const uniqueId = (text) => {
    const base = slugifyHeading(text) || "section";
    let id = base;
    let suffix = 2;
    while (seenIds.has(id)) { id = `${base}-${suffix}`; suffix += 1; }
    seenIds.add(id);
    return id;
  };

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) { flushList(); i += 1; continue; }

    const heading = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushList();
      const text = heading[2];
      blocks.push({ type: "heading", level: heading[1].length, text, id: uniqueId(text) });
      i += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushList();
      const codeLines = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: "code", text: codeLines.join("\n") });
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushList();
      blocks.push({ type: "quote", text: trimmed.replace(/^>\s?/, "") });
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      if (!list || list.ordered) { flushList(); list = { type: "list", ordered: false, items: [] }; }
      list.items.push(trimmed.replace(/^[-*]\s+/, ""));
      i += 1;
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (!list || !list.ordered) { flushList(); list = { type: "list", ordered: true, items: [] }; }
      list.items.push(trimmed.replace(/^\d+\.\s+/, ""));
      i += 1;
      continue;
    }

    flushList();
    blocks.push({ type: "paragraph", text: trimmed });
    i += 1;
  }
  flushList();
  return blocks;
}

const HEADING_STYLES = {
  1: { tag: "h2", className: "mb-2.5 mt-8 text-3xl" },
  2: { tag: "h2", className: "mb-2 mt-7 text-2xl" },
  3: { tag: "h3", className: "mb-2 mt-6 text-xl" },
};

function ContentBlock({ block }) {
  if (block.type === "heading") {
    const { tag: Tag, className } = HEADING_STYLES[block.level] || HEADING_STYLES[3];
    return <Tag id={block.id} className={`scroll-mt-24 font-extrabold tracking-tight text-text ${className}`}>{block.text}</Tag>;
  }
  if (block.type === "quote") {
    return <blockquote className="my-4 border-l-4 border-primary/40 pl-5 italic text-muted">{block.text}</blockquote>;
  }
  if (block.type === "code") {
    return <pre className="my-4 overflow-x-auto rounded-2xl bg-slate-900 p-5 text-sm leading-6 text-slate-100 dark:bg-black/40"><code>{block.text}</code></pre>;
  }
  if (block.type === "list") {
    const Tag = block.ordered ? "ol" : "ul";
    return <Tag className={`my-4 space-y-1.5 pl-6 marker:text-primary ${block.ordered ? "list-decimal" : "list-disc"}`}>
      {block.items.map((item, index) => <li className="leading-[1.6]" key={index}>{item}</li>)}
    </Tag>;
  }
  return <p className="my-4 leading-[1.6]">{block.text}</p>;
}

// Compact and merged straight into the hero's meta row - not a separate
// section with its own margin.
function ShareRow({ title, url }) {
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied.");
    } catch {
      toast.error("Could not copy the link.");
    }
  };
  const targets = [
    { label: "Share on X", icon: Twitter, href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
    { label: "Share on LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  ];
  return <span className="flex items-center gap-1.5">
    <button type="button" onClick={copyLink} aria-label="Copy link" className="grid size-6 place-items-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-slate-200">
      <Link2 size={13} />
    </button>
    {targets.map((target) => <a key={target.label} href={target.href} target="_blank" rel="noreferrer" aria-label={target.label} className="grid size-6 place-items-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-slate-200">
      <target.icon size={13} />
    </a>)}
  </span>;
}

const normalizeStaticPost = (post) => ({ ...post, content: post.content || post.excerpt, image: post.image || null, source: "static" });
const normalizeAdminPost = (post) => ({
  slug: post.slug || String(post.id),
  category: post.category || "Insights",
  title: post.title,
  excerpt: post.excerpt || "A fresh insight from the EkSaha team.",
  content: post.content || post.excerpt || "",
  date: post.updated || "Recently",
  read: post.read || "4 min",
  image: post.image || null,
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
    <section className="bg-ink py-24 text-white"><div className="container-shell grid items-center gap-12 lg:grid-cols-2"><div><span className="eyebrow">EkSaha / {service.slug}</span><h1 className="text-5xl font-extrabold tracking-[-.05em] sm:text-6xl">{service.title}</h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">{service.short}</p><div className="mt-8 flex gap-3"><Button to="/contact">Talk to a specialist <ArrowRight size={16} /></Button><Button to="/pricing" variant="secondary" className="border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">View plans</Button></div></div><div className="relative mx-auto grid aspect-square w-full max-w-md place-items-center rounded-[3rem] border border-white/10 bg-white/5"><div className={`absolute inset-12 rounded-full bg-gradient-to-br ${service.accent} opacity-20 blur-3xl`} /><Icon className="relative text-white" size={110} strokeWidth={1.2} /><div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-ink/70 p-5 backdrop-blur"><div className="text-3xl font-extrabold">{service.metric}</div><div className="text-sm text-slate-400">{service.metricLabel}</div></div></div></div></section>
    <section className="py-24"><div className="container-shell"><SectionHeading eyebrow="What’s included" title="A complete system, not a collection of tasks." /><div className="mt-12 grid gap-5 md:grid-cols-2">{service.features.map((feature, index) => <div key={feature} className="panel flex items-center gap-5 p-6"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-50 font-bold text-electric dark:bg-blue-500/10">0{index + 1}</span><div><h3 className="font-bold">{feature}</h3><p className="mt-1 text-sm text-slate-500">Strategy, execution and reporting handled by a specialist in your workspace.</p></div></div>)}</div></div></section>
    <section className="bg-slate-50 py-24 dark:bg-white/[.025]"><div className="container-shell grid gap-10 lg:grid-cols-2"><div><SectionHeading eyebrow="Our toolkit" title="Powered by proven tools and sharp judgment." /><div className="mt-8 flex flex-wrap gap-3">{service.tools.map(tool => <span className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold dark:border-white/10 dark:bg-white/5" key={tool}>{tool}</span>)}</div></div><div className="rounded-3xl bg-ink p-8 text-white"><div className="text-sm text-blue-300">Recent client result</div><div className="mt-4 text-5xl font-extrabold">{service.metric}</div><p className="mt-4 leading-7 text-slate-300">Achieved through a focused 90-day roadmap, weekly iteration and transparent performance reporting.</p><Button to="/contact" className="mt-7">Build my roadmap</Button></div></div></section>
  </>;
}

export function Pricing() {
  const { billing, setBilling } = useAppStore();
  const allFeatures = ["Core service access", "Request volume", "Strategy calls", "Response target", "Analytics dashboard", "Dedicated strategist"];
  return <><section className="bg-ink py-24 text-center text-white"><div className="container-shell"><span className="eyebrow">Pricing</span><h1 className="text-5xl font-extrabold tracking-[-.05em]">A better team. A simpler bill.</h1><p className="mx-auto mt-5 max-w-2xl text-slate-300">No setup fees, hidden markups or long contracts. Just clear capacity and an experienced team.</p><div className="mx-auto mt-8 flex w-fit rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 p-1">{["monthly", "yearly"].map(item => <button key={item} onClick={() => setBilling(item)} className={`rounded-lg px-5 py-2 text-sm font-bold capitalize transition ${billing === item ? "bg-primary text-primary-foreground" : "text-slate-300 hover:bg-primary-foreground/10"}`}>{item}</button>)}</div></div></section><section className="py-20"><div className="container-shell"><div className="grid gap-6 lg:grid-cols-3">{plans.map(plan => <PlanCard plan={plan} billing={billing} key={plan.name} />)}</div><div className="mt-20 overflow-x-auto rounded-3xl border border-border"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-surface-raised"><tr><th className="p-5">Compare plans</th>{plans.map(p => <th className="p-5" key={p.name}>{p.name}</th>)}</tr></thead><tbody>{allFeatures.map((feature, i) => <tr className="border-t border-border" key={feature}><td className="p-5 font-semibold">{feature}</td>{plans.map((p, pi) => <td className="p-5 text-muted" key={p.name}>{i === 0 ? (pi === 0 ? "1 service" : pi === 1 ? "3 services" : "All services") : i === 1 ? (pi === 0 ? "10 / month" : "Unlimited") : <Check size={17} className="text-emerald-500" />}</td>)}</tr>)}</tbody></table></div></div></section></>;
}

export function About() {
  const values = [["Clarity over theatre", "Useful work, plain language and an honest view of what moves the needle."], ["Own the outcome", "We care about the result after the deliverable, not just the handoff."], ["Small teams, senior people", "Lean collaboration with experienced specialists close to the work."]];
  return <><section className="py-24 sm:py-32"><div className="container-shell grid items-end gap-12 lg:grid-cols-2"><div><span className="eyebrow">About EkSaha</span><h1 className="text-5xl font-extrabold tracking-[-.05em] sm:text-6xl">Technology should create leverage, not overhead.</h1></div><p className="text-lg leading-8 text-slate-500">We started EkSaha to give ambitious small teams access to the digital capability usually reserved for much larger companies. One experienced team, one clear subscription, zero agency fog.</p></div></section><section className="bg-ink py-24 text-white"><div className="container-shell grid gap-5 lg:grid-cols-3">{values.map(([title, copy], i) => <div className="rounded-3xl border border-white/10 bg-white/5 p-7" key={title}><div className="text-sm font-bold text-blue-300">0{i+1}</div><h2 className="mt-10 text-xl font-bold">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{copy}</p></div>)}</div></section><section className="py-24"><div className="container-shell"><SectionHeading eyebrow="Our team" title="Specialists who stay close to the work." /><div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{["Amelia / Strategy", "Noah / Engineering", "Lina / Growth", "Sam / Client success"].map((person, i) => <div className="panel overflow-hidden" key={person}><div className={`aspect-[4/3] bg-gradient-to-br ${services[i].accent} opacity-80`} /><div className="p-5 font-bold">{person}</div></div>)}</div></div></section></>;
}

export function Blog() {
  const publishedPosts = usePublishedPosts();
  return <><section className="bg-slate-50 py-24 text-center dark:bg-white/[.025]"><div className="container-shell"><span className="eyebrow">EkSaha field notes</span><h1 className="text-5xl font-extrabold tracking-[-.05em]">Ideas for better digital operations.</h1><p className="mx-auto mt-5 max-w-xl text-slate-500">Practical thinking on growth, websites and resilient IT for small teams.</p></div></section><section className="py-20"><div className="container-shell grid gap-6 lg:grid-cols-3">{publishedPosts.map((post, i) => <Link to={`/insights/${post.slug}`} className="panel group overflow-hidden" key={`${post.source}-${post.slug}`}>{post.image ? <img src={post.image} alt={post.title} loading="lazy" className="h-48 w-full object-cover" /> : <div className={`h-48 bg-gradient-to-br ${services[i % services.length].accent}`} />}<div className="p-6"><div className="text-xs font-bold uppercase tracking-wider text-electric">{post.category}</div><h2 className="mt-3 text-xl font-bold leading-7 group-hover:text-electric">{post.title}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{post.excerpt}</p><div className="mt-6 flex gap-4 text-xs text-slate-400"><span className="flex gap-1"><Calendar size={13}/>{formatPostDate(post.date)}</span><span className="flex gap-1"><Clock size={13}/>{post.read}</span></div></div></Link>)}</div>{publishedPosts.length === 0 && <div className="container-shell"><div className="panel p-10 text-center text-slate-500">No published insights yet.</div></div>}</section></>;
}

export function BlogPost() {
  const { slug } = useParams();
  const publishedPosts = usePublishedPosts();
  const post = publishedPosts.find((p) => p.slug === slug) || publishedPosts[0];
  const blocks = useMemo(() => parseContentBlocks(post?.content), [post?.content]);

  if (!post) return <NotFound />;

  const others = publishedPosts.filter((item) => `${item.source}-${item.slug}` !== `${post.source}-${post.slug}`);
  const related = [...others.filter((item) => item.category === post.category), ...others.filter((item) => item.category !== post.category)].slice(0, 3);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return <article>
    <header className="relative overflow-hidden bg-ink py-10 text-white sm:py-12">
      <div className="grid-mask absolute inset-0 opacity-70" />
      <div className="absolute right-[8%] top-10 size-72 rounded-full bg-blue-600/20 blur-[110px]" />
      <div className="container-shell relative max-w-4xl">
        <Link to="/insights" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300 transition hover:text-blue-200"><ArrowLeft size={15} /> Back to insights</Link>
        <div className="eyebrow mt-4 border-blue-400/20 bg-blue-400/10 text-blue-200">{post.category}</div>
        <h1 className="mt-3 text-3xl font-extrabold leading-[1.15] tracking-[-.02em] sm:text-4xl lg:text-5xl">{post.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-400">
          <span className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-md bg-primary text-[10px] font-extrabold text-primary-foreground">E</span>EkSaha Team</span>
          <span className="flex items-center gap-1.5"><Calendar size={13} />{formatPostDate(post.date)}</span>
          <span className="flex items-center gap-1.5"><Clock size={13} />{post.read} read</span>
          <ShareRow title={post.title} url={shareUrl} />
        </div>
      </div>
    </header>

    <div className="container-shell py-8 sm:py-10">
      <div className="mx-auto max-w-[680px]">
        {post.image && <img src={post.image} alt={post.title} loading="lazy" className="mb-6 h-[220px] w-full rounded-2xl object-cover shadow-md sm:h-[320px] lg:h-[400px]" />}

        <p className="mb-4 text-lg leading-[1.5] text-text">{post.excerpt}</p>
        <div className="text-[17px] leading-[1.6] text-slate-600 dark:text-slate-300">
          {blocks.map((block, index) => <ContentBlock block={block} key={index} />)}
        </div>

        <div className="panel mt-8 flex items-center gap-3 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground">E</span>
          <p className="min-w-0 flex-1 text-sm leading-snug">
            <span className="font-bold text-text">EkSaha Team</span>{" "}
            <span className="text-muted">— practical thinking on SEO, web, advertising and IT support.</span>
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-accent p-6 text-center text-primary-foreground sm:p-8">
          <h3 className="text-xl font-extrabold sm:text-2xl">Ready to grow your business?</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-primary-foreground/85">Get started with EkSaha and put SEO, web, advertising and IT support on autopilot.</p>
          <Button to="/pricing" variant="secondary" className="mt-5 border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">Get started with EkSaha <ArrowRight size={16} /></Button>
        </div>
      </div>

      {related.length > 0 && <div className="mx-auto mt-12 max-w-3xl">
        <h3 className="text-lg font-extrabold text-text">Keep reading</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {related.map((item, index) => <Link to={`/insights/${item.slug}`} className="panel group overflow-hidden" key={`${item.source}-${item.slug}`}>
            {item.image ? <img src={item.image} alt={item.title} loading="lazy" className="h-24 w-full object-cover" /> : <div className={`h-24 bg-gradient-to-br ${services[index % services.length].accent}`} />}
            <div className="p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-electric">{item.category}</div>
              <h4 className="mt-1.5 text-sm font-bold leading-5 text-text group-hover:text-electric">{item.title}</h4>
            </div>
          </Link>)}
        </div>
      </div>}
    </div>
  </article>;
}

export function Contact() {
  const submit = e => { e.preventDefault(); e.currentTarget.reset(); toast.success("Thanks — we’ll be in touch within one business day."); };
  return <section className="py-24"><div className="container-shell grid gap-14 lg:grid-cols-[.8fr_1.2fr]"><div><span className="eyebrow">Let’s talk</span><h1 className="text-5xl font-extrabold tracking-[-.05em]">What are you trying to move forward?</h1><p className="mt-6 text-lg leading-8 text-slate-500">Tell us about the goal, the friction, or the idea. We’ll come back with a clear point of view.</p><div className="mt-10 space-y-5 text-sm"><div className="flex gap-3"><Mail className="text-electric" size={19}/>hello@eksaha.com</div><div className="flex gap-3"><Phone className="text-electric" size={19}/>+1 (555) 014-8820</div><div className="flex gap-3"><MapPin className="text-electric" size={19}/>Remote-first · working worldwide</div></div></div><form onSubmit={submit} className="panel grid gap-5 p-7 sm:grid-cols-2"><label className="text-sm font-semibold">Name<input required className="input mt-2" placeholder="Your name"/></label><label className="text-sm font-semibold">Work email<input required type="email" className="input mt-2" placeholder="you@company.com"/></label><label className="text-sm font-semibold sm:col-span-2">What can we help with?<select className="input mt-2"><option>SEO & organic growth</option><option>Website design & development</option><option>Digital advertising</option><option>IT support</option><option>A combination</option></select></label><label className="text-sm font-semibold sm:col-span-2">Tell us a little more<textarea required className="input mt-2 min-h-36 resize-none" placeholder="Goals, timing, current challenges..."/></label><Button className="sm:col-span-2">Send inquiry <Send size={16}/></Button></form></div></section>;
}

export function NotFound() {
  return <section className="grid min-h-[70vh] place-items-center text-center"><div><div className="text-8xl font-extrabold text-blue-100 dark:text-white/10">404</div><h1 className="mt-[-25px] text-3xl font-bold">This page took a wrong turn.</h1><p className="mt-4 text-slate-500">The link may be old, but your next step doesn’t have to be.</p><Button to="/" className="mt-7">Back home</Button></div></section>;
}
