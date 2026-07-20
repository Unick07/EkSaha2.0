import { requireRole, requireUser } from "../lib/auth.js";
import { all, bool, first, generateId, normalizeTicket, nowIso, run, stringifyJson, parseJson } from "../lib/db.js";
import { error, json, readJson } from "../lib/http.js";

const VALID_CATEGORIES = ["Billing", "Support", "Technical", "General"];
const TICKET_ROLES = ["admin", "support", "billing"];

const ticketSelect = `
  SELECT tickets.*, users.name AS user_name, users.email AS user_email, assignee.name AS assignee_name
  FROM tickets
  LEFT JOIN users ON users.id = tickets.user_id
  LEFT JOIN users AS assignee ON assignee.id = tickets.assigned_to
`;

function normalizeCategory(value) {
  return VALID_CATEGORIES.includes(value) ? value : "General";
}

// Admins see everything. Everyone else sees their own tickets (role "user"),
// tickets assigned to them, or tickets in the category their role owns.
export function canAccessTicket(user, ticket) {
  if (user.role === "admin") return true;
  if (user.role === "user") return ticket.user_id === user.id;
  if (ticket.assigned_to === user.id) return true;
  if (user.role === "support") return ["Support", "General"].includes(ticket.category);
  if (user.role === "billing") return ticket.category === "Billing";
  return false;
}

async function messages(db, ticketId) {
  const rows = await all(db, `
    SELECT ticket_messages.*, users.name AS sender_name, users.email AS sender_email
    FROM ticket_messages
    LEFT JOIN users ON users.id = ticket_messages.sender_id
    WHERE ticket_id = ?
    ORDER BY created_at ASC
  `, [ticketId]);
  return rows.map((row) => ({
    id: row.id,
    senderId: row.sender_id,
    sender: row.sender_name ? { id: row.sender_id, name: row.sender_name, email: row.sender_email } : null,
    body: row.body,
    attachments: parseJson(row.attachments),
    read: bool(row.read),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

async function withMessages(db, row) {
  return normalizeTicket(row, await messages(db, row.id));
}

export async function handleTickets(request, env, path) {
  if (request.method === "GET" && path === "/tickets") {
    const user = await requireUser(request, env);
    const rows = await all(env.DB, `${ticketSelect} ORDER BY tickets.updated_at DESC`);
    const visible = user.role === "admin" ? rows : rows.filter((row) => canAccessTicket(user, row));
    return json(await Promise.all(visible.map((row) => withMessages(env.DB, row))), {}, env, request);
  }

  if (request.method === "POST" && path === "/tickets") {
    const user = await requireUser(request, env);
    const body = await readJson(request);
    if (!body.subject || !(body.message || body.body)) return error("Subject and message are required", 400, env, request);
    const timestamp = nowIso();
    const ticketId = body.id || generateId();
    await run(env.DB, `
      INSERT INTO tickets (id, user_id, subject, priority, status, assigned_to, category, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [ticketId, user.id, body.subject, (body.priority || "medium").toLowerCase(), "open", body.assignedTo || null, normalizeCategory(body.category), timestamp, timestamp]);
    await run(env.DB, `
      INSERT INTO ticket_messages (id, ticket_id, sender_id, body, attachments, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [generateId(), ticketId, user.id, body.message || body.body, stringifyJson(body.attachments), timestamp, timestamp]);
    return json(await withMessages(env.DB, await first(env.DB, `${ticketSelect} WHERE tickets.id = ?`, [ticketId])), { status: 201 }, env, request);
  }

  const readMatch = path.match(/^\/tickets\/([^/]+)\/messages\/read$/);
  if (request.method === "PATCH" && readMatch) {
    const user = await requireUser(request, env);
    const ticketId = readMatch[1];
    const ticket = await first(env.DB, "SELECT * FROM tickets WHERE id = ?", [ticketId]);
    if (!ticket) return error("Ticket not found", 404, env, request);
    if (!canAccessTicket(user, ticket)) return error("Forbidden", 403, env, request);
    await run(env.DB, "UPDATE ticket_messages SET read = 1 WHERE ticket_id = ? AND sender_id != ?", [ticketId, user.id]);
    return json(await withMessages(env.DB, await first(env.DB, `${ticketSelect} WHERE tickets.id = ?`, [ticketId])), {}, env, request);
  }

  const messagesMatch = path.match(/^\/tickets\/([^/]+)\/messages$/);
  if (messagesMatch) {
    const user = await requireUser(request, env);
    const ticketId = messagesMatch[1];
    const ticket = await first(env.DB, "SELECT * FROM tickets WHERE id = ?", [ticketId]);
    if (!ticket) return error("Ticket not found", 404, env, request);
    if (!canAccessTicket(user, ticket)) return error("Forbidden", 403, env, request);

    if (request.method === "GET") {
      // Opening the thread marks everyone else's messages as read for this viewer.
      await run(env.DB, "UPDATE ticket_messages SET read = 1 WHERE ticket_id = ? AND sender_id != ?", [ticketId, user.id]);
      return json(await messages(env.DB, ticketId), {}, env, request);
    }

    if (request.method === "POST") {
      const body = await readJson(request);
      if (!body.body) return error("Message body is required", 400, env, request);
      const timestamp = nowIso();
      await run(env.DB, `
        INSERT INTO ticket_messages (id, ticket_id, sender_id, body, attachments, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [generateId(), ticketId, user.id, body.body, stringifyJson(body.attachments), timestamp, timestamp]);
      await run(env.DB, "UPDATE tickets SET updated_at = ? WHERE id = ?", [timestamp, ticketId]);
      return json(await withMessages(env.DB, await first(env.DB, `${ticketSelect} WHERE tickets.id = ?`, [ticketId])), {}, env, request);
    }
  }

  const id = path.match(/^\/tickets\/([^/]+)$/)?.[1];
  if (request.method === "PATCH" && id) {
    const user = await requireRole(request, env, TICKET_ROLES);
    const existing = await first(env.DB, "SELECT * FROM tickets WHERE id = ?", [id]);
    if (!existing) return error("Ticket not found", 404, env, request);
    if (!canAccessTicket(user, existing)) return error("Forbidden", 403, env, request);
    const body = await readJson(request);
    await run(env.DB, `
      UPDATE tickets SET subject = ?, priority = ?, status = ?, assigned_to = ?, category = ?, updated_at = ? WHERE id = ?
    `, [
      body.subject ?? existing.subject,
      (body.priority ?? existing.priority).toLowerCase(),
      (body.status ?? existing.status).toLowerCase(),
      body.assignedTo ?? existing.assigned_to,
      body.category ? normalizeCategory(body.category) : existing.category,
      nowIso(),
      id,
    ]);
    return json(await withMessages(env.DB, await first(env.DB, `${ticketSelect} WHERE tickets.id = ?`, [id])), {}, env, request);
  }

  return null;
}
