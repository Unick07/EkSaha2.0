import { requireRole, requireUser } from "../lib/auth.js";
import { all, first, generateId, normalizeInvoice, nowIso, run } from "../lib/db.js";
import { error, json, readJson } from "../lib/http.js";
import { sendEmail } from "../lib/email.js";

const selectJoined = `
  SELECT invoices.*, users.name AS user_name, users.email AS user_email
  FROM invoices
  LEFT JOIN users ON users.id = invoices.user_id
`;

async function itemsFor(db, invoiceId) {
  const rows = await all(db, "SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY created_at ASC", [invoiceId]);
  return rows.map((row) => ({ id: row.id, description: row.description, amount: row.amount }));
}

async function withItems(db, row) {
  const invoice = normalizeInvoice(row);
  if (!invoice) return null;
  invoice.items = await itemsFor(db, invoice.id);
  return invoice;
}

async function generateInvoiceNumber(env) {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `INV-${year}-${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`;
    const existing = await first(env.DB, "SELECT id FROM invoices WHERE number = ?", [candidate]);
    if (!existing) return candidate;
  }
  return `INV-${year}-${Date.now().toString().slice(-6)}`;
}

function money(value, currency) {
  return `${Number(value || 0).toFixed(2)} ${(currency || "usd").toUpperCase()}`;
}

function formatEmailDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const BRAND_BLUE = "#3B82F6";

function invoiceEmailHtml({ number, customerName, customerEmail, items, subtotal, taxPercent, total, dueDate, currency, createdAt, notes }) {
  const rows = items.map((item, index) => `
    <tr style="background-color:${index % 2 === 0 ? "#ffffff" : "#f9fafb"};">
      <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;">${item.description}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;text-align:center;">1</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;text-align:right;">${money(item.amount, currency)}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;text-align:right;">${money(item.amount, currency)}</td>
    </tr>
  `).join("");

  const taxRow = taxPercent
    ? `<tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Tax (${taxPercent}%)</td><td style="padding:4px 0;font-size:14px;color:#6b7280;text-align:right;">${money((subtotal * taxPercent) / 100, currency)}</td></tr>`
    : "";

  return `
<div style="background-color:#f3f4f6;padding:32px 16px;font-family:Arial, Helvetica, sans-serif;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="padding:32px;">

      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="vertical-align:top;"><span style="font-size:26px;font-weight:bold;color:${BRAND_BLUE};">EkSaha</span></td>
          <td style="vertical-align:top;text-align:right;"><span style="font-size:20px;font-weight:bold;color:#6b7280;letter-spacing:2px;">INVOICE</span></td>
        </tr>
      </table>

      <div style="margin-top:16px;padding:12px 0;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;">
        <strong>Invoice #${number}</strong>&nbsp;&nbsp;|&nbsp;&nbsp;Date: ${formatEmailDate(createdAt)}&nbsp;&nbsp;|&nbsp;&nbsp;Due: ${dueDate ? formatEmailDate(dueDate) : "On receipt"}
      </div>

      <table style="width:100%;border-collapse:collapse;margin-top:24px;">
        <tr>
          <td style="width:50%;vertical-align:top;padding-right:12px;">
            <div style="font-size:12px;font-weight:bold;color:${BRAND_BLUE};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">From</div>
            <div style="font-size:14px;color:#111827;font-weight:bold;">EkSaha</div>
            <div style="font-size:14px;color:#6b7280;">hello@eksaha.com</div>
          </td>
          <td style="width:50%;vertical-align:top;padding-left:12px;">
            <div style="font-size:12px;font-weight:bold;color:${BRAND_BLUE};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Bill To</div>
            <div style="font-size:14px;color:#111827;font-weight:bold;">${customerName || "Customer"}</div>
            <div style="font-size:14px;color:#6b7280;">${customerEmail || ""}</div>
          </td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-top:28px;border:1px solid #e5e7eb;">
        <thead>
          <tr style="background-color:${BRAND_BLUE};">
            <th style="padding:10px 16px;text-align:left;font-size:12px;color:#ffffff;text-transform:uppercase;letter-spacing:.5px;">Description</th>
            <th style="padding:10px 16px;text-align:center;font-size:12px;color:#ffffff;text-transform:uppercase;letter-spacing:.5px;">Qty</th>
            <th style="padding:10px 16px;text-align:right;font-size:12px;color:#ffffff;text-transform:uppercase;letter-spacing:.5px;">Unit Price</th>
            <th style="padding:10px 16px;text-align:right;font-size:12px;color:#ffffff;text-transform:uppercase;letter-spacing:.5px;">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr>
          <td style="width:55%;">&nbsp;</td>
          <td style="width:45%;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:4px 0;font-size:14px;color:#6b7280;">Subtotal</td><td style="padding:4px 0;font-size:14px;color:#6b7280;text-align:right;">${money(subtotal, currency)}</td></tr>
              ${taxRow}
              <tr>
                <td style="padding:12px 0 4px;font-size:18px;font-weight:bold;color:#111827;border-top:2px solid ${BRAND_BLUE};">Total</td>
                <td style="padding:12px 0 4px;font-size:18px;font-weight:bold;color:${BRAND_BLUE};text-align:right;border-top:2px solid ${BRAND_BLUE};">${money(total, currency)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${notes ? `<div style="margin-top:24px;padding:12px 16px;background-color:#f9fafb;border-radius:6px;font-size:13px;color:#374151;">${notes}</div>` : ""}

      <div style="margin-top:32px;border-top:1px solid #e5e7eb;"></div>

      <p style="margin-top:24px;font-size:14px;color:#6b7280;text-align:center;">
        Thank you for your business. Questions? Contact us at <a href="mailto:hello@eksaha.com" style="color:${BRAND_BLUE};">hello@eksaha.com</a>
      </p>

      <p style="margin-top:16px;font-size:11px;color:#9ca3af;text-align:center;">
        Tip: You can save this invoice as PDF using File &rarr; Print &rarr; Save as PDF in your browser.
      </p>

    </div>
  </div>
</div>
  `;
}

