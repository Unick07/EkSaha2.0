import { all } from "../lib/db.js";

const SITE_URL = "https://eksaha.com";

// Services and the three seed blog posts are compiled into the client bundle
// from client/src/data/siteData.js, not stored in D1 - the Worker has no way
// to query them, so the slugs are mirrored here. Both lists rarely change,
// and adding either one requires a code deploy anyway (same as changing the
// page itself), so keeping this list in sync by hand is a fair trade for not
// needing a second, dynamic source of truth for content that's static in
// the first place.
const STATIC_SERVICE_SLUGS = ["seo", "web", "ads", "it-support"];
const STATIC_POST_SLUGS = ["technical-seo-checklist", "subscription-digital-team", "saas-landing-page"];

const STATIC_PAGES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/pricing", changefreq: "weekly", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/insights", changefreq: "daily", priority: "0.8" },
];

function urlEntry(loc, { lastmod, changefreq, priority } = {}) {
  const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : "";
  const changefreqTag = changefreq ? `<changefreq>${changefreq}</changefreq>` : "";
  const priorityTag = priority ? `<priority>${priority}</priority>` : "";
  return `<url><loc>${loc}</loc>${lastmodTag}${changefreqTag}${priorityTag}</url>`;
}

// Blog posts are the one piece of public content that's genuinely dynamic
// (published through the admin UI with no build/deploy attached), so they're
// the only part of the sitemap read from D1 on every request rather than
// baked in at build time - a post published five minutes ago is already
// here, not stuck waiting for the next deploy.
export async function handleSitemap(env) {
  const entries = [
    ...STATIC_PAGES.map((page) => urlEntry(`${SITE_URL}${page.path}`, page)),
    ...STATIC_SERVICE_SLUGS.map((slug) => urlEntry(`${SITE_URL}/services/${slug}`, { changefreq: "monthly", priority: "0.8" })),
    ...STATIC_POST_SLUGS.map((slug) => urlEntry(`${SITE_URL}/insights/${slug}`, { changefreq: "monthly", priority: "0.5" })),
  ];

  try {
    const posts = await all(env.DB, "SELECT slug, updated_at FROM blog_posts WHERE published = 1");
    for (const post of posts) {
      entries.push(urlEntry(`${SITE_URL}/insights/${post.slug}`, {
        lastmod: post.updated_at ? post.updated_at.slice(0, 10) : undefined,
        changefreq: "monthly",
        priority: "0.5",
      }));
    }
  } catch (caught) {
    // A D1 hiccup should degrade to "sitemap without DB posts", not a 500 -
    // the static pages/services/seed posts are still worth serving.
    console.error("Could not load blog posts for sitemap", caught);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
