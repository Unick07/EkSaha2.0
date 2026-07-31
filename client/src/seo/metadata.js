import { createArticleStructuredData, createStaticStructuredData } from "./structuredData";
import { DEFAULT_SOCIAL_IMAGE, SITE_NAME, SITE_ORIGIN } from "./siteConfig";

export { DEFAULT_SOCIAL_IMAGE, SITE_NAME, SITE_ORIGIN };

const staticArticles = [
  {
    slug: "technical-seo-checklist",
    title: "The technical SEO checklist we use before every launch",
    excerpt: "A practical framework for shipping websites that search engines and humans can navigate.",
    date: "May 28, 2026",
  },
  {
    slug: "subscription-digital-team",
    title: "When a subscription digital team makes sense",
    excerpt: "How to compare an in-house hire, agency retainer, freelancers, and a subscription partner.",
    date: "May 15, 2026",
  },
  {
    slug: "saas-landing-page",
    title: "Seven signals your landing page is leaking demand",
    excerpt: "Small experience problems that quietly lower trust and conversion rates.",
    date: "April 30, 2026",
  },
];

const staticPages = {
  "/": {
    title: "EkSaha | On-Demand SEO, Web, Ads & IT Support",
    description: "Grow with one flexible digital team for SEO, web development, paid advertising and IT support—without adding full-time headcount.",
    image: "/social/home.png",
    imageAlt: "EkSaha SEO, web, advertising and IT support",
  },
  "/services/seo": {
    title: "SEO Services for Growing Businesses | EkSaha",
    description: "Build sustainable organic growth with technical SEO, content strategy, local SEO and clear monthly reporting from EkSaha specialists.",
    image: "/social/services-seo.png",
    imageAlt: "EkSaha SEO services",
  },
  "/services/web": {
    title: "Web Design & Development Services | EkSaha",
    description: "Launch a fast, conversion-focused website with experienced UX, React development, hosting, security and ongoing maintenance support.",
    image: "/social/services-web.png",
    imageAlt: "EkSaha web design and development services",
  },
  "/services/ads": {
    title: "Digital Advertising Management | EkSaha",
    description: "Reach high-intent customers with carefully managed Google and Meta campaigns, conversion tracking, creative testing and transparent reporting.",
    image: "/social/services-ads.png",
    imageAlt: "EkSaha digital advertising management",
  },
  "/services/it-support": {
    title: "Managed IT Support for Small Businesses | EkSaha",
    description: "Keep your team productive with responsive help desk support, proactive device monitoring, cloud administration and practical security guidance.",
    image: "/social/services-it-support.png",
    imageAlt: "EkSaha managed IT support",
  },
  "/pricing": {
    title: "Flexible Digital Team Pricing | EkSaha",
    description: "Compare flexible monthly plans for SEO, web, digital advertising and IT support. Choose the expertise you need and change it as you grow.",
    image: "/social/pricing.png",
    imageAlt: "EkSaha flexible digital team pricing",
  },
  "/about": {
    title: "About EkSaha | A Senior Digital Team on Demand",
    description: "Meet the team helping ambitious businesses access experienced SEO, web, advertising and IT specialists through one clear subscription.",
    image: "/social/about.png",
    imageAlt: "About the EkSaha digital team",
  },
  "/insights": {
    title: "Digital Growth Insights & Practical Guides | EkSaha",
    description: "Read practical guides on technical SEO, websites, digital advertising, IT operations and building a more effective digital team.",
    image: "/social/insights.png",
    imageAlt: "EkSaha digital growth insights",
  },
  "/contact": {
    title: "Contact EkSaha | Talk to a Digital Specialist",
    description: "Tell EkSaha what you want to move forward. Get a clear recommendation for SEO, web development, advertising or IT support.",
    image: "/social/contact.png",
    imageAlt: "Contact an EkSaha digital specialist",
  },
  "/privacy": {
    title: "Privacy Policy | EkSaha",
    description: "Learn how EkSaha collects, uses, stores and shares personal information across its website, client portal and digital services.",
    image: "/social/home.png",
    imageAlt: "EkSaha privacy policy",
  },
  "/terms": {
    title: "Terms of Service | EkSaha",
    description: "Read the terms that apply when accessing EkSaha's website, client portal, SEO, web, advertising and technical support services.",
    image: "/social/home.png",
    imageAlt: "EkSaha terms of service",
  },
};

