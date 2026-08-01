import { first, generateId, normalizeLead, nowIso, run } from "../lib/db.js";
import { error, json, readJson } from "../lib/http.js";
import { sendEmail } from "../lib/email.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function contactNotificationHtml(lead) {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 16px;font-family:Arial, Helvetica, sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
        <tr><td style="padding:28px 32px 0;"><span style="font-size:24px;font-weight:bold;color:#3B82F6;">EkSaha</span></td></tr>
        <tr><td style="padding:22px 32px 0;"><span style="font-size:18px;font-weight:bold;color:#111827;">New contact form submission</span></td></tr>
        <tr>
          <td style="padding:20px 32px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
              <tr><td style="padding:16px 18px;">
                <div style="font-size:14px;color:#111827;"><strong>Name:</strong> ${escapeHtml(lead.name)}</div>
                <div style="margin-top:8px;font-size:14px;color:#111827;"><strong>Email:</strong> ${escapeHtml(lead.email)}</div>
                <div style="margin-top:8px;font-size:14px;color:#111827;"><strong>Interested in:</strong> ${escapeHtml(lead.serviceInterest || "Not specified")}</div>
                <div style="margin-top:14px;font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap;">${escapeHtml(lead.message)}</div>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr><td style="padding:28px 32px 28px;font-size:12px;color:#9ca3af;">Submitted via the EkSaha contact form.</td></tr>
      </table>
    </td>
  </tr>
</table>
  `;
}

function contactConfirmationHtml(name) {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:32px 16px;font-family:Arial, Helvetica, sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
        <tr><td style="padding:28px 32px 0;"><span style="font-size:24px;font-weight:bold;color:#3B82F6;">EkSaha</span></td></tr>
        <tr><td style="padding:22px 32px 0;"><span style="font-size:18px;font-weight:bold;color:#111827;">Thanks for reaching out, ${escapeHtml(name)}.</span></td></tr>
        <tr><td style="padding:16px 32px 28px;"><p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">We'll be in touch within one business day.</p></td></tr>
      </table>
    </td>
  </tr>
</table>
  `;
}

export async function handlePublicForms(request, env, path) {
  if (path === "/contact" && request.method === "POST") {
    const body = await readJson(request);
    const name = body.name?.trim();
    const email = body.email?.trim();
    const message = body.message?.trim();
    if (!name || !email || !message) {
      return error("Name, email and message are required", 400, env, request);
    }

    const id = generateId();
    await run(env.DB, `
      INSERT INTO leads (id, name, email, service_interest, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'new', ?)
    `, [id, name, email, body.service || null, message, nowIso()]);
    const lead = normalizeLead(await first(env.DB, "SELECT * FROM leads WHERE id = ?", [id]));

    try {
      await sendEmail(env, {
        to: env.RESEND_TO_EMAIL,
        from: env.RESEND_FROM_EMAIL,
        subject: `New contact form submission from ${name}`,
        html: contactNotificationHtml(lead),
        text: `New contact form submission\n\nName: ${name}\nEmail: ${email}\nInterested in: ${lead.serviceInterest || "Not specified"}\n\n${message}`,
      });
    } catch (caught) {
      console.error("Could not send contact notification email", caught);
    }

    try {
      await sendEmail(env, {
        to: email,
        from: env.RESEND_SUPPORT_EMAIL,
        subject: "Thanks for reaching out - we'll be in touch within one business day",
        html: contactConfirmationHtml(name),
        text: `Thanks for reaching out, ${name}. We'll be in touch within one business day.`,
      });
    } catch (caught) {
      console.error("Could not send contact confirmation email", caught);
    }

    return json({ ok: true, lead }, { status: 201 }, env, request);
  }

  if (path === "/newsletter" && request.method === "POST") {
    const body = await readJson(request);
    const email = body.email?.trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return error("A valid email address is required", 400, env, request);
    }

    const existing = await first(env.DB, "SELECT * FROM subscribers WHERE email = ?", [email]);
    if (existing?.status === "active") {
      return json({ ok: true, alreadySubscribed: true, message: "You're already on the list." }, {}, env, request);
    }
    if (existing) {
      await run(env.DB, "UPDATE subscribers SET status = 'active' WHERE id = ?", [existing.id]);
      return json({ ok: true, message: "Welcome back - you're subscribed again." }, {}, env, request);
    }

    await run(env.DB, `
      INSERT INTO subscribers (id, email, status, created_at)
      VALUES (?, ?, 'active', ?)
    `, [generateId(), email, nowIso()]);
    return json({ ok: true, message: "You're on the list." }, { status: 201 }, env, request);
  }

  return null;
}