async function sendInvoiceEmail(env, invoice) {
  return sendEmail(env, {
    to: invoice.customerEmail,
    subject: `Invoice ${invoice.number} from EkSaha`,
    html: invoiceEmailHtml(invoice),
    text: `Invoice ${invoice.number} - Total: ${money(invoice.total, invoice.currency)}. Thank you for your business.`,
  });
}

export async function handleInvoices(request, env, path) {
  if (request.method === "GET" && path === "/invoices/me") {
    const user = await requireUser(request, env);
    const rows = await all(env.DB, "SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC", [user.id]);
    return json(await Promise.all(rows.map((row) => withItems(env.DB, row))), {}, env, request);
  }

  if (request.method === "GET" && path === "/invoices") {
    await requireRole(request, env, ["admin", "billing"]);
    const rows = await all(env.DB, `${selectJoined} ORDER BY invoices.created_at DESC`);
    return json(await Promise.all(rows.map((row) => withItems(env.DB, row))), {}, env, request);
  }

  if (request.method === "POST" && path === "/invoices") {
    await requireRole(request, env, ["admin", "billing"]);
    const body = await readJson(request);
    if (!body.userId) return error("Customer is required", 400, env, request);
    const items = Array.isArray(body.items)
      ? body.items.filter((item) => item.description && item.amount != null && item.amount !== "")
      : [];
    if (items.length === 0) return error("At least one invoice item is required", 400, env, request);

    const customer = await first(env.DB, "SELECT * FROM users WHERE id = ?", [body.userId]);
    if (!customer) return error("Customer not found", 404, env, request);

    const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
    const taxPercent = Number(body.taxPercent) || 0;
    const total = subtotal + (subtotal * taxPercent) / 100;
    const currency = body.currency || "usd";

    const id = generateId();
    const number = await generateInvoiceNumber(env);
    const timestamp = nowIso();

    await run(env.DB, `
      INSERT INTO invoices (id, user_id, amount, currency, status, number, due_date, notes, tax_percent, subtotal, stripe_invoice_id, invoice_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, body.userId, total, currency, "open", number, body.dueDate || null, body.notes || null, taxPercent, subtotal, null, null, timestamp, timestamp]);

    for (const item of items) {
      await run(env.DB, "INSERT INTO invoice_items (id, invoice_id, description, amount, created_at) VALUES (?, ?, ?, ?, ?)", [
        generateId(), id, item.description, Number(item.amount), timestamp,
      ]);
    }

    let emailError = null;
    let emailSkipped = false;
    if (body.sendEmail) {
      try {
        const result = await sendInvoiceEmail(env, {
          number, customerName: customer.name, customerEmail: customer.email,
          items, subtotal, taxPercent, total, dueDate: body.dueDate, currency, createdAt: timestamp, notes: body.notes,
        });
        emailSkipped = Boolean(result?.skipped);
      } catch (caught) {
        emailError = caught.message || "Email delivery failed";
      }
    }

    const invoice = await withItems(env.DB, await first(env.DB, `${selectJoined} WHERE invoices.id = ?`, [id]));
    return json({ ...invoice, emailSent: Boolean(body.sendEmail) && !emailError && !emailSkipped, emailError, emailSkipped }, { status: 201 }, env, request);
  }

  const id = path.match(/^\/invoices\/([^/]+)$/)?.[1];
  if (request.method === "PATCH" && id) {
    await requireRole(request, env, ["admin", "billing"]);
    const existing = await first(env.DB, "SELECT * FROM invoices WHERE id = ?", [id]);
    if (!existing) return error("Invoice not found", 404, env, request);
    const body = await readJson(request);
    await run(env.DB, `
      UPDATE invoices SET amount = ?, currency = ?, status = ?, due_date = ?, notes = ?, stripe_invoice_id = ?, invoice_url = ?, updated_at = ? WHERE id = ?
    `, [
      body.amount == null ? existing.amount : Number(body.amount),
      body.currency ?? existing.currency,
      body.status ?? existing.status,
      body.dueDate ?? existing.due_date,
      body.notes ?? existing.notes,
      body.stripeInvoiceId ?? existing.stripe_invoice_id,
      body.invoiceUrl ?? existing.invoice_url,
      nowIso(),
      id,
    ]);
    return json(await withItems(env.DB, await first(env.DB, `${selectJoined} WHERE invoices.id = ?`, [id])), {}, env, request);
  }

  return null;
}
