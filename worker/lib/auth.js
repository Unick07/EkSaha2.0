import { first } from "./db.js";
import { getCookie } from "./http.js";

const enc = new TextEncoder();
const dec = new TextDecoder();

function base64UrlEncode(input) {
  const bytes = input instanceof Uint8Array ? input : enc.encode(input);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

function secret(env, kind) {
  return env[`JWT_${kind}_SECRET`] || env.JWT_SECRET || env.SECRET_KEY || "eksaha-development-secret-change-in-cloudflare";
}

export async function signJwt(payload, env, { expiresIn = 900, kind = "ACCESS" } = {}) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  }));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret(env, kind)), enc.encode(`${header}.${body}`));
  return `${header}.${body}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifyJwt(token, env, { kind = "ACCESS" } = {}) {
  const [header, body, signature] = (token || "").split(".");
  if (!header || !body || !signature) throw new Error("Invalid token");
  const valid = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(secret(env, kind)),
    base64UrlDecode(signature),
    enc.encode(`${header}.${body}`),
  );
  if (!valid) throw new Error("Invalid token");
  const payload = JSON.parse(dec.decode(base64UrlDecode(body)));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error("Token expired");
  return payload;
}

export function isStrongPassword(password) {
  return typeof password === "string"
    && password.length >= 8
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /[0-9]/.test(password)
    && /[!@#$%^&*]/.test(password);
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256);
  return `pbkdf2$100000$${base64UrlEncode(salt)}$${base64UrlEncode(new Uint8Array(bits))}`;
}

export async function verifyPassword(password, hash) {
  const [scheme, iterations, saltValue, expected] = (hash || "").split("$");
  if (scheme !== "pbkdf2" || !iterations || !saltValue || !expected) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: base64UrlDecode(saltValue), iterations: Number(iterations), hash: "SHA-256" },
    key,
    256,
  );
  return constantTimeEqual(base64UrlEncode(new Uint8Array(bits)), expected);
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return diff === 0;
}

export async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function currentUser(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const payload = await verifyJwt(token, env, { kind: "ACCESS" });
    return first(env.DB, "SELECT * FROM users WHERE id = ?", [payload.sub]);
  } catch {
    return null;
  }
}

export async function requireUser(request, env) {
  const user = await currentUser(request, env);
  if (!user) throw Object.assign(new Error("Authentication required"), { status: 401 });
  return user;
}

export async function requireRole(request, env, roles) {
  const user = await requireUser(request, env);
  if (!roles.includes(user.role)) throw Object.assign(new Error("Forbidden"), { status: 403 });
  return user;
}

export async function refreshPayloadFromCookie(request, env) {
  const token = getCookie(request, "refreshToken");
  if (!token) throw new Error("Refresh token missing");
  return { token, payload: await verifyJwt(token, env, { kind: "REFRESH" }) };
}
