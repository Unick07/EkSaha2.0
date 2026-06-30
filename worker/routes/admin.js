import { requireRole } from "../lib/auth.js";
import { all, first, normalizeUser, nowIso, run } from "../lib/db.js";
import { error, json, readJson } from "../lib/http.js";

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
    const rows = await all(env.DB, `
      SELECT users.*, plans.name AS plan_name
      FROM users
      LEFT JOIN plans ON plans.id = users.plan_id
      ORDER BY users.created_at DESC
    `);
    return json(rows.map(normalizeUser), {}, env, request);
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
