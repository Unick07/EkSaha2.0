import { handleAuth } from "./routes/auth.js";
import { handlePosts } from "./routes/posts.js";
import { handlePlans } from "./routes/plans.js";
import { handleSubscriptions } from "./routes/subscriptions.js";
import { handleTickets } from "./routes/tickets.js";
import { handleInvoices } from "./routes/invoices.js";
import { handleAdmin } from "./routes/admin.js";
import { handleServices } from "./routes/services.js";
import { handleUsers } from "./routes/users.js";
import { handleNotifications } from "./routes/notifications.js";
import { handleImages } from "./routes/images.js";
import { all, first, generateId, intBool, normalizePost, nowIso, run } from "./lib/db.js";
import { corsHeaders, error, json, readJson } from "./lib/http.js";
import { createArticleSeo, injectSeoAndFallback, renderArticleFallback } from "./lib/seo.js";

async function routeApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, "") || "/";

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(env, request) });
  }

  if (request.method === "GET" && path === "/health") {
    return json({ status: "ok", database: env.DB ? "connected" : "missing" }, {}, env, request);
  }

  const handlers = [
    (req, e) => handleAuth(req, e, path.replace(/^\/auth/, "")),
    (req, e) => handleAdmin(req, e, path),
    (req, e) => handleServices(req, e, path),
    (req, e) => handleUsers(req, e, path),
    (req, e) => handleNotifications(req, e, path),
    (req, e) => handlePlans(req, e, path),
    (req, e) => handlePosts(req, e, path),
    (req, e) => handleSubscriptions(req, e, path),
    (req, e) => handleTickets(req, e, path),
    (req, e) => handleInvoices(req, e, path),
    (req, e) => handleImages(req, e, path),
    (req, e) => handleDemo(req, e, path),
  ];

  try {
    for (const handler of handlers) {
      const response = await handler(request, env);
      if (response) return response;
    }
    return error("Not found", 404, env, request);
  } catch (caught) {
    console.error(caught);
    return error(caught.message || "Internal server error", caught.status || 500, env, request);
  }
}

async function handleDemo(request, env, path) {
  const demoPath = path.replace(/^\/demo/, "");
  if (path.startsWith("/demo/posts")) {
    return handleDemoPosts(request, env, demoPath);
  }
  return null;
}

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

const PUBLIC_ROUTES = [
  "/",
  "/services/seo",
  "/services/web",
  "/services/ads",
  "/services/it-support",
  "/pricing",
  "/about",
  "/insights",
  "/contact",
  "/privacy",
  "/terms",
];

const STATIC_INSIGHTS = [
  { slug: "technical-seo-checklist", lastmod: "2026-05-28" },
  { slug: "subscription-digital-team", lastmod: "2026-05-15" },
  { slug: "saas-landing-page", lastmod: "2026-04-30" },
];

