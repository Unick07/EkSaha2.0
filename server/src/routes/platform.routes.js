import { Router } from "express";
import { BlogPost, Invoice, Plan, Subscription, Ticket, User } from "../models/index.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { demoUsers, publicDemoUser } from "../lib/demo-users.js";

const platformRouter = Router();
const isLocalDemoUser = (user) => process.env.NODE_ENV !== "production" && String(user?.id || "").startsWith("demo-");
const demoRows = demoUsers.map((user) => ({
  ...publicDemoUser(user),
  plan: user.role === "user" ? "Growth" : null,
  createdAt: "2026-07-20T00:00:00.000Z",
  updatedAt: "2026-07-20T00:00:00.000Z",
}));

function filterDemoUsers(roles) {
  const roleList = String(roles || "")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
  return roleList.length ? demoRows.filter((user) => roleList.includes(user.role)) : demoRows;
}

platformRouter.get("/plans", async (_req, res, next) => { try { res.json(await Plan.find({ active: true })); } catch (e) { next(e); } });
platformRouter.get("/posts", async (_req, res, next) => { try { res.json(await BlogPost.find({ published: true }).sort({ createdAt: -1 })); } catch (e) { next(e); } });

platformRouter.use(authenticate);
platformRouter.get("/me", (req, res) => res.json(req.user));
platformRouter.get("/subscriptions/me", async (req, res, next) => { try { res.json(await Subscription.findOne({ userId: req.user.id }).populate("planId")); } catch (e) { next(e); } });
platformRouter.get("/invoices/me", async (req, res, next) => { try { res.json(await Invoice.find({ userId: req.user.id }).sort({ createdAt: -1 })); } catch (e) { next(e); } });
platformRouter.get("/tickets", async (req, res, next) => { try { const query = req.user.role === "user" ? { userId: req.user.id } : {}; res.json(await Ticket.find(query).populate("userId assignedTo", "name email").sort({ updatedAt: -1 })); } catch (e) { next(e); } });
platformRouter.post("/tickets", async (req, res, next) => { try { res.status(201).json(await Ticket.create({ ...req.body, userId: req.user.id, messages: [{ senderId: req.user.id, body: req.body.message }] })); } catch (e) { next(e); } });
platformRouter.post("/tickets/:id/messages", async (req, res, next) => { try { const ticket = await Ticket.findByIdAndUpdate(req.params.id, { $push: { messages: { senderId: req.user.id, body: req.body.body } } }, { new: true }); res.json(ticket); } catch (e) { next(e); } });

platformRouter.use(authorize("admin", "support", "billing"));
platformRouter.get("/admin/users", async (req, res, next) => {
  if (isLocalDemoUser(req.user)) return res.json(filterDemoUsers(req.query.roles));
  try { res.json(await User.find().populate("plan", "name").sort({ createdAt: -1 })); } catch (e) { next(e); }
});
platformRouter.patch("/admin/users/:id", async (req, res, next) => { try { res.json(await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })); } catch (e) { next(e); } });
platformRouter.get("/admin/subscriptions", async (_req, res, next) => { try { res.json(await Subscription.find().populate("userId planId").sort({ createdAt: -1 })); } catch (e) { next(e); } });
platformRouter.patch("/admin/tickets/:id", async (req, res, next) => { try { res.json(await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })); } catch (e) { next(e); } });
platformRouter.post("/admin/posts", async (req, res, next) => { try { res.status(201).json(await BlogPost.create({ ...req.body, authorId: req.user.id })); } catch (e) { next(e); } });

export default platformRouter;
