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

function invoiceEmailHtml({ number, customerName, items, subtotal, taxPercent, total, dueDate, currency, createdAt, notes }) {
  const rows = items.map((item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eee;">${item.description}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;">${money(item.amount, currency)}</td>
    </tr>
  `).join("");
  const taxRow = taxPercent
    ? `<tr><td style="padding:6px 0;color:#666;">Tax (${taxPercent}%)</td><td style="padding:6px 0;text-align:right;color:#666;">${money(subtotal * taxPercent / 100, currency)}</td></tr>`
    : "";
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
      <h1 style="font-size:20px;">Invoice ${number}</h1>
      <p>Hi ${customerName || "there"},</p>
      <p style="color:#555;">
        Date: ${new Date(createdAt).toLocaleDateString()}<br/>
        Due: ${dueDate ? new Date(dueDate).toLocaleDateString() : "On receipt"}
      </p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <thead>
          <tr><th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #1a1a1a;">Description</th><th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #1a1a1a;">Amount</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <table style="width:100%;margin-top:8px;">
        <tr><td style="padding:6px 0;color:#666;">Subtotal</td><td style="padding:6px 0;text-align:right;color:#666;">${money(subtotal, currency)}</td></tr>
        ${taxRow}
        <tr><td style="padding:10px 0;font-weight:bold;border-top:1px solid #ddd;">Total</td><td style="padding:10px 0;text-align:right;font-weight:bold;border-top:1px solid #ddd;">${money(total, currency)}</td></tr>
      </table>
      ${notes ? `<p style="margin-top:20px;color:#555;">${notes}</p>` : ""}
      <p style="margin-top:24px;">Thank you for your business.</p>
      <p style="color:#999;font-size:12px;margin-top:32px;">EkSaha &middot; hello@eksaha.com</p>
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