function normalizePath(pathname) {
  if (!pathname || pathname === "/") return "/";
  return `/${pathname.split("/").filter(Boolean).join("/")}`;
}

function absoluteUrl(value, origin = SITE_ORIGIN) {
  try {
    return new URL(value || DEFAULT_SOCIAL_IMAGE, `${origin}/`).href;
  } catch {
    return DEFAULT_SOCIAL_IMAGE;
  }
}

function normalizeSeoDate(value) {
  if (!value) return undefined;
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  if (raw.includes("T")) return parsed.toISOString();
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function completeSeo(pathname, values, origin = SITE_ORIGIN) {
  const path = normalizePath(pathname);
  return {
    ...values,
    siteName: SITE_NAME,
    type: values.type || "website",
    robots: values.robots || "index, follow",
    image: absoluteUrl(values.image, origin),
    imageAlt: values.imageAlt || `${SITE_NAME} on-demand digital team`,
    canonical: new URL(path, `${origin}/`).href,
  };
}

export function createArticleSeo(post, origin = SITE_ORIGIN) {
  if (!post?.slug || !post?.title) return null;
  const isStaticArticle = staticArticles.some((item) => item.slug === post.slug);
  const seo = completeSeo(`/insights/${post.slug}`, {
    type: "article",
    title: `${post.title} | ${SITE_NAME}`,
    description: post.excerpt || `Read ${post.title}, a practical guide from the EkSaha team.`,
    image: post.image || (isStaticArticle ? `/social/insight-${post.slug}.png` : DEFAULT_SOCIAL_IMAGE),
    imageAlt: post.image ? post.title : `${post.title} — ${SITE_NAME}`,
    publishedTime: normalizeSeoDate(post.createdAt || post.date),
    modifiedTime: normalizeSeoDate(post.updatedAt || post.updated || post.createdAt || post.date),
  }, origin);
  return {
    ...seo,
    structuredData: createArticleStructuredData(post, seo),
  };
}

export function createNotFoundSeo(origin = SITE_ORIGIN) {
  return completeSeo("/404", {
    title: `Page Not Found | ${SITE_NAME}`,
    description: "The requested EkSaha page could not be found.",
    robots: "noindex, nofollow",
  }, origin);
}

export const PRIVATE_APP_SEO = completeSeo("/login", {
  title: `Secure Client Portal | ${SITE_NAME}`,
  description: "Sign in to the secure EkSaha client portal.",
  robots: "noindex, nofollow",
});

export function isPrivateAppPath(pathname) {
  const path = normalizePath(pathname);
  return [
    /^\/(?:login|signup|forgot-password|verify-email)$/,
    /^\/auth(?:\/|$)/,
    /^\/(?:reset-password|password-reset)(?:\/|$)/,
    /^\/(?:dashboard|admin|support|billing|account)(?:\/|$)/,
  ].some((pattern) => pattern.test(path));
}

export function getSeoForPath(pathname, origin = SITE_ORIGIN) {
  const path = normalizePath(pathname);
  if (staticPages[path]) {
    const seo = completeSeo(path, staticPages[path], origin);
    return {
      ...seo,
      structuredData: createStaticStructuredData(path, seo),
    };
  }
  if (isPrivateAppPath(path)) return completeSeo("/login", PRIVATE_APP_SEO, origin);

  const insightSlug = path.match(/^\/insights\/([a-z0-9]+(?:-[a-z0-9]+)*)$/)?.[1];
  if (insightSlug) {
    const post = staticArticles.find((item) => item.slug === insightSlug);
    return post ? createArticleSeo(post, origin) : null;
  }

  return null;
}

export const PRERENDER_ROUTES = [
  ...Object.keys(staticPages),
  ...staticArticles.map((post) => `/insights/${post.slug}`),
];
