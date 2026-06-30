import { requireRole } from "../lib/auth.js";
import { all, first, generateId, intBool, normalizePlan, nowIso, run, stringifyJson } from "../lib/db.js";
import { error, json, readJson } from "../lib/http.js";

export async function handlePlans(request, env, path) {
  if (request.method === "GET" && path === "/plans") {
    const rows = await all(env.DB, "SELECT * FROM plans WHERE active = 1 ORDER BY price ASC");
    return json(rows.map(normalizePlan), {}, env, request);
  }

  const id = path.match(/^\/plans\/([^/]+)$/)?.[1];
  if (request.method === "GET" && id) {
    const plan = await first(env.DB, "SELECT * FROM plans WHERE id = ?", [id]);
    return plan ? json(normalizePlan(plan), {}, env, request) : error("Plan not found", 404, env, request);
  }

  if (request.method === "POST" && path === "/plans") {
    await requireRole(request, env, ["admin", "billing"]);
    const body = await readJson(request);
    if (!body.name || body.price == null) return error("Name and price are required", 400, env, request);
    const idValue = generateId();
    const timestamp = nowIso();
    await run(env.DB, `
      INSERT INTO plans (id, name, price, features, stripe_price_id, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [idValue, body.name, Number(body.price), stringifyJson(body.features), body.stripePriceId || null, intBool(body.active !== false), timestamp, timestamp]);
    return json(normalizePlan(await first(env.DB, "SELECT * FROM plans WHERE id = ?", [idValue])), { status: 201 }, env, request);
  }

  if (request.method === "PATCH" && id) {
    await requireRole(request, env, ["admin", "billing"]);
    const existing = await first(env.DB, "SELECT * FROM plans WHERE id = ?", [id]);
    if (!existing) return error("Plan not found", 404, env, request);
    const body = await readJson(request);
    await run(env.DB, `
      UPDATE plans SET name = ?, price = ?, features = ?, stripe_price_id = ?, active = ?, updated_at = ? WHERE id = ?
    `, [
      body.name ?? existing.name,
      body.price == null ? existing.price : Number(body.price),
      body.features ? stringifyJson(body.features) : existing.features,
      body.stripePriceId ?? existing.stripe_price_id,
      body.active == null ? existing.active : intBool(body.active),
      nowIso(),
      id,
    ]);
    return json(normalizePlan(await first(env.DB, "SELECT * FROM plans WHERE id = ?", [id])), {}, env, request);
  }

  return null;
}
