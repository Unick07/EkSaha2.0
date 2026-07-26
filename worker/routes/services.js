import { requireRole } from "../lib/auth.js";
import { all, first, generateId, normalizeService, nowIso, run } from "../lib/db.js";
import { error, json, readJson } from "../lib/http.js";

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

async function assertValidOwner(env, ownerId) {
  if (!ownerId) return;
  const owner = await first(env.DB, "SELECT id, role FROM users WHERE id = ?", [ownerId]);
  if (!owner || !["admin", "support"].includes(owner.role)) {
    throw Object.assign(new Error("Service owner must have an admin or support role"), { status: 400 });
  }
}

export async function handleServices(request, env, path) {
  if (!path.startsWith("/services")) return null;
  await requireRole(request, env, ["admin", "support", "billing"]);

  if (request.method === "GET" && path === "/services") {
    const rows = await all(env.DB, `
      SELECT services.*, owner.name AS owner_name,
        (SELECT COUNT(*) FROM service_assignments WHERE service_assignments.service_id = services.id AND service_assignments.status = 'Active') AS client_count,
        (SELECT COUNT(*) FROM tickets WHERE tickets.service_id = services.id AND tickets.status != 'resolved') AS ticket_count
      FROM services
      LEFT JOIN users AS owner ON owner.id = services.owner_id
      ORDER BY CASE WHEN services.status = 'Archived' THEN 1 ELSE 0 END, services.created_at DESC
    `);
    return json(rows.map(normalizeService), {}, env, request);
  }

  if (request.method === "GET" && path === "/services/workload") {
    const rows = await all(env.DB, `
      SELECT users.id, users.name, users.email, users.role,
        (SELECT COUNT(*) FROM users AS clients WHERE clients.assigned_to = users.id AND clients.role = 'user') AS client_count,
        (SELECT COUNT(*) FROM services WHERE services.owner_id = users.id AND services.status != 'Archived') AS service_count,
        (SELECT COUNT(*) FROM tickets WHERE tickets.assigned_to = users.id AND tickets.status != 'resolved') AS open_ticket_count
      FROM users
      WHERE users.role IN ('admin', 'support', 'billing')
      ORDER BY client_count DESC
    `);
    return json(rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      clientCount: row.client_count,
      serviceCount: row.service_count,
      openTicketCount: row.open_ticket_count,
    })), {}, env, request);
  }

  if (request.method === "POST" && path === "/services") {
    await requireRole(request, env, ["admin"]);
    const body = await readJson(request);
    if (!body.name) return error("Name is required", 400, env, request);
    await assertValidOwner(env, body.ownerId);
    const slug = slugify(body.slug || body.name);
    if (await first(env.DB, "SELECT id FROM services WHERE slug = ?", [slug])) {
      return error("A service with this slug already exists", 409, env, request);
    }
    const id = generateId();
    const timestamp = nowIso();
    await run(env.DB, `
      INSERT INTO services (id, name, slug, description, category, status, monthly_price, owner_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      body.name.trim(),
      slug,
      body.description || "",
      body.category || "General",
      "Active",
      Number(body.monthlyPrice) || 0,
      body.ownerId || null,
      timestamp,
      timestamp,
    ]);
    return json(normalizeService(await first(env.DB, "SELECT * FROM services WHERE id = ?", [id])), { status: 201 }, env, request);
  }

  const clientsMatch = path.match(/^\/services\/([^/]+)\/clients$/);
  if (request.method === "POST" && clientsMatch) {
    await requireRole(request, env, ["admin", "support"]);
    const serviceId = clientsMatch[1];
    const service = await first(env.DB, "SELECT id FROM services WHERE id = ?", [serviceId]);
    if (!service) return error("Service not found", 404, env, request);
    const body = await readJson(request);
    if (!body.userId) return error("userId is required", 400, env, request);
    const client = await first(env.DB, "SELECT id FROM users WHERE id = ?", [body.userId]);
    if (!client) return error("User not found", 404, env, request);
    if (await first(env.DB, "SELECT id FROM service_assignments WHERE user_id = ? AND service_id = ?", [body.userId, serviceId])) {
      return error("Client is already assigned to this service", 409, env, request);
    }
    await run(env.DB, `
      INSERT INTO service_assignments (id, user_id, service_id, status, assigned_at)
      VALUES (?, ?, ?, ?, ?)
    `, [generateId(), body.userId, serviceId, "Active", nowIso()]);
    return json({ ok: true }, { status: 201 }, env, request);
  }

  const removeClientMatch = path.match(/^\/services\/([^/]+)\/clients\/([^/]+)$/);
  if (request.method === "DELETE" && removeClientMatch) {
    await requireRole(request, env, ["admin", "support"]);
    const [, serviceId, userId] = removeClientMatch;
    await run(env.DB, "DELETE FROM service_assignments WHERE service_id = ? AND user_id = ?", [serviceId, userId]);
    return json({ ok: true }, {}, env, request);
  }

  const detailId = path.match(/^\/services\/([^/]+)$/)?.[1];

  if (request.method === "GET" && detailId) {
    const service = await first(env.DB, `
      SELECT services.*, owner.name AS owner_name
      FROM services
      LEFT JOIN users AS owner ON owner.id = services.owner_id
      WHERE services.id = ?
    `, [detailId]);
    if (!service) return error("Service not found", 404, env, request);
    const clientRows = await all(env.DB, `
      SELECT users.id, users.name, users.email, service_assignments.status, service_assignments.assigned_at
      FROM service_assignments
      JOIN users ON users.id = service_assignments.user_id
      WHERE service_assignments.service_id = ?
      ORDER BY service_assignments.assigned_at DESC
    `, [detailId]);
    return json({
      ...normalizeService(service),
      clients: clientRows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        status: row.status,
        assignedAt: row.assigned_at,
      })),
    }, {}, env, request);
  }

  if (request.method === "PATCH" && detailId) {
    await requireRole(request, env, ["admin"]);
    const existing = await first(env.DB, "SELECT * FROM services WHERE id = ?", [detailId]);
    if (!existing) return error("Service not found", 404, env, request);
    const body = await readJson(request);
    if (body.ownerId !== undefined) await assertValidOwner(env, body.ownerId);
    await run(env.DB, `
      UPDATE services SET name = ?, description = ?, category = ?, status = ?, monthly_price = ?, owner_id = ?, updated_at = ?
      WHERE id = ?
    `, [
      body.name ?? existing.name,
      body.description ?? existing.description,
      body.category ?? existing.category,
      body.status ?? existing.status,
      body.monthlyPrice != null ? Number(body.monthlyPrice) : existing.monthly_price,
      body.ownerId !== undefined ? body.ownerId : existing.owner_id,
      nowIso(),
      detailId,
    ]);
    return json(normalizeService(await first(env.DB, "SELECT * FROM services WHERE id = ?", [detailId])), {}, env, request);
  }

  if (request.method === "DELETE" && detailId) {
    await requireRole(request, env, ["admin"]);
    const existing = await first(env.DB, "SELECT id FROM services WHERE id = ?", [detailId]);
    if (!existing) return error("Service not found", 404, env, request);
    await run(env.DB, "UPDATE services SET status = 'Archived', updated_at = ? WHERE id = ?", [nowIso(), detailId]);
    return json({ ok: true }, {}, env, request);
  }

  return null;
}
