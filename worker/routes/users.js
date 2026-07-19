import { requireUser } from "../lib/auth.js";
import { first } from "../lib/db.js";
import { json } from "../lib/http.js";

export async function handleUsers(request, env, path) {
  if (request.method === "GET" && path === "/users/me/strategist") {
    const user = await requireUser(request, env);
    if (!user.assigned_to) return json(null, {}, env, request);
    const strategist = await first(env.DB, "SELECT id, name, email, role FROM users WHERE id = ?", [user.assigned_to]);
    return json(strategist || null, {}, env, request);
  }

  return null;
}
