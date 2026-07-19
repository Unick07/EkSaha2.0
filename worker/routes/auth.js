import { generateId, normalizeUser, nowIso, run, first } from "../lib/db.js";
import { hashPassword, isStrongPassword, refreshPayloadFromCookie, requireUser, sha256, signJwt, verifyPassword } from "../lib/auth.js";
import { clearCookie, error, getCookie, json, readJson, setCookie } from "../lib/http.js";

const refreshMaxAge = 30 * 24 * 60 * 60;
const googleStateMaxAge = 10 * 60;

function googleRedirectUri(env) {
  return `${env.CLIENT_URL || "https://eksaha.com"}/api/auth/google/callback`;
}

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
    if (!body.name || !email || !body.password) {
      return error("Valid name, email and password are required", 400, env, request);
    }
    if (!isStrongPassword(body.password)) {
      return error("Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a special character (!@#$%^&*)", 400, env, request);
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

  if (request.method === "GET" && path === "/google") {
    const state = generateId();
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: googleRedirectUri(env),
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      state,
    });
    return new Response(null, {
      status: 302,
      headers: {
        Location: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
        "Set-Cookie": setCookie("googleOAuthState", state, { maxAge: googleStateMaxAge }),
      },
    });
  }

  if (request.method === "GET" && path === "/google/callback") {
    const clientUrl = env.CLIENT_URL || "https://eksaha.com";
    const failureRedirect = () => Response.redirect(`${clientUrl}/login?error=google_oauth_failed`, 302);
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const state = requestUrl.searchParams.get("state");
    const expectedState = getCookie(request, "googleOAuthState");

    if (!code || !state || !expectedState || state !== expectedState) {
      return failureRedirect();
    }

    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: googleRedirectUri(env),
          grant_type: "authorization_code",
        }),
      });
      if (!tokenResponse.ok) throw new Error("Google token exchange failed");
      const tokenData = await tokenResponse.json();

      const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (!profileResponse.ok) throw new Error("Could not fetch Google profile");
      const profile = await profileResponse.json();
      const email = profile.email?.toLowerCase()?.trim();
      if (!email) throw new Error("Google account has no email");

      let user = await first(env.DB, "SELECT * FROM users WHERE email = ?", [email]);
      if (!user) {
        const id = generateId();
        const timestamp = nowIso();
        await run(env.DB, `
          INSERT INTO users (id, name, email, password_hash, role, plan_id, stripe_customer_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, profile.name || email.split("@")[0], email, null, "user", null, null, timestamp, timestamp]);
        user = await first(env.DB, "SELECT * FROM users WHERE id = ?", [id]);
      }

      const tokens = await tokensFor(user, env);
      const headers = new Headers({ Location: `${clientUrl}/dashboard?accessToken=${encodeURIComponent(tokens.accessToken)}` });
      headers.append("Set-Cookie", setCookie("refreshToken", tokens.refreshToken, { maxAge: refreshMaxAge }));
      headers.append("Set-Cookie", clearCookie("googleOAuthState"));
      return new Response(null, { status: 302, headers });
    } catch (caught) {
      console.error(caught);
      return failureRedirect();
    }
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

  if (request.method === "GET" && path === "/me") {
    const user = await requireUser(request, env);
    return json(publicUser(user), {}, env, request);
  }

  if (request.method === "POST" && path === "/logout") {
    const cookie = request.headers.get("Cookie") || "";
    const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("refreshToken="))?.slice(13);
    if (token) await run(env.DB, "DELETE FROM refresh_tokens WHERE token_hash = ?", [await sha256(token)]);
    return json(null, { status: 204, headers: { "Set-Cookie": clearCookie("refreshToken") } }, env, request);
  }

  return null;
}
