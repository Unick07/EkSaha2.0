import { hashPassword, requireRole } from "../lib/auth.js";
import { all, first, generateId, normalizeUser, nowIso, run } from "../lib/db.js";
import { error, json, readJson } from "../lib/http.js";

const TEAM_ROLES = ["admin", "support", "billing"];

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
