import { generateId, normalizeUser, nowIso, run, first } from "../lib/db.js";
import { hashPassword, isStrongPassword, refreshPayloadFromCookie, requireUser, sha256, signJwt, verifyPassword } from "../lib/auth.js";
import { clearCookie, error, getCookie, json, readJson, setCookie } from "../lib/http.js";
import { sendEmail } from "../lib/email.js";

const refreshMaxAge = 30 * 24 * 60 * 60;
const googleStateMaxAge = 10 * 60;
const verificationTokenMaxAge = 24 * 60 * 60;

function googleRedirectUri(env) {
  return `${env.CLIENT_URL || "https://eksaha.com"}/api/auth/google/callback`;
}

function publicUser(user) {
  return normalizeUser(user);
}

function generateOtp() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const value = new DataView(bytes.buffer).getUint32(0) % 1000000;
  return String(value).padStart(6, "0");
}

function verificationEmailHtml(code) {
  return `
    <div style="font-family:Arial, Helvetica, sans-serif;max-width:480px;margin:0 auto;color:#111827;">
      <div style="font-size:24px;font-weight:bold;color:#3B82F6;">EkSaha</div>
      <h1 style="font-size:18px;margin-top:24px;">Verify your email</h1>
      <p style="color:#374151;">Enter this code to confirm your email address:</p>
      <div style="margin:20px 0;padding:16px 24px;background-color:#f3f4f6;border-radius:8px;text-align:center;">
        <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#111827;">${code}</span>
      </div>
      <p style="color:#6b7280;font-size:14px;">This code expires in 24 hours. If you didn't request this, you can ignore this email.</p>
    </div>
  `;
}

// Deletes any prior codes for the user (a resend invalidates the old one) and
// generates a fresh one, retrying on the unlikely chance of a collision with
// another user's still-active code (verification_tokens.token is UNIQUE).
async function createVerificationToken(env, userId) {
  await run(env.DB, "DELETE FROM verification_tokens WHERE user_id = ?", [userId]);
  const expiresAt = new Date(Date.now() + verificationTokenMaxAge * 1000).toISOString();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateOtp();
    const existing = await first(env.DB, "SELECT id FROM verification_tokens WHERE token = ?", [code]);
    if (existing) continue;
    await run(env.DB, "INSERT INTO verification_tokens (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)", [
      generateId(), userId, code, expiresAt, nowIso(),
    ]);
    return code;
  }
  throw new Error("Could not generate a verification code");
}

async function sendVerificationEmail(env, user) {
  const code = await createVerificationToken(env, user.id);
  await sendEmail(env, {
    to: user.email,
    subject: "Verify your EkSaha email",
    html: verificationEmailHtml(code),
    text: `Your verification code is: ${code} - This code expires in 24 hours.`,
  });
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
      INSERT INTO users (id, name, email, password_hash, role, plan_id, stripe_customer_id, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, body.name.trim(), email, await hashPassword(body.password), "user", body.planId || null, null, 0, timestamp, timestamp]);
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
    try {
      await sendVerificationEmail(env, user);
    } catch (caught) {
      console.error("Could not send verification email", caught);
    }

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
    const planId = new URL(request.url).searchParams.get("planId");
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: googleRedirectUri(env),
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      state,
    });
    const headers = new Headers({ Location: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
    headers.append("Set-Cookie", setCookie("googleOAuthState", state, { maxAge: googleStateMaxAge }));
    if (planId) headers.append("Set-Cookie", setCookie("googleOAuthPlanId", planId, { maxAge: googleStateMaxAge }));
    return new Response(null, { status: 302, headers });
  }

  if (request.method === "GET" && path === "/google/callback") {
    const clientUrl = env.CLIENT_URL || "https://eksaha.com";
    const failureRedirect = () => Response.redirect(`${clientUrl}/login?error=google_failed`, 302);
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const state = requestUrl.searchParams.get("state");
    const expectedState = getCookie(request, "googleOAuthState");
    const pendingPlanId = getCookie(request, "googleOAuthPlanId");

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
        const plan = pendingPlanId ? await first(env.DB, "SELECT id FROM plans WHERE id = ?", [pendingPlanId]) : null;
        await run(env.DB, `
          INSERT INTO users (id, name, email, password_hash, role, plan_id, stripe_customer_id, email_verified, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, profile.name || email.split("@")[0], email, null, "user", plan?.id || null, null, 1, timestamp, timestamp]);
        if (plan) {
          await run(env.DB, `
            INSERT INTO subscriptions (id, user_id, plan_id, status, billing_cycle, start_date, created_at, updated_at)
            VALUES (?, ?, ?, 'trialing', 'monthly', ?, ?, ?)
          `, [generateId(), id, plan.id, timestamp, timestamp, timestamp]);
        }
        user = await first(env.DB, "SELECT * FROM users WHERE id = ?", [id]);
      }

      const tokens = await tokensFor(user, env);
      const headers = new Headers({
        Location: `${clientUrl}/auth/callback?token=${encodeURIComponent(tokens.accessToken)}&role=${encodeURIComponent(user.role)}`,
      });
      headers.append("Set-Cookie", setCookie("refreshToken", tokens.refreshToken, { maxAge: refreshMaxAge }));
      headers.append("Set-Cookie", clearCookie("googleOAuthState"));
      headers.append("Set-Cookie", clearCookie("googleOAuthPlanId"));
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

  if (request.method === "POST" && path === "/verify-email") {
    const user = await requireUser(request, env);
    const body = await readJson(request);
    if (!body.token) return error("Verification code is required", 400, env, request);
    if (user.email_verified) return json(publicUser(user), {}, env, request);

    const record = await first(env.DB, "SELECT * FROM verification_tokens WHERE user_id = ? AND token = ?", [user.id, body.token]);
    if (!record) return error("Invalid verification code", 400, env, request);
    if (new Date(record.expires_at) < new Date()) {
      await run(env.DB, "DELETE FROM verification_tokens WHERE id = ?", [record.id]);
      return error("This code has expired. Request a new one.", 400, env, request);
    }

    await run(env.DB, "UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?", [nowIso(), user.id]);
    await run(env.DB, "DELETE FROM verification_tokens WHERE user_id = ?", [user.id]);
    return json(publicUser(await first(env.DB, "SELECT * FROM users WHERE id = ?", [user.id])), {}, env, request);
  }

  if (request.method === "POST" && path === "/resend-verification") {
    const user = await requireUser(request, env);
    if (user.email_verified) return json({ ok: true, alreadyVerified: true }, {}, env, request);
    try {
      await sendVerificationEmail(env, user);
    } catch (caught) {
      return error(caught.message || "Could not send verification email", 500, env, request);
    }
    return json({ ok: true }, {}, env, request);
  }

  if (request.method === "POST" && path === "/logout") {
    const cookie = request.headers.get("Cookie") || "";
    const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("refreshToken="))?.slice(13);
    if (token) await run(env.DB, "DELETE FROM refresh_tokens WHERE token_hash = ?", [await sha256(token)]);
    return json(null, { status: 204, headers: { "Set-Cookie": clearCookie("refreshToken") } }, env, request);
  }

  return null;
}
