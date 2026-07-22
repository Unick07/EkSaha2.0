import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ArrowRight, Calendar, Check, CheckCircle2, Clock, Copy, Globe, Info, Lightbulb, Megaphone, Search, ShieldCheck, Sparkles, Target } from "lucide-react";
import { Button } from "../../components/common/ui";
import { services } from "../../data/siteData";
import { formatPostDate, usePublishedPosts } from "./blogData";
import NotFound from "./NotFound";

const slugifyHeading = (value) => String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

// A small, dependency-free stand-in for a real markdown parser: headings,
// blockquotes, fenced code (with an optional language tag), lists, images
// with an optional *caption* line, and :::type callout blocks. No inline
// bold/italic/links - a full parser is a bigger addition than this redesign
// calls for, and the brief asks not to add libraries for this.
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

    const calloutStart = trimmed.match(/^:::(info|warning|success|tip)\s*$/i);
    if (calloutStart) {
      flushList();
      const calloutType = calloutStart[1].toLowerCase();
      const calloutLines = [];
      i += 1;
      while (i < lines.length && lines[i].trim() !== ":::") {
        calloutLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: "callout", calloutType, text: calloutLines.join(" ").trim() });
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushList();
      const language = trimmed.slice(3).trim();
      const codeLines = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: "code", text: codeLines.join("\n"), language });
      continue;
    }

    const image = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      flushList();
      let caption = "";
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j += 1;
      const captionMatch = j < lines.length && lines[j].trim().match(/^\*(.+)\*$/);
      i = captionMatch ? j + 1 : i + 1;
      if (captionMatch) caption = captionMatch[1];
      blocks.push({ type: "image", alt: image[1], src: image[2], caption });
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
  1: { tag: "h2", className: "mb-3 mt-10 text-2xl sm:text-3xl" },
  2: { tag: "h2", className: "mb-2.5 mt-9 text-xl sm:text-2xl" },
  3: { tag: "h3", className: "mb-2 mt-7 text-lg sm:text-xl" },
};

