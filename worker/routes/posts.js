import { requireRole } from "../lib/auth.js";
import { all, first, generateId, intBool, normalizePost, nowIso, run, stringifyJson } from "../lib/db.js";
import { error, json, readJson } from "../lib/http.js";

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

function publishedFrom(body) {
  if (body.published != null) return intBool(body.published);
  return intBool(body.status === "Published");
}

export async function handlePosts(request, env, path) {
  if (request.method === "GET" && path === "/posts") {
    const url = new URL(request.url);
    const publishedOnly = url.searchParams.get("published") === "true";
    const rows = await all(env.DB, `SELECT * FROM blog_posts ${publishedOnly ? "WHERE published = 1" : ""} ORDER BY created_at DESC`);
    return json(rows.map(normalizePost), {}, env, request);
  }

  const id = path.match(/^\/posts\/([^/]+)$/)?.[1];

  if (request.method === "GET" && id) {
    const post = await first(env.DB, "SELECT * FROM blog_posts WHERE id = ? OR slug = ?", [id, id]);
    return post ? json(normalizePost(post), {}, env, request) : error("Post not found", 404, env, request);
  }

  if (request.method === "POST" && path === "/posts") {
    const user = await requireRole(request, env, ["admin", "support"]);
    const body = await readJson(request);
    if (!body.title || !body.content) return error("Title and content are required", 400, env, request);
    const timestamp = nowIso();
    const postId = generateId();
    await run(env.DB, `
      INSERT INTO blog_posts (id, title, slug, excerpt, content, category, tags, published, author_id, image_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      postId,
      body.title,
      slugify(body.slug || body.title),
      body.excerpt || "",
      body.content,
      body.category || "Insights",
      stringifyJson(body.tags),
      publishedFrom(body),
      user.id,
      body.image || null,
      timestamp,
      timestamp,
    ]);
    return json(normalizePost(await first(env.DB, "SELECT * FROM blog_posts WHERE id = ?", [postId])), { status: 201 }, env, request);
  }

  if (request.method === "PATCH" && id) {
    await requireRole(request, env, ["admin", "support"]);
    const existing = await first(env.DB, "SELECT * FROM blog_posts WHERE id = ?", [id]);
    if (!existing) return error("Post not found", 404, env, request);
    const body = await readJson(request);
    await run(env.DB, `
      UPDATE blog_posts
      SET title = ?, slug = ?, excerpt = ?, content = ?, category = ?, tags = ?, published = ?, image_url = ?, updated_at = ?
      WHERE id = ?
    `, [
      body.title ?? existing.title,
      body.slug ? slugify(body.slug) : existing.slug,
      body.excerpt ?? existing.excerpt,
      body.content ?? existing.content,
      body.category ?? existing.category,
      body.tags ? stringifyJson(body.tags) : existing.tags,
      body.published != null || body.status ? publishedFrom(body) : existing.published,
      body.image !== undefined ? (body.image || null) : existing.image_url,
      nowIso(),
      id,
    ]);
    return json(normalizePost(await first(env.DB, "SELECT * FROM blog_posts WHERE id = ?", [id])), {}, env, request);
  }

  if (request.method === "DELETE" && id) {
    await requireRole(request, env, ["admin", "support"]);
    await run(env.DB, "DELETE FROM blog_posts WHERE id = ?", [id]);
    return json({ ok: true }, {}, env, request);
  }

  return null;
}
