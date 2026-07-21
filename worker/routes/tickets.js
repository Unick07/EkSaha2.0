import { requireRole, requireUser } from "../lib/auth.js";
import { all, bool, first, generateId, normalizeTicket, nowIso, run, stringifyJson, parseJson } from "../lib/db.js";
import { error, json, readJson } from "../lib/http.js";
import { sendEmail } from "../lib/email.js";

const VALID_CATEGORIES = ["Billing", "Support", "Technical", "General"];
const TICKET_ROLES = ["admin", "support", "billing"];

// Mirrors client/src/lib/roles.js's ticketsRouteForRole so notification
// emails deep-link straight to the ticket on the recipient's own workspace.
const TICKETS_ROUTE_BY_ROLE = {
  admin: "/admin/tickets",
  support: "/support/tickets",
  billing: "/billing/tickets",
  user: "/dashboard/tickets",
};

function ticketUrl(env, ticketId, role) {
  const base = env.CLIENT_URL || "https://eksaha.com";
  const route = TICKETS_ROUTE_BY_ROLE[role] || "/dashboard/tickets";
  return `${base}${route}?ticket=${ticketId}`;
}

function notificationEmailHtml(heading, body, url) {
  return `
    <div style="font-family:Arial, Helvetica, sans-serif;max-width:480px;margin:0 auto;color:#111827;">
      <div style="font-size:24px;font-weight:bold;color:#3B82F6;">EkSaha</div>
      <h1 style="font-size:18px;margin-top:24px;">${heading}</h1>
      <p style="color:#374151;line-height:1.6;">${body}</p>
      <a href="${url}" style="display:inline-block;margin-top:20px;padding:12px 24px;background-color:#3B82F6;color:#ffffff;font-weight:bold;text-decoration:none;border-radius:8px;font-size:14px;">View ticket</a>
    </div>
  `;
}

// Non-fatal by design, same pattern as the rest of the app's transactional
// email: a Resend outage should never block a ticket action from saving.
async function notify(env, { to, role, ticketId, subject, heading, body }) {
  if (!to) return;
  const url = ticketUrl(env, ticketId, role);
  try {
    await sendEmail(env, { to, subject, html: notificationEmailHtml(heading, body, url), text: `${body} View it here: ${url}` });
  } catch (caught) {
    console.error("Could not send ticket notification email", caught);
  }
}

// Debounces reply notifications: if the same person posts several messages
// on the same ticket within a minute, only the first one triggers an email.
async function sentRecentlyBySameSender(env, ticketId, senderId, messageId) {
  const cutoff = new Date(Date.now() - 60_000).toISOString();
  const row = await first(env.DB, `
    SELECT id FROM ticket_messages WHERE ticket_id = ? AND sender_id = ? AND id != ? AND created_at > ? LIMIT 1
  `, [ticketId, senderId, messageId, cutoff]);
  return Boolean(row);
}

async function notifyNewTicket(env, ticket, owner) {
  const staff = await all(env.DB, "SELECT email, role FROM users WHERE role IN ('admin', 'support')");
  await Promise.all(staff.map((member) => notify(env, {
    to: member.email,
    role: member.role,
    ticketId: ticket.id,
    subject: `New support ticket from ${owner.name}: ${ticket.subject}`,
    heading: "New support ticket",
    body: `${owner.name} opened a new ${ticket.category} ticket: "${ticket.subject}".`,
  })));
}

async function notifyReply(env, ticket, sender, messageId) {
  if (await sentRecentlyBySameSender(env, ticket.id, sender.id, messageId)) return;

  if (sender.role === "user") {
    const recipients = ticket.assigned_to
      ? [await first(env.DB, "SELECT email, role FROM users WHERE id = ?", [ticket.assigned_to])].filter(Boolean)
      : await all(env.DB, "SELECT email, role FROM users WHERE role IN ('admin', 'support')");
    await Promise.all(recipients.map((recipient) => notify(env, {
      to: recipient.email,
      role: recipient.role,
      ticketId: ticket.id,
      subject: `${sender.name} replied to ticket: ${ticket.subject}`,
      heading: "New reply on a support ticket",
      body: `${sender.name} replied to "${ticket.subject}".`,
    })));
  } else {
    const owner = await first(env.DB, "SELECT email FROM users WHERE id = ?", [ticket.user_id]);
    await notify(env, {
      to: owner?.email,
      role: "user",
      ticketId: ticket.id,
      subject: `You have a new reply on your ticket: ${ticket.subject}`,
      heading: "New reply on your ticket",
      body: `Our team replied to your ticket "${ticket.subject}".`,
    });
  }
}

async function notifyAssignment(env, ticket, subject, assigneeId) {
  const assignee = await first(env.DB, "SELECT email, role FROM users WHERE id = ?", [assigneeId]);
  if (!assignee) return;
  await notify(env, {
    to: assignee.email,
    role: assignee.role,
    ticketId: ticket.id,
    subject: `You've been assigned a new ticket: ${subject}`,
    heading: "New ticket assigned to you",
    body: `You've been assigned to handle "${subject}".`,
  });
}

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
    const created = await first(env.DB, `${ticketSelect} WHERE tickets.id = ?`, [ticketId]);
    await notifyNewTicket(env, created, user);
    return json(await withMessages(env.DB, created), { status: 201 }, env, request);
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
      const messageId = generateId();
      const timestamp = nowIso();
      await run(env.DB, `
        INSERT INTO ticket_messages (id, ticket_id, sender_id, body, attachments, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [messageId, ticketId, user.id, body.body, stringifyJson(body.attachments), timestamp, timestamp]);
      await run(env.DB, "UPDATE tickets SET updated_at = ? WHERE id = ?", [timestamp, ticketId]);
      await notifyReply(env, ticket, user, messageId);
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
    const nextAssignedTo = body.assignedTo ?? existing.assigned_to;
    const nextSubject = body.subject ?? existing.subject;
    await run(env.DB, `
      UPDATE tickets SET subject = ?, priority = ?, status = ?, assigned_to = ?, category = ?, updated_at = ? WHERE id = ?
    `, [
      nextSubject,
      (body.priority ?? existing.priority).toLowerCase(),
      (body.status ?? existing.status).toLowerCase(),
      nextAssignedTo,
      body.category ? normalizeCategory(body.category) : existing.category,
      nowIso(),
      id,
    ]);
    if (nextAssignedTo && nextAssignedTo !== existing.assigned_to) {
      await notifyAssignment(env, existing, nextSubject, nextAssignedTo);
    }
    return json(await withMessages(env.DB, await first(env.DB, `${ticketSelect} WHERE tickets.id = ?`, [id])), {}, env, request);
  }

  return null;
}