const CALLOUT_STYLES = {
  info: { icon: Info, label: "Info", className: "border-primary/25 bg-primary/5", iconClassName: "bg-primary/10 text-primary" },
  warning: { icon: AlertTriangle, label: "Warning", className: "border-amber-500/25 bg-amber-500/5", iconClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  success: { icon: CheckCircle2, label: "Success", className: "border-emerald-500/25 bg-emerald-500/5", iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  tip: { icon: Lightbulb, label: "Tip", className: "border-accent/25 bg-accent/5", iconClassName: "bg-accent/10 text-accent" },
};

// One reusable component parameterized by type, rather than four near-
// identical ones, per the "don't duplicate code" brief.
function Callout({ type, children }) {
  const style = CALLOUT_STYLES[type] || CALLOUT_STYLES.info;
  const Icon = style.icon;
  return <div role="note" aria-label={style.label} className={`my-5 flex gap-3 rounded-xl border p-4 ${style.className}`}>
    <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${style.iconClassName}`}><Icon size={15} /></span>
    <div className="min-w-0 flex-1 text-[15px] leading-[1.6] text-text">{children}</div>
  </div>;
}

// Heuristic, dependency-free token highlighter (comments/strings/numbers/
// keywords) - not a full language-aware highlighter like Prism/Shiki, which
// the brief says not to add as a new dependency for this.
const CODE_TOKEN_REGEX = /(\/\/.*$)|(#.*$)|(\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|(\b(?:const|let|var|function|return|if|else|import|export|from|class|new|async|await|for|while|true|false|null|undefined|try|catch|throw|switch|case|break|continue|extends|default)\b)/gm;

function highlightCode(code) {
  const nodes = [];
  let lastIndex = 0;
  let key = 0;
  let match = CODE_TOKEN_REGEX.exec(code);
  while (match) {
    if (match.index > lastIndex) nodes.push(code.slice(lastIndex, match.index));
    const [full, lineComment, hashComment, blockComment, string, number, keyword] = match;
    let className = "text-slate-200";
    if (lineComment || hashComment || blockComment) className = "text-slate-500 italic";
    else if (string) className = "text-emerald-400";
    else if (number) className = "text-amber-300";
    else if (keyword) className = "text-sky-400";
    nodes.push(<span className={className} key={key}>{full}</span>);
    key += 1;
    lastIndex = match.index + full.length;
    match = CODE_TOKEN_REGEX.exec(code);
  }
  if (lastIndex < code.length) nodes.push(code.slice(lastIndex));
  return nodes;
}

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* Clipboard access denied - the button silently stays in its default state. */
    }
  };
  return <div className="my-5 overflow-hidden rounded-xl bg-slate-900 dark:bg-black/40">
    <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{language || "code"}</span>
      <button type="button" onClick={copy} aria-label="Copy code" className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/10">
        {copied ? <><Check size={13} />Copied</> : <><Copy size={13} />Copy</>}
      </button>
    </div>
    <pre className="overflow-x-auto p-4 text-[13px] leading-6"><code>{highlightCode(code)}</code></pre>
  </div>;
}

function ContentBlock({ block }) {
  if (block.type === "heading") {
    const { tag: Tag, className } = HEADING_STYLES[block.level] || HEADING_STYLES[3];
    return <Tag id={block.id} className={`scroll-mt-24 font-extrabold tracking-tight text-text ${className}`}>{block.text}</Tag>;
  }
  if (block.type === "callout") {
    return <Callout type={block.calloutType}>{block.text}</Callout>;
  }
  if (block.type === "image") {
    return <figure className="my-6">
      <img src={block.src} alt={block.alt} loading="lazy" className="w-full rounded-xl border border-border shadow-md" />
      {block.caption && <figcaption className="mt-2 text-center text-sm text-muted">{block.caption}</figcaption>}
    </figure>;
  }
  if (block.type === "quote") {
    return <blockquote className="my-5 border-l-4 border-primary/40 pl-5 italic text-muted">{block.text}</blockquote>;
  }
  if (block.type === "code") {
    return <CodeBlock code={block.text} language={block.language} />;
  }
  if (block.type === "list") {
    const Tag = block.ordered ? "ol" : "ul";
    return <Tag className={`my-4 space-y-1.5 pl-6 marker:text-primary ${block.ordered ? "list-decimal" : "list-disc"}`}>
      {block.items.map((item, index) => <li className="leading-[1.7]" key={index}>{item}</li>)}
    </Tag>;
  }
  return <p className="my-4 leading-[1.8]">{block.text}</p>;
}

// PublicLayout wraps every route in framer-motion's <motion.main>, which
// sets an inline `transform` for its page-transition animation - per the
// CSS spec that makes it the containing block for `position: fixed`
// descendants, so this has to escape it via a portal onto <body> or it
// ends up "fixed" to the top of <main> instead of the viewport.
function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = (doc.scrollHeight || 0) - doc.clientHeight;
      setProgress(max > 0 ? Math.min(100, Math.max(0, (doc.scrollTop / max) * 100)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return createPortal(
    <div className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent">
      <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${progress}%` }} />
    </div>,
    document.body,
  );
}

// Native IntersectionObserver scroll-spy - no library needed. The negative
// bottom rootMargin means a heading counts as "active" once it crosses into
// roughly the top third of the viewport, not only when fully visible.
function useActiveHeading(headingIds) {
  const [activeId, setActiveId] = useState(null);
  useEffect(() => {
    if (headingIds.length === 0) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );
    headingIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headingIds]);
  return activeId;
}

