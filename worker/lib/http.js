export function corsHeaders(env, request) {
  const origin = request.headers.get("Origin");
  const allowed = new Set([
    env.CLIENT_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ].filter(Boolean));
  const allowOrigin = origin && allowed.has(origin) ? origin : env.CLIENT_URL || origin || "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Vary": "Origin",
  };
}

export function json(data, init = {}, env = {}, request = new Request("https://localhost")) {
  return new Response(data == null ? null : JSON.stringify(data), {
    status: init.status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(env, request),
      ...(init.headers || {}),
    },
  });
}

export function error(message = "Internal server error", status = 500, env = {}, request = new Request("https://localhost")) {
  return json({ message }, { status }, env, request);
}

export async function readJson(request) {
  if (!request.headers.get("Content-Type")?.includes("application/json")) return {};
  return request.json();
}

export function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function setCookie(name, value, options = {}) {
  const parts = [`${name}=${value}`, "Path=/", "HttpOnly", "SameSite=Lax"];
  if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
  if (options.secure !== false) parts.push("Secure");
  return parts.join("; ");
}

export function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}
