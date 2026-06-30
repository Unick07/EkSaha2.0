import { requireRole, requireUser } from "../lib/auth.js";
import { all, first, generateId, nowIso, run } from "../lib/db.js";
import { error, json, readJson } from "../lib/http.js";

function normalize(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    status: row.status,
    billingCycle: row.billing_cycle,
    stripeSubscriptionId: row.stripe_subscription_id,
    startDate: row.start_date,
    endDate: row.end_date,
    plan: row.plan_name ? { id: row.plan_id, name: row.plan_name, price: row.plan_price } : undefined,
    user: row.user_name ? { id: row.user_id, name: row.user_name, email: row.user_email } : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const selectJoined = `
  SELECT subscriptions.*, plans.name AS plan_name, plans.price AS plan_price, users.name AS user_name, users.email AS user_email
  FROM subscriptions
  LEFT JOIN plans ON plans.id = subscriptions.plan_id
  LEFT JOIN users ON users.id = subscriptions.user_id
`;

export async function handleSubscriptions(request, env, path) {
  if (request.method === "GET" && path === "/subscriptions/me") {
    const user = await requireUser(request, env);
    return json(normalize(await first(env.DB, `${selectJoined} WHERE subscriptions.user_id = ? ORDER BY subscriptions.created_at DESC LIMIT 1`, [user.id])), {}, env, request);
  }

  if (request.method === "GET" && path === "/subscriptions") {
    await requireRole(request, env, ["admin", "billing"]);
    return json((await all(env.DB, `${selectJoined} ORDER BY subscriptions.created_at DESC`)).map(normalize), {}, env, request);
  }

  if (request.method === "POST" && path === "/subscriptions") {
    await requireRole(request, env, ["admin", "billing"]);
    const body = await readJson(request);
    const id = generateId();
    const timestamp = nowIso();
    await run(env.DB, `
      INSERT INTO subscriptions (id, user_id, plan_id, status, billing_cycle, stripe_subscription_id, start_date, end_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, body.userId, body.planId, body.status || "trialing", body.billingCycle || "monthly", body.stripeSubscriptionId || null, body.startDate || timestamp, body.endDate || null, timestamp, timestamp]);
    return json(normalize(await first(env.DB, `${selectJoined} WHERE subscriptions.id = ?`, [id])), { status: 201 }, env, request);
  }

  const id = path.match(/^\/subscriptions\/([^/]+)$/)?.[1];
  if (request.method === "PATCH" && id) {
    await requireRole(request, env, ["admin", "billing"]);
    const existing = await first(env.DB, "SELECT * FROM subscriptions WHERE id = ?", [id]);
    if (!existing) return error("Subscription not found", 404, env, request);
    const body = await readJson(request);
    await run(env.DB, `
      UPDATE subscriptions SET plan_id = ?, status = ?, billing_cycle = ?, stripe_subscription_id = ?, start_date = ?, end_date = ?, updated_at = ? WHERE id = ?
    `, [body.planId ?? existing.plan_id, body.status ?? existing.status, body.billingCycle ?? existing.billing_cycle, body.stripeSubscriptionId ?? existing.stripe_subscription_id, body.startDate ?? existing.start_date, body.endDate ?? existing.end_date, nowIso(), id]);
    return json(normalize(await first(env.DB, `${selectJoined} WHERE subscriptions.id = ?`, [id])), {}, env, request);
  }

  return null;
}