// Generic placeholder facts per category, shown in the right rail's "Did you
// know?" card. Static for now, as specified - not derived from real data.
const CATEGORY_FACTS = {
  SEO: [
    "73% of clicks go to the first 3 Google search results.",
    "53% of all website traffic comes from organic search.",
    "The average first-page Google result is 1,447 words long.",
  ],
  Web: [
    "A 1-second delay in page load can reduce conversions by 7%.",
    "88% of users are less likely to return after a bad experience.",
    "Mobile devices drive over 60% of global web traffic.",
  ],
  Ads: [
    "Google Ads reaches over 90% of internet users worldwide.",
    "Retargeted ads see a 10x higher click-through rate on average.",
    "Cost per click varies by more than 400% across industries.",
  ],
  "IT Support": [
    "60% of small businesses close within 6 months of a major data breach.",
    "Proactive IT maintenance can cut downtime by up to 85%.",
    "Average IT downtime costs over $5,600 per minute.",
  ],
  Strategy: [
    "Companies with a documented strategy grow 2x faster than those without.",
    "70% of strategic plans fail from poor execution, not poor planning.",
    "Quarterly strategy reviews outperform annual ones by 30%.",
  ],
  Insights: [
    "Data-driven companies are 23x more likely to acquire customers.",
    "Only 32% of businesses say they get real value from their data.",
    "Teams that share insights weekly make decisions 5x faster.",
  ],
};
const DEFAULT_FACTS = [
  "Businesses using a subscription digital team save an average of 40% versus hiring in-house.",
  "Consistent execution beats sporadic bursts of effort for long-term growth.",
  "Small, senior teams often outperform larger, junior-heavy agencies.",
];

const CATEGORY_ICON = { SEO: Search, Web: Globe, Ads: Megaphone, "IT Support": ShieldCheck, Strategy: Target, Insights: Sparkles };

// Left rail, below the ToC: a simple icon-based category card rather than a
// cropped featured image - works for every post, including ones with no
// image at all, and stays visually consistent post to post.
function CategoryVisual({ category }) {
  const Icon = CATEGORY_ICON[category] || Sparkles;
  return <div className="panel flex flex-col items-center gap-2 p-5 text-center">
    <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon size={20} /></span>
    <div className="text-xs font-bold uppercase tracking-wider text-muted">Category</div>
    <div className="text-sm font-bold text-text">{category}</div>
  </div>;
}

function FunFactsCard({ category }) {
  const facts = CATEGORY_FACTS[category] || DEFAULT_FACTS;
  return <div className="panel p-5">
    <div className="flex items-center gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent"><Lightbulb size={16} /></span>
      <h4 className="font-bold text-text">Did you know?</h4>
    </div>
    <ul className="mt-4 space-y-3">
      {facts.map((fact, index) => <li className="flex gap-2.5 text-sm leading-6 text-muted" key={index}>
        <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
        {fact}
      </li>)}
    </ul>
  </div>;
}

function SidebarCta() {
  return <div className="panel p-5">
    <span className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-extrabold text-primary-foreground">E</span>
    <h4 className="mt-3 font-bold text-text">Ready to grow your business?</h4>
    <p className="mt-1.5 text-sm leading-6 text-muted">Let's build something great together.</p>
    <Button to="/signup" className="mt-4 w-full">Get Started</Button>
  </div>;
}

function TableOfContents({ headings, activeId }) {
  return <nav aria-label="Table of contents" className="text-sm">
    <div className="text-xs font-bold uppercase tracking-wider text-muted">On this page</div>
    <ul className="mt-3 space-y-1 border-l border-border">
      {headings.map((heading) => {
        const active = heading.id === activeId;
        return <li key={heading.id}>
          <a
            href={`#${heading.id}`}
            aria-current={active ? "true" : undefined}
            className={`-ml-px block border-l-2 py-1 pl-3 transition ${active ? "border-primary font-semibold text-primary" : "border-transparent text-muted hover:text-text"} ${heading.level >= 3 ? "pl-6 text-xs" : ""}`}
          >
            {heading.text}
          </a>
        </li>;
      })}
    </ul>
  </nav>;
}

