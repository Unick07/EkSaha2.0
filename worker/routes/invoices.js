import { requireRole, requireUser } from "../lib/auth.js";
import { all, first, generateId, normalizeInvoice, nowIso, run } from "../lib/db.js";
import { error, json, readJson } from "../lib/http.js";

const selectJoined = `
  SELECT invoices.*, users.name AS user_name, users.email AS user_email
  FROM invoices
  LEFT JOIN users ON users.id = invoices.user_id
`;

export async function handleInvoices(request, env, path) {
  if (request.method === "GET" && path === "/invoices/me") {
    const user = await requireUser(request, env);
    const rows = await all(env.DB, "SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC", [user.id]);
    return json(rows.map(normalizeInvoice), {}, env, request);
  }

  if (request.method === "GET" && path === "/invoices") {
    await requireRole(request, env, ["admin", "billing"]);
    const rows = await all(env.DB, `${selectJoined} ORDER BY invoices.created_at DESC`);
    return json(rows.map(normalizeInvoice), {}, env, request);
  }

  if (request.method === "POST" && path === "/invoices") {
    await requireRole(request, env, ["admin", "billing"]);
    const body = await readJson(request);
    if (!body.userId || body.amount == null) return error("User and amount are required", 400, env, request);
    const id = body.id || generateId();
    const timestamp = nowIso();
    await run(env.DB, `
      INSERT INTO invoices (id, user_id, amount, currency, status, stripe_invoice_id, invoice_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, body.userId, Number(body.amount), body.currency || "usd", body.status || "draft", body.stripeInvoiceId || null, body.invoiceUrl || null, timestamp, timestamp]);
    return json(normalizeInvoice(await first(env.DB, `${selectJoined} WHERE invoices.id = ?`, [id])), { status: 201 }, env, request);
  }

  const id = path.match(/^\/invoices\/([^/]+)$/)?.[1];
  if (request.method === "PATCH" && id) {
    await requireRole(request, env, ["admin", "billing"]);
    const existing = await first(env.DB, "SELECT * FROM invoices WHERE id = ?", [id]);
    if (!existing) return error("Invoice not found", 404, env, request);
    const body = await readJson(request);
    await run(env.DB, `
      UPDATE invoices SET amount = ?, currency = ?, status = ?, stripe_invoice_id = ?, invoice_url = ?, updated_at = ? WHERE id = ?
    `, [body.amount == null ? existing.amount : Number(body.amount), body.currency ?? existing.currency, body.status ?? existing.status, body.stripeInvoiceId ?? existing.stripe_invoice_id, body.invoiceUrl ?? existing.invoice_url, nowIso(), id]);
    return json(normalizeInvoice(await first(env.DB, `${selectJoined} WHERE invoices.id = ?`, [id])), {}, env, request);
  }

  return null;
}
