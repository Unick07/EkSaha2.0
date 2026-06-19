import { BarChart3, Braces, Headphones, Search, ShieldCheck, Sparkles, Target, Zap } from "lucide-react";

export const services = [
  {
    slug: "seo",
    icon: Search,
    title: "SEO that compounds",
    short: "Technical, content and authority systems that turn search into a reliable growth channel.",
    accent: "from-blue-500 to-cyan-400",
    metric: "+186%",
    metricLabel: "average organic growth",
    features: ["Technical audits", "Content strategy", "Local SEO", "Monthly reporting"],
    tools: ["Ahrefs", "Semrush", "Search Console", "Screaming Frog"],
  },
  {
    slug: "web",
    icon: Braces,
    title: "Web services",
    short: "Conversion-led websites that load quickly, scale cleanly and stay maintained.",
    accent: "from-violet-500 to-blue-500",
    metric: "1.2s",
    metricLabel: "average load time",
    features: ["UX & UI design", "React development", "Hosting & security", "Ongoing maintenance"],
    tools: ["React", "Next.js", "Figma", "Vercel"],
  },
  {
    slug: "ads",
    icon: Target,
    title: "Digital advertising",
    short: "High-intent campaigns with transparent reporting and relentless experimentation.",
    accent: "from-orange-400 to-pink-500",
    metric: "3.8x",
    metricLabel: "average return on ad spend",
    features: ["Google Ads", "Meta campaigns", "Creative testing", "Conversion tracking"],
    tools: ["Google Ads", "Meta", "GA4", "Looker Studio"],
  },
  {
    slug: "it-support",
    icon: Headphones,
    title: "IT support",
    short: "Responsive help desk and proactive monitoring without the cost of an in-house team.",
    accent: "from-emerald-400 to-cyan-500",
    metric: "12m",
    metricLabel: "median first response",
    features: ["Unlimited help desk", "Device monitoring", "Cloud administration", "Security guidance"],
    tools: ["Microsoft 365", "Google Workspace", "JumpCloud", "Cloudflare"],
  },
];

export const plans = [
  {
    name: "Starter",
    monthly: 499,
    description: "A focused digital foundation for early-stage teams.",
    features: ["1 core service", "Up to 10 requests / month", "Monthly strategy call", "48-hour response", "Performance dashboard"],
  },
  {
    name: "Growth",
    monthly: 999,
    description: "A flexible growth team for businesses gaining traction.",
    popular: true,
    features: ["3 core services", "Unlimited requests", "Biweekly strategy calls", "24-hour response", "Advanced analytics", "Dedicated strategist"],
  },
  {
    name: "Enterprise",
    monthly: 1999,
    description: "Embedded digital and IT support for scaling operations.",
    features: ["All services included", "Unlimited priority requests", "Weekly strategy calls", "4-hour response", "Custom reporting", "Dedicated account team"],
  },
];

export const testimonials = [
  { quote: "EkSaha gave us the capabilities of a full digital team without the hiring cycle. Pipeline doubled in one quarter.", name: "Maya Chen", role: "Co-founder, Northstar" },
  { quote: "The clarity is rare. We always know what is being worked on, why it matters, and how it is performing.", name: "Ethan Brooks", role: "CEO, Alder & Co." },
  { quote: "Our site is faster, support tickets are down, and qualified organic traffic is finally moving in the right direction.", name: "Priya Shah", role: "COO, Layerpath" },
];

export const trustedCompanies = [
  { name: "Northstar", sector: "SaaS Growth", initials: "NS" },
  { name: "Alder & Co.", sector: "Retail Ops", initials: "AC" },
  { name: "Layerpath", sector: "Cloud Systems", initials: "LP" },
  { name: "Brightway", sector: "Paid Media", initials: "BW" },
  { name: "Modulo", sector: "Web Platforms", initials: "MD" },
  { name: "Orbitlane", sector: "IT Support", initials: "OL" },
  { name: "Stackline", sector: "Analytics", initials: "SL" },
  { name: "NovaWorks", sector: "SEO Systems", initials: "NW" },
];

export const posts = [
  { slug: "technical-seo-checklist", category: "SEO", title: "The technical SEO checklist we use before every launch", excerpt: "A practical framework for shipping websites that search engines and humans can navigate.", date: "May 28, 2026", read: "7 min" },
  { slug: "subscription-digital-team", category: "Strategy", title: "When a subscription digital team makes sense", excerpt: "How to compare an in-house hire, agency retainer, freelancers, and a subscription partner.", date: "May 15, 2026", read: "5 min" },
  { slug: "saas-landing-page", category: "Web", title: "Seven signals your landing page is leaking demand", excerpt: "Small experience problems that quietly lower trust and conversion rates.", date: "April 30, 2026", read: "6 min" },
];

export const features = [
  { icon: Zap, title: "Start in days", copy: "Skip months of recruiting. Your senior team is assembled around your priorities." },
  { icon: ShieldCheck, title: "Predictable spend", copy: "One transparent subscription replaces scattered retainers and surprise invoices." },
  { icon: BarChart3, title: "Measurable work", copy: "A shared dashboard connects every deliverable to a business outcome." },
  { icon: Sparkles, title: "Built to adapt", copy: "Shift capacity between SEO, web, ads and IT as your needs change." },
];
