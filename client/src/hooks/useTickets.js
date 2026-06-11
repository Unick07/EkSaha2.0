import { useState } from "react";

const seed = [
  { id: "NX-1048", subject: "DNS records for product launch", priority: "High", status: "In Progress", updated: "20 min ago" },
  { id: "NX-1031", subject: "GA4 conversion event setup", priority: "Medium", status: "Open", updated: "Yesterday" },
  { id: "NX-1012", subject: "New team member onboarding", priority: "Low", status: "Resolved", updated: "May 24" },
];

export function useTickets() {
  const [tickets, setTickets] = useState(seed);
  const createTicket = (ticket) => setTickets((items) => [{ id: `NX-${1050 + items.length}`, status: "Open", updated: "Just now", ...ticket }, ...items]);
  return { tickets, createTicket };
}
