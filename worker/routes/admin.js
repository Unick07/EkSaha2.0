import { hashPassword, requireRole } from "../lib/auth.js";
import { all, first, generateId, normalizeUser, nowIso, run } from "../lib/db.js";
import { error, json, readJson } from "../lib/http.js";

const TEAM_ROLES = ["admin", "support", "billing"];
const IMAGE_EXT_BY_TYPE = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function handleAdmin(request, env, path) {
  if (!path.startsWith("/admin")) return null;
  await requireRole(request, env, ["admin", "support", "billing"]);

  if (request.method === "GET" && path === "/admin/stats") {
    const [users, subscriptions, tickets, invoices, posts] = await Promise.all([
      first(env.DB, "SELECT COUNT(*) AS count FROM users"),
      first(env.DB, "SELECT COUNT(*) AS count FROM subscriptions"),
      first(env.DB, "SELECT COUNT(*) AS count FROM tickets WHERE status != 'resolved'"),
      first(env.DB, "SELECT COALESCE(SUM(amount), 0) AS total FROM invoices WHERE status = 'paid'"),
      first(env.DB, "SELECT COUNT(*) AS count FROM blog_posts WHERE published = 1"),
    ]);
    return json({
      users: users.count,
      subscriptions: subscriptions.count,
      openTickets: tickets.count,
      paidInvoiceTotal: invoices.total,
      publishedPosts: posts.count,
    }, {}, env, request);
  }

  if (request.method === "GET" && path === "/admin/users") {
    const roles = new URL(request.url).searchParams.get("roles");
    const roleList = roles ? roles.split(",").map((role) => role.trim().toLowerCase()).filter(Boolean) : null;
    const rows = await all(env.DB, `
      SELECT users.*, plans.name AS plan_name
      FROM users
      LEFT JOIN plans ON plans.id = users.plan_id
      ${roleList && roleList.length ? `WHERE users.role IN (${roleList.map(() => "?").join(",")})` : ""}
      ORDER BY users.created_at DESC
    `, roleList && roleList.length ? roleList : []);
    return json(rows.map(normalizeUser), {}, env, request);
  }

  if (request.method === "POST" && path === "/admin/team") {
    await requireRole(request, env, ["admin"]);
    const body = await readJson(request);
    const email = body.email?.toLowerCase()?.trim();
    if (!body.name || !email || !body.password || body.password.length < 8) {
      return error("Valid name, email and password (min 8 characters) are required", 400, env, request);
    }
    const role = (body.role || "").toLowerCase();
    if (!TEAM_ROLES.includes(role)) {
      return error(`Role must be one of: ${TEAM_ROLES.join(", ")}`, 400, env, request);
    }
    if (await first(env.DB, "SELECT id FROM users WHERE email = ?", [email])) {
      return error("Email already registered", 409, env, request);
    }
    const id = generateId();
    const timestamp = nowIso();
    await run(env.DB, `
      INSERT INTO users (id, name, email, password_hash, role, plan_id, stripe_customer_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, body.name.trim(), email, await hashPassword(body.password), role, null, null, timestamp, timestamp]);
    return json(normalizeUser(await first(env.DB, "SELECT * FROM users WHERE id = ?", [id])), { status: 201 }, env, request);
  }

  if (request.method === "POST" && path === "/admin/upload-image") {
    await requireRole(request, env, ["admin", "support"]);
    if (!env.BLOG_IMAGES) return error("Image storage is not configured", 500, env, request);

    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File)) return error("An image file is required", 400, env, request);

    // Extension is derived from the validated MIME type, not the client-
    // supplied filename, so a mislabeled file can't smuggle in a bad extension.
    const ext = IMAGE_EXT_BY_TYPE[file.type];
    if (!ext) return error("Images must be JPG, PNG, WEBP or GIF", 400, env, request);
    if (file.size > MAX_IMAGE_BYTES) return error("Images must be under 5MB", 400, env, request);

    const filename = `${Date.now()}-${generateId().slice(0, 8)}.${ext}`;
    await env.BLOG_IMAGES.put(filename, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
    const url = `${env.CLIENT_URL || "https://eksaha.com"}/api/images/${filename}`;
    return json({ url, filename }, { status: 201 }, env, request);
  }

  const roleChangeId = path.match(/^\/admin\/users\/([^/]+)\/role$/)?.[1];
  if (request.method === "PATCH" && roleChangeId) {
    const admin = await requireRole(request, env, ["admin"]);
    const body = await readJson(request);
    const role = (body.role || "").toLowerCase();
    if (!["user", ...TEAM_ROLES].includes(role)) {
      return error("Role must be one of: user, admin, support, billing", 400, env, request);
    }
    if (admin.id === roleChangeId && role !== admin.role) {
      return error("You cannot change your own role", 400, env, request);
    }
    const existing = await first(env.DB, "SELECT * FROM users WHERE id = ?", [roleChangeId]);
    if (!existing) return error("User not found", 404, env, request);
    await run(env.DB, "UPDATE users SET role = ?, updated_at = ? WHERE id = ?", [role, nowIso(), roleChangeId]);
    return json(normalizeUser(await first(env.DB, "SELECT * FROM users WHERE id = ?", [roleChangeId])), {}, env, request);
  }

  const assignId = path.match(/^\/admin\/users\/([^/]+)\/assign$/)?.[1];
  if (request.method === "PATCH" && assignId) {
    await requireRole(request, env, ["admin", "support"]);
    const existing = await first(env.DB, "SELECT * FROM users WHERE id = ?", [assignId]);
    if (!existing) return error("User not found", 404, env, request);
    const body = await readJson(request);
    const assignedTo = body.assignedTo || null;
    if (assignedTo) {
      const strategist = await first(env.DB, "SELECT * FROM users WHERE id = ?", [assignedTo]);
      if (!strategist || !["admin", "support"].includes(strategist.role)) {
        return error("Assigned team member must have an admin or support role", 400, env, request);
      }
    }
    await run(env.DB, "UPDATE users SET assigned_to = ?, updated_at = ? WHERE id = ?", [assignedTo, nowIso(), assignId]);
    return json(normalizeUser(await first(env.DB, "SELECT * FROM users WHERE id = ?", [assignId])), {}, env, request);
  }

  const userId = path.match(/^\/admin\/users\/([^/]+)$/)?.[1];
  if (request.method === "PATCH" && userId) {
    const admin = await requireRole(request, env, ["admin"]);
    if (admin.id === userId) {
      const body = await readJson(request);
      if (body.role && body.role !== admin.role) return error("You cannot change your own role", 400, env, request);
    }
    const existing = await first(env.DB, "SELECT * FROM users WHERE id = ?", [userId]);
    if (!existing) return error("User not found", 404, env, request);
    const body = await readJson(request);
    await run(env.DB, `
      UPDATE users SET name = ?, email = ?, role = ?, plan_id = ?, stripe_customer_id = ?, updated_at = ? WHERE id = ?
    `, [
      body.name ?? existing.name,
      body.email ? body.email.toLowerCase().trim() : existing.email,
      body.role ?? existing.role,
      body.planId ?? existing.plan_id,
      body.stripeCustomerId ?? existing.stripe_customer_id,
      nowIso(),
      userId,
    ]);
    return json(normalizeUser(await first(env.DB, "SELECT * FROM users WHERE id = ?", [userId])), {}, env, request);
  }

  if (request.method === "DELETE" && userId) {
    const admin = await requireRole(request, env, ["admin"]);
    if (admin.id === userId) {
      return error("You cannot delete your own account", 400, env, request);
    }
    const existing = await first(env.DB, "SELECT id FROM users WHERE id = ?", [userId]);
    if (!existing) return error("User not found", 404, env, request);

    // D1 doesn't reliably apply ON DELETE CASCADE, so every dependent row is
    // deleted explicitly rather than trusting the schema's cascade clauses.
    try {
      await run(env.DB, "PRAGMA foreign_keys = ON");
    } catch (caught) {
      console.error("Could not set PRAGMA foreign_keys", caught);
    }

    // References with no cascade at all — must be cleared or the final
    // DELETE FROM users fails with a FOREIGN KEY constraint error.
    await run(env.DB, "UPDATE tickets SET assigned_to = NULL WHERE assigned_to = ?", [userId]);
    await run(env.DB, "UPDATE users SET assigned_to = NULL WHERE assigned_to = ?", [userId]);
    await run(env.DB, "UPDATE blog_posts SET author_id = NULL WHERE author_id = ?", [userId]);

    await run(env.DB, "DELETE FROM refresh_tokens WHERE user_id = ?", [userId]);
    await run(env.DB, "DELETE FROM ticket_messages WHERE sender_id = ?", [userId]);
    // Also covers messages other people left on this user's own tickets —
    // ticket_messages.ticket_id does cascade in the schema, but nothing
    // here is left to a cascade actually firing.
    await run(env.DB, "DELETE FROM ticket_messages WHERE ticket_id IN (SELECT id FROM tickets WHERE user_id = ?)", [userId]);
    await run(env.DB, "DELETE FROM tickets WHERE user_id = ?", [userId]);
    await run(env.DB, "DELETE FROM subscriptions WHERE user_id = ?", [userId]);
    // invoice_items.invoice_id -> invoices.id has no cascade either, so the
    // line items have to go before their parent invoices do.
    await run(env.DB, "DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE user_id = ?)", [userId]);
    await run(env.DB, "DELETE FROM invoices WHERE user_id = ?", [userId]);
    await run(env.DB, "DELETE FROM verification_tokens WHERE user_id = ?", [userId]);
    await run(env.DB, "DELETE FROM users WHERE id = ?", [userId]);

    return json({ message: "User deleted successfully" }, {}, env, request);
  }

  if (request.method === "GET" && path === "/admin/subscriptions") {
    const rows = await all(env.DB, `
      SELECT subscriptions.*, users.name AS user_name, users.email AS user_email, plans.name AS plan_name
      FROM subscriptions
      LEFT JOIN users ON users.id = subscriptions.user_id
      LEFT JOIN plans ON plans.id = subscriptions.plan_id
      ORDER BY subscriptions.created_at DESC
    `);
    return json(rows, {}, env, request);
  }

  return null;
}
