import { hashPassword, isStrongPassword, requireUser, verifyPassword } from "../lib/auth.js";
import { first, normalizeUser, nowIso, run } from "../lib/db.js";
import { error, json, readJson } from "../lib/http.js";

export async function handleUsers(request, env, path) {
  if (request.method === "GET" && path === "/users/me/strategist") {
    const user = await requireUser(request, env);
    if (!user.assigned_to) return json(null, {}, env, request);
    const strategist = await first(env.DB, "SELECT id, name, email, role FROM users WHERE id = ?", [user.assigned_to]);
    return json(strategist || null, {}, env, request);
  }

  if (request.method === "PATCH" && path === "/users/me") {
    const user = await requireUser(request, env);
    const body = await readJson(request);
    const email = body.email ? body.email.toLowerCase().trim() : user.email;
    if (!body.name && !body.email) return error("Name or email is required", 400, env, request);
    if (email !== user.email) {
      const existing = await first(env.DB, "SELECT id FROM users WHERE email = ? AND id != ?", [email, user.id]);
      if (existing) return error("Email already registered", 409, env, request);
    }
    await run(env.DB, "UPDATE users SET name = ?, email = ?, updated_at = ? WHERE id = ?", [body.name || user.name, email, nowIso(), user.id]);
    return json(normalizeUser(await first(env.DB, "SELECT * FROM users WHERE id = ?", [user.id])), {}, env, request);
  }

  if (request.method === "PATCH" && path === "/users/me/password") {
    const user = await requireUser(request, env);
    const body = await readJson(request);
    if (!body.currentPassword || !body.newPassword) {
      return error("Current and new password are required", 400, env, request);
    }
    if (!(await verifyPassword(body.currentPassword, user.password_hash))) {
      return error("Current password is incorrect", 401, env, request);
    }
    if (!isStrongPassword(body.newPassword)) {
      return error("New password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a special character (!@#$%^&*)", 400, env, request);
    }
    await run(env.DB, "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", [await hashPassword(body.newPassword), nowIso(), user.id]);
    return json({ ok: true }, {}, env, request);
  }

  return null;
}
