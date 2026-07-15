import { generateId, normalizeUser, nowIso, run, first } from "../lib/db.js";
import { hashPassword, refreshPayloadFromCookie, sha256, signJwt, verifyPassword } from "../lib/auth.js";
import { clearCookie, error, json, readJson, setCookie } from "../lib/http.js";

const refreshMaxAge = 30 * 24 * 60 * 60;

function publicUser(user) {
  return normalizeUser(user);
}

async function tokensFor(user, env) {
  const accessToken = await signJwt({ sub: user.id, role: user.role }, env, { expiresIn: 15 * 60, kind: "ACCESS" });
  const refreshToken = await signJwt({ sub: user.id, type: "refresh" }, env, { expiresIn: refreshMaxAge, kind: "REFRESH" });
  const tokenHash = await sha256(refreshToken);
  await run(env.DB, "INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)", [
    generateId(),
    user.id,
    tokenHash,
    new Date(Date.now() + refreshMaxAge * 1000).toISOString(),
    nowIso(),
  ]);
  return { accessToken, refreshToken };
}

export async function handleAuth(request, env, path) {
  if (request.method === "POST" && path === "/signup") {
    const body = await readJson(request);
    const email = body.email?.toLowerCase()?.trim();
    if (!body.name || !email || !body.password || body.password.length < 8) {
      return error("Valid name, email and password are required", 400, env, request);
    }
    if (await first(env.DB, "SELECT id FROM users WHERE email = ?", [email])) {
      return error("Email already registered", 409, env, request);
    }

    const id = generateId();
    const timestamp = nowIso();
    await run(env.DB, `
      INSERT INTO users (id, name, email, password_hash, role, plan_id, stripe_customer_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, body.name.trim(), email, await hashPassword(body.password), "user", body.planId || null, null, timestamp, timestamp]);
    if (body.planId) {
      const subId = generateId();
      const now = nowIso();
      await run(env.DB,
        `INSERT INTO subscriptions (id, user_id, plan_id, status, billing_cycle, start_date, created_at, updated_at)
         VALUES (?, ?, ?, 'trialing', 'monthly', ?, ?, ?)`,
        [subId, id, body.planId, now, now, now],
      );
    }
    const user = await first(env.DB, "SELECT * FROM users WHERE id = ?", [id]);
    const tokens = await tokensFor(user, env);

    return json(
      { accessToken: tokens.accessToken, user: publicUser(user) },
      { status: 201, headers: { "Set-Cookie": setCookie("refreshToken", tokens.refreshToken, { maxAge: refreshMaxAge }) } },
      env,
      request,
    );
  }

  if (request.method === "POST" && path === "/login") {
    const body = await readJson(request);
    const user = await first(env.DB, "SELECT * FROM users WHERE email = ?", [body.email?.toLowerCase()?.trim()]);
    if (!user || !(await verifyPassword(body.password || "", user.password_hash))) {
      return error("Invalid email or password", 401, env, request);
    }
    const tokens = await tokensFor(user, env);
    return json(
      { accessToken: tokens.accessToken, user: publicUser(user) },
      { headers: { "Set-Cookie": setCookie("refreshToken", tokens.refreshToken, { maxAge: refreshMaxAge }) } },
      env,
      request,
    );
  }

  if (request.method === "POST" && path === "/refresh") {
    try {
      const { token, payload } = await refreshPayloadFromCookie(request, env);
      const tokenHash = await sha256(token);
      const stored = await first(env.DB, "SELECT * FROM refresh_tokens WHERE user_id = ? AND token_hash = ? AND expires_at > ?", [
        payload.sub,
        tokenHash,
        nowIso(),
      ]);
      if (!stored) throw new Error("Refresh token invalid");
      const user = await first(env.DB, "SELECT * FROM users WHERE id = ?", [payload.sub]);
      if (!user) throw new Error("User missing");
      return json({ accessToken: await signJwt({ sub: user.id, role: user.role }, env, { expiresIn: 15 * 60, kind: "ACCESS" }) }, {}, env, request);
    } catch {
      return error("Refresh token invalid", 401, env, request);
    }
  }

  if (request.method === "POST" && path === "/logout") {
    const cookie = request.headers.get("Cookie") || "";
    const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("refreshToken="))?.slice(13);
    if (token) await run(env.DB, "DELETE FROM refresh_tokens WHERE token_hash = ?", [await sha256(token)]);
    return json(null, { status: 204, headers: { "Set-Cookie": clearCookie("refreshToken") } }, env, request);
  }

  return null;
}
