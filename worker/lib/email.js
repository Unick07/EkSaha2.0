export async function sendEmail(env, { to = env.RESEND_TO_EMAIL, subject, html, text }) {
  if (!env.RESEND_API_KEY) return { skipped: true, reason: "RESEND_API_KEY is not configured" };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject,
      html,
      text,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Email delivery failed");
  return data;
}