export default function BlogPost() {
  const { slug } = useParams();
  const publishedPosts = usePublishedPosts();
  const post = publishedPosts.find((p) => p.slug === slug) || publishedPosts[0];
  const blocks = useMemo(() => parseContentBlocks(post?.content), [post?.content]);
  const headings = useMemo(() => blocks.filter((block) => block.type === "heading"), [blocks]);
  const headingIds = useMemo(() => headings.map((heading) => heading.id), [headings]);
  const activeHeadingId = useActiveHeading(headingIds);

  if (!post) return <NotFound />;

  const others = publishedPosts.filter((item) => `${item.source}-${item.slug}` !== `${post.source}-${post.slug}`);
  const related = [...others.filter((item) => item.category === post.category), ...others.filter((item) => item.category !== post.category)].slice(0, 3);

  return <article>
    <ReadingProgressBar />

    <header className="relative overflow-hidden bg-ink py-7 text-white sm:py-9">
      <div className="grid-mask absolute inset-0 opacity-70" />
      <div className="absolute right-[8%] top-10 size-72 rounded-full bg-blue-600/20 blur-[110px]" />
      <div className="container-shell relative max-w-4xl">
        <Link to="/insights" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300 transition hover:text-blue-200"><ArrowLeft size={15} /> Back to insights</Link>
        {/* mb-0 cancels the shared .eyebrow class's own baked-in mb-4 (used
            on ~10 other pages, so it can't change globally) - without it,
            the collapsed margin with the title's mt-2 below would stay
            pinned near 16px no matter how small mt-2 got. */}
        <div className="eyebrow mb-0 mt-2 border-blue-400/20 bg-blue-400/10 text-blue-200">{post.category}</div>
        <h1 className="mt-2 text-4xl font-extrabold leading-[1.1] tracking-[-.03em] sm:text-5xl lg:text-6xl">{post.title}</h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">{post.excerpt}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-400">
          <span className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg bg-primary text-xs font-extrabold text-primary-foreground">E</span>EkSaha Team</span>
          <span className="flex items-center gap-1.5"><Calendar size={14} />{formatPostDate(post.date)}</span>
          <span className="flex items-center gap-1.5"><Clock size={14} />{post.read} read</span>
        </div>
      </div>
    </header>

    {post.image && <div className="container-shell max-w-4xl pt-10">
      <img src={post.image} alt={post.title} loading="lazy" className="h-[260px] w-full rounded-2xl object-cover shadow-lg sm:h-[380px]" />
    </div>}

    <div className="container-shell py-14 sm:py-16">
      {/* Both <aside> elements are always real grid children - only their
          inner content (e.g. the ToC) is conditional - so the 3-column
          layout can't collapse for posts with no headings, the exact bug
          from two redesigns ago. Each rail's contents share one sticky
          wrapper so they scroll and stick together as a single unit rather
          than overlapping if stuck independently. */}
      <div className="lg:grid lg:grid-cols-[240px_minmax(0,760px)_240px] lg:gap-10 xl:gap-14">
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-4">
            {headings.length > 1 && <TableOfContents headings={headings} activeId={activeHeadingId} />}
            <CategoryVisual category={post.category} />
          </div>
        </aside>

        <div className="mx-auto w-full max-w-[760px] text-[18px] leading-[1.8] text-slate-600 dark:text-slate-300">
          {blocks.map((block, index) => <ContentBlock block={block} key={index} />)}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-4">
            <FunFactsCard category={post.category} />
            <SidebarCta />
          </div>
        </aside>
      </div>

      {related.length > 0 && <div className="mx-auto mt-16 max-w-5xl">
        <h3 className="text-xl font-extrabold text-text">Related articles</h3>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {related.map((item, index) => <Link to={`/insights/${item.slug}`} className="panel group overflow-hidden" key={`${item.source}-${item.slug}`}>
            {item.image ? <img src={item.image} alt={item.title} loading="lazy" className="h-36 w-full object-cover" /> : <div className={`h-36 bg-gradient-to-br ${services[index % services.length].accent}`} />}
            <div className="p-5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-electric">{item.category}</div>
              <h4 className="mt-2 text-base font-bold leading-6 text-text group-hover:text-electric">{item.title}</h4>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{item.excerpt}</p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted"><Clock size={12} />{item.read}</div>
            </div>
          </Link>)}
        </div>
      </div>}

      <div className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-accent p-10 text-center text-primary-foreground sm:p-14">
        <h3 className="text-2xl font-extrabold sm:text-3xl">Ready to grow your business?</h3>
        <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/85 sm:text-base">Get started with EkSaha and put SEO, web, advertising and IT support on autopilot.</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button to="/pricing" variant="secondary" className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">Get started <ArrowRight size={16} /></Button>
          <Button to="/contact" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">Talk to us</Button>
        </div>
      </div>
    </div>
  </article>;
}
