import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/http/api";

const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
const formatAmount = (invoice) => `${Number(invoice.amount || 0).toFixed(2)} ${(invoice.currency || "usd").toUpperCase()}`;
const capitalize = (value) => value ? String(value).charAt(0).toUpperCase() + String(value).slice(1) : "";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/invoices/me")
      .then(({ data }) => {
        if (active) setInvoices(data || []);
      })
      .catch((caught) => {
        const message = caught.response?.data?.message || "Could not load invoices.";
        if (active) setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const download = (invoice) => {
    const content = `EkSaha\nInvoice: ${invoice.id}\nDate: ${formatDate(invoice.createdAt)}\nAmount: ${formatAmount(invoice)}\nStatus: ${capitalize(invoice.status)}\n`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${invoice.id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`${invoice.id} downloaded.`);
  };

  return <div>
    <h2 className="text-2xl font-bold">Billing history</h2>
    <p className="mt-1 text-sm text-muted">View and download your EkSaha invoices.</p>
    {loading && <div className="panel mt-7 p-5 text-sm text-muted">Loading invoices...</div>}
    {error && <div className="panel mt-7 border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
    {!loading && !error && <div className="panel mt-7 overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-surface-raised text-xs uppercase text-muted"><tr><th className="p-5">Invoice</th><th>Date</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>{invoices.map(invoice => <tr className="border-t border-border" key={invoice.id}><td className="p-5 font-semibold">{invoice.id}</td><td>{formatDate(invoice.createdAt)}</td><td>{formatAmount(invoice)}</td><td><span className="success-pill capitalize">{invoice.status}</span></td><td><button aria-label={`Download ${invoice.id}`} className="icon-button size-9 rounded-xl" onClick={() => download(invoice)}><Download size={17}/></button></td></tr>)}</tbody></table>{invoices.length === 0 && <div className="border-t border-border p-6 text-sm text-muted">No invoices yet.</div>}</div></div>}
  </div>;
}
