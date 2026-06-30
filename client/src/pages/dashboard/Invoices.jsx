import { Download } from "lucide-react";
import toast from "react-hot-toast";
import { invoices } from "./data";

export default function Invoices() {
  const download = (invoice) => {
    const content = `EkSaha\nInvoice: ${invoice.id}\nDate: ${invoice.date}\nAmount: ${invoice.amount}\nStatus: ${invoice.status}\n`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${invoice.id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`${invoice.id} downloaded.`);
  };
  return <div><h2 className="text-2xl font-bold">Billing history</h2><p className="mt-1 text-sm text-muted">View and download your EkSaha invoices.</p><div className="panel mt-7 overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-surface-raised text-xs uppercase text-muted"><tr><th className="p-5">Invoice</th><th>Date</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>{invoices.map(invoice => <tr className="border-t border-border" key={invoice.id}><td className="p-5 font-semibold">{invoice.id}</td><td>{invoice.date}</td><td>{invoice.amount}</td><td><span className="success-pill">{invoice.status}</span></td><td><button aria-label={`Download ${invoice.id}`} className="icon-button size-9 rounded-xl" onClick={() => download(invoice)}><Download size={17}/></button></td></tr>)}</tbody></table></div></div></div>;
}
