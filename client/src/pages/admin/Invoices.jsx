import { useEffect, useState } from "react";
import { CircleCheck, Plus, Send, Trash2, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/common/ui";
import { Modal } from "../../components/dashboard/Modal";
import ActionMenu from "../../components/dashboard/ActionMenu";
import api from "../../services/http/api";

const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
const formatMoney = (value, currency) => `${Number(value || 0).toFixed(2)} ${(currency || "usd").toUpperCase()}`;
const capitalize = (value) => value ? String(value).charAt(0).toUpperCase() + String(value).slice(1) : "";
const emptyItem = () => ({ key: crypto.randomUUID(), description: "", amount: "" });

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([emptyItem()]);
  const [taxPercent, setTaxPercent] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const loadInvoices = () => {
    setLoading(true);
    return api.get("/invoices")
      .then(({ data }) => {
        setInvoices(data);
        setError("");
      })
      .catch((caught) => {
        const message = caught.response?.data?.message || "Could not load invoices.";
        setError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    api.get("/admin/users", { params: { roles: "user" } }).then(({ data }) => setCustomers(data)).catch(() => {});
    api.get("/admin/subscriptions").then(({ data }) => setSubscriptions(data)).catch(() => {});
  }, []);

  const customerSubscription = subscriptions.find((sub) => (sub.user_id || sub.userId) === customerId);

  const openCreate = () => {
    setCustomerId("");
    setItems([emptyItem()]);
    setTaxPercent("0");
    setDueDate("");
    setNotes("");
    setCreateOpen(true);
  };

  const updateItem = (key, field, value) => {
    setItems((current) => current.map((item) => item.key === key ? { ...item, [field]: value } : item));
  };
  const addItem = () => setItems((current) => [...current, emptyItem()]);
  const removeItem = (key) => setItems((current) => current.length > 1 ? current.filter((item) => item.key !== key) : current);

  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const tax = subtotal * (Number(taxPercent) || 0) / 100;
  const total = subtotal + tax;

  const submitInvoice = async (sendEmailFlag) => {
    if (!customerId) {
      toast.error("Select a customer.");
      return;
    }
    const validItems = items.filter((item) => item.description.trim() && Number(item.amount) > 0);
    if (validItems.length === 0) {
      toast.error("Add at least one line item with a description and amount.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post("/invoices", {
        userId: customerId,
        items: validItems.map(({ description, amount }) => ({ description, amount: Number(amount) })),
        taxPercent: Number(taxPercent) || 0,
        dueDate: dueDate || null,
        notes: notes || null,
        sendEmail: sendEmailFlag,
      });
      setInvoices((current) => [data, ...current]);
      setCreateOpen(false);
      if (sendEmailFlag) {
        if (data.emailSent) toast.success(`Invoice ${data.number} created and emailed to the customer.`);
        else toast.error(`Invoice ${data.number} created, but the email could not be sent${data.emailError ? `: ${data.emailError}` : "."}`);
      } else {
        toast.success(`Invoice ${data.number} created.`);
      }
    } catch (caught) {
      toast.error(caught.response?.data?.message || "Could not create invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (invoice, status, message) => {
    const previous = invoices;
    setInvoices((current) => current.map((item) => item.id === invoice.id ? { ...item, status } : item));
    try {
      await api.patch(`/invoices/${invoice.id}`, { status });
      toast.success(message);
    } catch (caught) {
      setInvoices(previous);
      toast.error(caught.response?.data?.message || "Could not update invoice.");
    }
  };

  return <div>
    <div className="mb-7 flex items-center justify-between">
      <div><h2 className="text-2xl font-bold">Invoices</h2><p className="mt-1 text-sm text-muted">Create, send and track customer invoices.</p></div>
      <Button onClick={openCreate}><Plus size={16}/>Create invoice</Button>
    </div>

    {loading && <div className="panel p-5 text-sm text-muted">Loading invoices...</div>}
    {error && <div className="panel border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>}

    {!loading && !error && <div className="panel overflow-hidden"><div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-surface-raised text-xs uppercase text-muted"><tr><th className="p-5">Invoice</th><th>Customer</th><th>Total</th><th>Status</th><th>Due</th><th></th></tr></thead>
        <tbody>
          {invoices.map((invoice) => <tr className="border-t border-border" key={invoice.id}>
            <td className="p-5"><div className="font-semibold">{invoice.number || invoice.id}</div><div className="mt-1 text-xs text-muted">{formatDate(invoice.createdAt)}</div></td>
            <td><div className="font-semibold">{invoice.customerName || "Unknown customer"}</div><div className="text-xs text-muted">{invoice.customerEmail}</div></td>
            <td>{formatMoney(invoice.amount, invoice.currency)}</td>
            <td><span className="info-pill capitalize">{invoice.status}</span></td>
            <td className="text-muted">{invoice.dueDate ? formatDate(invoice.dueDate) : "On receipt"}</td>
            <td><ActionMenu actions={[
              { label: "Mark paid", icon: CircleCheck, onClick: () => updateStatus(invoice, "paid", "Invoice marked paid."), disabled: invoice.status === "paid" },
              { label: "Void invoice", icon: XCircle, danger: true, onClick: () => updateStatus(invoice, "void", "Invoice voided."), disabled: invoice.status === "void" },
            ]}/></td>
          </tr>)}
        </tbody>
      </table>
      {invoices.length === 0 && <div className="border-t border-border p-6 text-sm text-muted">No invoices yet.</div>}
    </div></div>}

    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create invoice" description="Add line items, review the total, then save or send it." size="lg">
      <div className="space-y-5">
        <label className="block text-sm font-semibold">Customer
          <select required className="input mt-2" value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">Select a customer</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} ({customer.email})</option>)}
          </select>
        </label>

        {customerId && <div className="rounded-xl border border-border bg-surface-raised p-3 text-sm">
          <span className="text-muted">Subscription: </span>
          {customerSubscription
            ? <span className="font-semibold">{customerSubscription.plan_name || "No plan"} - {capitalize(customerSubscription.status)}</span>
            : <span className="text-muted">No active subscription</span>}
        </div>}

        <div>
          <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold">Line items</span><button type="button" onClick={addItem} className="text-action text-xs"><Plus size={14}/>Add item</button></div>
          <div className="space-y-2">
            {items.map((item) => <div className="flex gap-2" key={item.key}>
              <input className="input flex-1" placeholder="Description" value={item.description} onChange={(event) => updateItem(item.key, "description", event.target.value)}/>
              <input className="input w-32" type="number" min="0" step="0.01" placeholder="Amount" value={item.amount} onChange={(event) => updateItem(item.key, "amount", event.target.value)}/>
              <button type="button" onClick={() => removeItem(item.key)} className="icon-button shrink-0" aria-label="Remove item"><Trash2 size={16}/></button>
            </div>)}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">Tax % (optional)<input type="number" min="0" step="0.01" className="input mt-2" value={taxPercent} onChange={(event) => setTaxPercent(event.target.value)}/></label>
          <label className="block text-sm font-semibold">Due date<input type="date" className="input mt-2" value={dueDate} onChange={(event) => setDueDate(event.target.value)}/></label>
        </div>

        <label className="block text-sm font-semibold">Notes (optional)<textarea className="input mt-2 min-h-20 resize-none" value={notes} onChange={(event) => setNotes(event.target.value)}/></label>

        <div className="rounded-xl border border-border bg-surface-raised p-4 text-sm">
          <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="font-semibold">${subtotal.toFixed(2)}</span></div>
          <div className="mt-1 flex justify-between"><span className="text-muted">Tax</span><span className="font-semibold">${tax.toFixed(2)}</span></div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base"><span className="font-bold">Total</span><span className="font-bold">${total.toFixed(2)}</span></div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button disabled={submitting} onClick={() => submitInvoice(true)} className="w-full"><Send size={16}/>Save & Send to Customer</Button>
          <Button disabled={submitting} onClick={() => submitInvoice(false)} variant="secondary" className="w-full">Save Only</Button>
        </div>
      </div>
    </Modal>
  </div>;
}
