import { handleAuth } from "./routes/auth.js";
import { handlePosts } from "./routes/posts.js";
import { handlePlans } from "./routes/plans.js";
import { handleSubscriptions } from "./routes/subscriptions.js";
import { handleTickets } from "./routes/tickets.js";
import { handleInvoices } from "./routes/invoices.js";
import { handleAdmin } from "./routes/admin.js";
import { handleUsers } from "./routes/users.js";
import { handleNotifications } from "./routes/notifications.js";
import { all, first, generateId, intBool, normalizePost, nowIso, run } from "./lib/db.js";
import { corsHeaders, error, json, readJson } from "./lib/http.js";

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
    (req, e) => handleUsers(req, e, path),
    (req, e) => handleNotifications(req, e, path),
    (req, e) => handlePlans(req, e, path),
    (req, e) => handlePosts(req, e, path),
    (req, e) => handleSubscriptions(req, e, path),
    (req, e) => handleTickets(req, e, path),
    (req, e) => handleInvoices(req, e, path),
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

async function serveAsset(request, env) {
  if (!env.ASSETS) {
    console.error("Static assets binding is not available", { url: request.url });
    return new Response("Static assets binding is not available.", { status: 404 });
  }

  const response = await env.ASSETS.fetch(request);
  if (response.status !== 404) return response;

  const url = new URL(request.url);
  url.pathname = "/index.html";
  url.search = "";
  return env.ASSETS.fetch(new Request(url, request));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/") || url.pathname === "/api") {
      return routeApi(request, env);
    }

    if (url.pathname === "/health") {
      return json({ status: "ok", database: env.DB ? "connected" : "missing" }, {}, env, request);
    }

    return serveAsset(request, env);
  },
};
