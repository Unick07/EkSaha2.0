import { Globe2, Headphones, Search } from "lucide-react";

export const serviceItems = [
  { id: "seo", title: "Organic growth", type: "SEO", status: "Active", progress: 68, width: "w-2/3", icon: Search, tasks: ["Technical audit", "June content brief", "Backlink review"] },
  { id: "web", title: "Website care", type: "Web", status: "Active", progress: 42, width: "w-5/12", icon: Globe2, tasks: ["Core Web Vitals", "Landing page QA", "CMS updates"] },
  { id: "support", title: "Team help desk", type: "IT Support", status: "Active", progress: 81, width: "w-10/12", icon: Headphones, tasks: ["Device monitoring", "Access review", "Backup validation"] },
];

export const invoices = [
  { id: "INV-2048", date: "Jun 1, 2026", amount: "$999.00", status: "Paid" },
  { id: "INV-1992", date: "May 1, 2026", amount: "$999.00", status: "Paid" },
  { id: "INV-1928", date: "Apr 1, 2026", amount: "$999.00", status: "Paid" },
];
