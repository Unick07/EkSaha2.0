import { requireUser } from "../lib/auth.js";
import { first } from "../lib/db.js";
import { json } from "../lib/http.js";

export async function handleNotifications(request, env, path) {
  if (request.method === "GET" && path === "/notifications/unread-count") {
    const user = await requireUser(request, env);
    const row = await first(env.DB, `
      SELECT COUNT(*) AS count
      FROM ticket_messages
      JOIN tickets ON tickets.id = ticket_messages.ticket_id
      WHERE ticket_messages.read = 0
        AND ticket_messages.sender_id != ?
        AND (tickets.user_id = ? OR tickets.assigned_to = ? OR ? = 'admin')
    `, [user.id, user.id, user.id, user.role]);
    return json({ count: row?.count || 0 }, {}, env, request);
  }

  return null;
}
