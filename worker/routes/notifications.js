import { requireUser } from "../lib/auth.js";
import { all, bool, run } from "../lib/db.js";
import { json } from "../lib/http.js";
import { canAccessTicket } from "./tickets.js";

const NOTIFICATION_CANDIDATE_LIMIT = 200;

// Every ticket_message not sent by the caller, scoped down to tickets they can
// actually access (own ticket, assigned to them, or in a category their role
// owns) — the same visibility rule used everywhere else in the tickets API.
async function relevantMessages(env, user, { unreadOnly }) {
  const rows = await all(env.DB, `
    SELECT ticket_messages.*,
      tickets.user_id AS ticket_user_id,
      tickets.assigned_to AS ticket_assigned_to,
      tickets.category AS ticket_category,
      tickets.subject AS ticket_subject,
      tickets.created_at AS ticket_created_at,
      users.name AS sender_name
    FROM ticket_messages
    JOIN tickets ON tickets.id = ticket_messages.ticket_id
    LEFT JOIN users ON users.id = ticket_messages.sender_id
    WHERE ticket_messages.sender_id != ? ${unreadOnly ? "AND ticket_messages.read = 0" : ""}
    ORDER BY ticket_messages.created_at DESC
    LIMIT ?
  `, [user.id, NOTIFICATION_CANDIDATE_LIMIT]);
  return rows.filter((row) => canAccessTicket(user, {
    user_id: row.ticket_user_id,
    assigned_to: row.ticket_assigned_to,
    category: row.ticket_category,
  }));
}

export async function handleNotifications(request, env, path) {
  if (request.method === "GET" && path === "/notifications/unread-count") {
    const user = await requireUser(request, env);
    const unread = await relevantMessages(env, user, { unreadOnly: true });
    return json({ count: unread.length }, {}, env, request);
  }

  if (request.method === "GET" && path === "/notifications") {
    const user = await requireUser(request, env);
    const recent = (await relevantMessages(env, user, { unreadOnly: false })).slice(0, 20);
    return json(recent.map((row) => ({
      id: row.id,
      type: row.created_at === row.ticket_created_at ? "ticket_created" : "reply",
      ticketId: row.ticket_id,
      subject: row.ticket_subject,
      senderName: row.sender_name || "Someone",
      body: row.body,
      read: bool(row.read),
      createdAt: row.created_at,
    })), {}, env, request);
  }

  if (request.method === "POST" && path === "/notifications/mark-read") {
    const user = await requireUser(request, env);
    const unread = await relevantMessages(env, user, { unreadOnly: true });
    const ticketIds = [...new Set(unread.map((row) => row.ticket_id))];
    if (ticketIds.length > 0) {
      await run(env.DB, `
        UPDATE ticket_messages SET read = 1
        WHERE sender_id != ? AND ticket_id IN (${ticketIds.map(() => "?").join(",")})
      `, [user.id, ...ticketIds]);
    }
    return json({ ok: true }, {}, env, request);
  }

  return null;
}
