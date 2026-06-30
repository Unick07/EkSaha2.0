import { Router } from "express";

const demoTicketRouter = Router();

const tickets = [
  { id: "NX-1048", subject: "DNS records for launch", user: "Maya Chen", priority: "High", status: "In Progress", assignee: "Amelia", source: "Seed" },
  { id: "NX-1046", subject: "Facebook pixel issue", user: "Leo Martin", priority: "Critical", status: "Open", assignee: "Unassigned", source: "Seed" },
  { id: "NX-1042", subject: "New user onboarding", user: "Sara Kim", priority: "Low", status: "Resolved", assignee: "Noah", source: "Seed" },
];

demoTicketRouter.get("/tickets", (_req, res) => {
  res.json(tickets);
});

demoTicketRouter.post("/tickets", (req, res) => {
  const ticket = {
    id: req.body.id || `NX-${Date.now().toString().slice(-5)}`,
    subject: req.body.subject || "Untitled support request",
    user: req.body.user || "Jordan Lee",
    priority: req.body.priority || "Medium",
    status: "Open",
    assignee: "Unassigned",
    source: "User dashboard",
    createdAt: "Just now",
    message: req.body.message || "",
  };

  tickets.unshift(ticket);
  res.status(201).json(ticket);
});

demoTicketRouter.patch("/tickets/:id", (req, res) => {
  const index = tickets.findIndex((ticket) => ticket.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Ticket not found" });

  tickets[index] = { ...tickets[index], ...req.body };
  res.json(tickets[index]);
});

export default demoTicketRouter;
