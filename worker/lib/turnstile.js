export async function verifyTurnstile(token, secretKey) {
  if (!token || !secretKey) return false;

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret: secretKey, response: token }),
  });

  const data = await response.json().catch(() => ({}));
  return Boolean(data.success);
}