function publicOrigin(request, env) {
  const fallback = new URL(request.url).origin;
  try {
    return new URL(env.CLIENT_URL || fallback).origin;
  } catch {
    return fallback;
  }
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function sitemapDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function validPublicSlug(value) {
  const slug = String(value || "").trim();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null;
}

async function publishedInsightUrls(env) {
  if (!env.DB) throw new Error("D1 binding is unavailable");
  return all(
    env.DB,
    `SELECT slug, COALESCE(updated_at, created_at) AS lastmod
     FROM blog_posts
     WHERE published = 1
     ORDER BY COALESCE(updated_at, created_at) DESC`,
  );
}

async function serveSitemap(request, env) {
  const origin = publicOrigin(request, env);
  const urls = new Map(PUBLIC_ROUTES.map((path) => [path, null]));

  for (const post of STATIC_INSIGHTS) {
    urls.set(`/insights/${post.slug}`, post.lastmod);
  }

  let publishedPosts;
  try {
    publishedPosts = await publishedInsightUrls(env);
  } catch (caught) {
    console.error(JSON.stringify({
      message: "Could not generate sitemap",
      error: caught instanceof Error ? caught.message : String(caught),
    }));
    return new Response("Sitemap temporarily unavailable.", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8",
        "Cache-Control": "no-store",
        "Retry-After": "60",
        "X-Robots-Tag": "noindex",
      },
    });
  }

  for (const post of publishedPosts) {
    const slug = validPublicSlug(post.slug);
    if (slug) urls.set(`/insights/${slug}`, sitemapDate(post.lastmod));
  }

  const entries = [...urls].map(([path, lastmod]) => {
    const location = escapeXml(new URL(path, `${origin}/`).href);
    const modified = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : "";
    return `  <url>\n    <loc>${location}</loc>${modified}\n  </url>`;
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");

  return new Response(request.method === "HEAD" ? null : xml, {
    headers: {
      "Content-Type": "application/xml; charset=UTF-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}

function serveRobots(request, env) {
  const sitemapUrl = new URL("/sitemap.xml", `${publicOrigin(request, env)}/`).href;
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "",
    "# Private app pages remain crawlable so search engines can read their noindex directives.",
    `Sitemap: ${sitemapUrl}`,
    "",
  ].join("\n");

  return new Response(request.method === "HEAD" ? null : body, {
    headers: {
      "Content-Type": "text/plain; charset=UTF-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

async function handleDemoPosts(request, env, path) {
  if (request.method === "GET" && path === "/posts") {
    const url = new URL(request.url);
    const publishedOnly = url.searchParams.get("published") === "true";
    const rows = await all(env.DB, `SELECT * FROM blog_posts ${publishedOnly ? "WHERE published = 1" : ""} ORDER BY created_at DESC`);
    return json(rows.map(normalizePost), {}, env, request);
  }

  if (request.method === "POST" && path === "/posts") {
    const body = await readJson(request);
    const id = generateId();
    const timestamp = nowIso();
    await run(env.DB, `
      INSERT INTO blog_posts (id, title, slug, excerpt, content, category, tags, published, author_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, body.title || "Untitled post", slugify(body.slug || body.title || id), body.excerpt || "", body.content || body.excerpt || "", body.category || "Insights", "[]", intBool(body.status === "Published"), null, timestamp, timestamp]);
    return json(normalizePost(await first(env.DB, "SELECT * FROM blog_posts WHERE id = ?", [id])), { status: 201 }, env, request);
  }

  const id = path.match(/^\/posts\/([^/]+)$/)?.[1];
  if (request.method === "PATCH" && id) {
    const existing = await first(env.DB, "SELECT * FROM blog_posts WHERE id = ?", [id]);
    if (!existing) return error("Post not found", 404, env, request);
    const body = await readJson(request);
    await run(env.DB, `
      UPDATE blog_posts SET title = ?, slug = ?, excerpt = ?, content = ?, category = ?, published = ?, updated_at = ? WHERE id = ?
    `, [body.title ?? existing.title, body.slug ? slugify(body.slug) : existing.slug, body.excerpt ?? existing.excerpt, body.content ?? existing.content, body.category ?? existing.category, body.status ? intBool(body.status === "Published") : existing.published, nowIso(), id]);
    return json(normalizePost(await first(env.DB, "SELECT * FROM blog_posts WHERE id = ?", [id])), {}, env, request);
  }

  if (request.method === "DELETE" && id) {
    await run(env.DB, "DELETE FROM blog_posts WHERE id = ?", [id]);
    return json({ ok: true }, {}, env, request);
  }

  return null;
}

function assetRequest(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = "";
  return new Request(url, request);
}

function withResponseHeaders(response, additionalHeaders, status = response.status) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(additionalHeaders)) headers.set(name, value);
  return new Response(response.body, { status, statusText: response.statusText, headers });
}

function legacyBlogRedirect(url) {
  if (url.pathname === "/blog") return "/insights";
  const match = url.pathname.match(/^\/blog\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
  return match ? `/insights/${match[1]}` : null;
}

function isPrivateAppRoute(pathname) {
  return [
    /^\/(?:login|signup|forgot-password|verify-email)$/,
    /^\/auth(?:\/|$)/,
    /^\/(?:reset-password|password-reset)(?:\/|$)/,
    /^\/(?:dashboard|admin|support|billing|account)(?:\/|$)/,
  ].some((pattern) => pattern.test(pathname));
}

async function servePrivateApp(request, env) {
  const response = await env.ASSETS.fetch(assetRequest(request, "/__app"));
  return withResponseHeaders(response, {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
  });
}

async function serveNotFound(request, env, response = null) {
  const notFoundResponse = response || await env.ASSETS.fetch(assetRequest(request, "/404"));
  return withResponseHeaders(notFoundResponse, {
    "Cache-Control": "public, max-age=60",
    "X-Robots-Tag": "noindex, nofollow",
  }, 404);
}

async function publishedInsight(env, slug) {
  if (!env.DB) return null;
  return first(
    env.DB,
    "SELECT slug, title, excerpt, content, category, image_url, created_at, updated_at FROM blog_posts WHERE slug = ? AND published = 1 LIMIT 1",
    [slug],
  );
}

async function serveDynamicInsight(request, env, slug) {
  let post;
  try {
    post = await publishedInsight(env, slug);
  } catch (caught) {
    console.error(JSON.stringify({
      message: "Could not resolve published insight",
      error: caught instanceof Error ? caught.message : String(caught),
      slug,
    }));
    return new Response("The article is temporarily unavailable.", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8",
        "Retry-After": "60",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  if (!post) return serveNotFound(request, env);

  const shell = await env.ASSETS.fetch(assetRequest(request, "/__app"));
  if (!shell.ok) {
    console.error(JSON.stringify({ message: "Prerender shell is unavailable", status: shell.status }));
    return new Response("The article is temporarily unavailable.", { status: 503 });
  }

  // The shell is a small, bounded build artifact. Buffering it lets the
  // Worker replace the complete SEO marker atomically for database articles.
  const document = await shell.text();
  const seo = createArticleSeo(post, publicOrigin(request, env));
  const html = injectSeoAndFallback(document, seo, renderArticleFallback(post));
  const headers = new Headers(shell.headers);
  headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
  headers.set("Content-Type", "text/html; charset=UTF-8");
  headers.delete("Content-Length");
  return new Response(request.method === "HEAD" ? null : html, { status: 200, headers });
}

async function serveAsset(request, env) {
  if (!env.ASSETS) {
    console.error("Static assets binding is not available", { url: request.url });
    return new Response("Static assets binding is not available.", { status: 404 });
  }

  const response = await env.ASSETS.fetch(request);
  return response.status === 404 ? serveNotFound(request, env, response) : response;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if ((request.method === "GET" || request.method === "HEAD") && url.pathname === "/sitemap.xml") {
      return serveSitemap(request, env);
    }

    if ((request.method === "GET" || request.method === "HEAD") && url.pathname === "/robots.txt") {
      return serveRobots(request, env);
    }

    if (url.pathname.startsWith("/api/") || url.pathname === "/api") {
      return routeApi(request, env);
    }

    if (url.pathname === "/health") {
      return json({ status: "ok", database: env.DB ? "connected" : "missing" }, {}, env, request);
    }

    if (request.method === "GET" || request.method === "HEAD") {
      const redirectPath = legacyBlogRedirect(url);
      if (redirectPath) {
        url.pathname = redirectPath;
        return Response.redirect(url.href, 301);
      }

      if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
        url.pathname = url.pathname.replace(/\/+$/, "");
        return Response.redirect(url.href, 308);
      }

      if (url.pathname === "/404" || url.pathname === "/__app") {
        return serveNotFound(request, env);
      }

      if (isPrivateAppRoute(url.pathname)) {
        return servePrivateApp(request, env);
      }

      const insightSlug = url.pathname.match(/^\/insights\/([a-z0-9]+(?:-[a-z0-9]+)*)$/)?.[1];
      if (insightSlug) {
        const staticArticle = await env.ASSETS.fetch(request);
        if (staticArticle.status !== 404) return staticArticle;
        return serveDynamicInsight(request, env, insightSlug);
      }
    }

    return serveAsset(request, env);
  },
};
