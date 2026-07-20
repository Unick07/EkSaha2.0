export const generateId = () => crypto.randomUUID();

export const nowIso = () => new Date().toISOString();

export async function first(db, sql, params = []) {
  return db.prepare(sql).bind(...params).first();
}

export async function all(db, sql, params = []) {
  const result = await db.prepare(sql).bind(...params).all();
  return result.results || [];
}

export async function run(db, sql, params = []) {
  return db.prepare(sql).bind(...params).run();
}

export async function batch(db, statements) {
  return db.batch(statements);
}

export function parseJson(value, fallback = []) {
  if (value == null || value === "") return fallback;
  if (Array.isArray(value) || typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function stringifyJson(value) {
  return JSON.stringify(Array.isArray(value) ? value : []);
}

export function bool(value) {
  return value === true || value === 1 || value === "1";
}

export function intBool(value) {
  return value ? 1 : 0;
}

export function normalizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    planId: row.plan_id ?? row.planId ?? null,
    plan: row.plan_name || row.plan || undefined,
    assignedTo: row.assigned_to ?? row.assignedTo ?? null,
    stripeCustomerId: row.stripe_customer_id ?? row.stripeCustomerId ?? null,
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
  };
}

export function normalizePlan(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    features: parseJson(row.features),
    stripePriceId: row.stripe_price_id ?? row.stripePriceId ?? null,
    active: bool(row.active),
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
  };
}

export function normalizePost(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    tags: parseJson(row.tags),
    published: bool(row.published),
    status: bool(row.published) ? "Published" : "Draft",
    authorId: row.author_id ?? row.authorId ?? null,
    updated: row.updated ?? row.updated_at ?? row.updatedAt ?? null,
    read: row.read ?? "4 min",
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
  };
}

export function normalizeTicket(row, messages = undefined) {
  if (!row) return null;
  return {
    id: row.id,
    subject: row.subject,
    userId: row.user_id ?? row.userId ?? null,
    user: row.user_name || row.user || undefined,
    userEmail: row.user_email || row.userEmail || undefined,
    priority: row.priority,
    status: row.status,
    category: row.category || "General",
    assignedTo: row.assigned_to ?? row.assignedTo ?? null,
    assignee: row.assignee_name || row.assignee || "Unassigned",
    messages,
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
    updated: row.updated_at ?? row.updatedAt ?? null,
  };
}

export function normalizeInvoice(row) {
  if (!row) return null;
  return {
    id: row.id,
    number: row.number ?? null,
    userId: row.user_id ?? row.userId ?? null,
    customerName: row.user_name || row.customerName || undefined,
    customerEmail: row.user_email || row.customerEmail || undefined,
    amount: row.amount,
    subtotal: row.subtotal ?? null,
    taxPercent: row.tax_percent ?? row.taxPercent ?? 0,
    currency: row.currency,
    status: row.status,
    dueDate: row.due_date ?? row.dueDate ?? null,
    notes: row.notes ?? null,
    stripeInvoiceId: row.stripe_invoice_id ?? row.stripeInvoiceId ?? null,
    invoiceUrl: row.invoice_url ?? row.invoiceUrl ?? null,
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
  };
}
