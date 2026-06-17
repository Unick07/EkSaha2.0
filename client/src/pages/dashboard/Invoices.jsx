import { Download } from "lucide-react";
import toast from "react-hot-toast";
import { invoices } from "./data";

export default function Invoices() {
  const download = (invoice) => {
    const content = `Nextexa Lab\nInvoice: ${invoice.id}\nDate: ${invoice.date}\nAmount: ${invoice.amount}\nStatus: ${invoice.status}\n`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${invoice.id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`${invoice.id} downloaded.`);
  };
  return <div><h2 className="text-2xl font-bold">Billing history</h2><p className="mt-1 text-sm text-slate-500">View and download your Nextexa invoices.</p><div className="panel mt-7 overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-white/5"><tr><th className="p-5">Invoice</th><th>Date</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>{invoices.map(invoice => <tr className="border-t border-slate-100 dark:border-white/10" key={invoice.id}><td className="p-5 font-semibold">{invoice.id}</td><td>{invoice.date}</td><td>{invoice.amount}</td><td><span className="text-xs font-bold text-emerald-600">{invoice.status}</span></td><td><button aria-label={`Download ${invoice.id}`} className="grid size-9 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10" onClick={() => download(invoice)}><Download size={17}/></button></td></tr>)}</tbody></table></div></div></div>;
}
