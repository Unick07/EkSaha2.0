import { BarChart3, Braces, Headphones, Search, ShieldCheck, Sparkles, Target, Zap } from "lucide-react";

export const services = [
  {
    slug: "seo",
    icon: Search,
    title: "SEO that compounds",
    short: "Technical, content and authority systems that turn search into a reliable growth channel.",
    accent: "from-brand-navy to-brand-teal",
    metric: "Full-funnel",
    metricLabel: "technical, content and authority SEO",
    features: ["Technical audits", "Content strategy", "Local SEO", "Monthly reporting"],
    tools: ["Ahrefs", "Semrush", "Search Console", "Screaming Frog"],
  },
  {
    slug: "web",
    icon: Braces,
    title: "Web services",
    short: "Conversion-led websites that load quickly, scale cleanly and stay maintained.",
    accent: "from-teal-700 to-brand-teal",
    metric: "Performance-led",
    metricLabel: "fast, accessible and maintainable websites",
    features: ["UX & UI design", "React development", "Hosting & security", "Ongoing maintenance"],
    tools: ["React", "Next.js", "Figma", "Vercel"],
  },
  {
    slug: "ads",
    icon: Target,
    title: "Digital advertising",
    short: "High-intent campaigns with transparent reporting and relentless experimentation.",
    accent: "from-brand-navy to-teal-500",
    metric: "Measured",
    metricLabel: "tracking-led campaign improvement",
    features: ["Google Ads", "Meta campaigns", "Creative testing", "Conversion tracking"],
    tools: ["Google Ads", "Meta", "GA4", "Looker Studio"],
  },
  {
    slug: "it-support",
    icon: Headphones,
    title: "IT support",
    short: "Responsive help desk and proactive monitoring without the cost of an in-house team.",
    accent: "from-teal-600 to-teal-300",
    metric: "Responsive",
    metricLabel: "clear support and escalation",
    features: ["Unlimited help desk", "Device monitoring", "Cloud administration", "Security guidance"],
    tools: ["Microsoft 365", "Google Workspace", "JumpCloud", "Cloudflare"],
  },
];

export const plans = [
  {
    name: "Starter",
    monthly: 599,
    description: "A reliable specialist lane for small teams with one clear priority.",
    cta: "Build my foundation",
    features: ["1 core service", "Up to 15 requests / month", "Monthly strategy call", "48-hour response target", "Performance dashboard", "Client success support"],
  },
  {
    name: "Growth",
    monthly: 1299,
    description: "The cross-functional growth team for organizations building momentum.",
    popular: true,
    cta: "Start scaling",
    features: ["Any 3 core services", "Unlimited request queue", "Biweekly strategy calls", "24-hour response target", "Advanced analytics", "Dedicated strategist"],
  },
  {
    name: "Enterprise",
    monthly: 2499,
    description: "Embedded digital and IT capability for complex, scaling operations.",
    cta: "Get enterprise support",
    features: ["All 4 services included", "Unlimited priority queue", "Weekly strategy calls", "4-hour response target", "Custom executive reporting", "Dedicated account team"],
  },
];

export const testimonials = [
  { quote: "EkSaha gave us the capabilities of a full digital team without the hiring cycle. Pipeline doubled in one quarter.", name: "Maya Chen", role: "Co-founder, Northstar" },
  { quote: "The clarity is rare. We always know what is being worked on, why it matters, and how it is performing.", name: "Ethan Brooks", role: "CEO, Alder & Co." },
  { quote: "Our site is faster, support tickets are down, and qualified organic traffic is finally moving in the right direction.", name: "Priya Shah", role: "COO, Layerpath" },
];

export const trustedCompanies = [
  { name: "Algories Technology", sector: "Technology Partner", logo: "/logos/algories-technology-transparent.png",  showName: true },
  { name: "Dvitix", sector: "Collaboration Partner", logo: null, showName: true },
];

export const features = [
  { icon: Zap, title: "Start in days", copy: "Skip months of recruiting. Your senior team is assembled around your priorities." },
  { icon: ShieldCheck, title: "Predictable spend", copy: "One transparent subscription replaces scattered retainers and surprise invoices." },
  { icon: BarChart3, title: "Measurable work", copy: "A shared dashboard connects every deliverable to a business outcome." },
  { icon: Sparkles, title: "Built to adapt", copy: "Shift capacity between SEO, web, ads and IT as your needs change." },
];
