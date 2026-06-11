import { Router } from "express";
import { BlogPost, Invoice, Plan, Subscription, Ticket, User } from "../models/index.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/plans", async (_req, res, next) => { try { res.json(await Plan.find({ active: true })); } catch (e) { next(e); } });
router.get("/posts", async (_req, res, next) => { try { res.json(await BlogPost.find({ published: true }).sort({ createdAt: -1 })); } catch (e) { next(e); } });

router.use(authenticate);
router.get("/me", (req, res) => res.json(req.user));
router.get("/subscriptions/me", async (req, res, next) => { try { res.json(await Subscription.findOne({ userId: req.user.id }).populate("planId")); } catch (e) { next(e); } });
router.get("/invoices/me", async (req, res, next) => { try { res.json(await Invoice.find({ userId: req.user.id }).sort({ createdAt: -1 })); } catch (e) { next(e); } });
router.get("/tickets", async (req, res, next) => { try { const query = req.user.role === "user" ? { userId: req.user.id } : {}; res.json(await Ticket.find(query).populate("userId assignedTo", "name email").sort({ updatedAt: -1 })); } catch (e) { next(e); } });
router.post("/tickets", async (req, res, next) => { try { res.status(201).json(await Ticket.create({ ...req.body, userId: req.user.id, messages: [{ senderId: req.user.id, body: req.body.message }] })); } catch (e) { next(e); } });
router.post("/tickets/:id/messages", async (req, res, next) => { try { const ticket = await Ticket.findByIdAndUpdate(req.params.id, { $push: { messages: { senderId: req.user.id, body: req.body.body } } }, { new: true }); res.json(ticket); } catch (e) { next(e); } });

router.use(authorize("admin", "support", "billing"));
router.get("/admin/users", async (_req, res, next) => { try { res.json(await User.find().populate("plan", "name").sort({ createdAt: -1 })); } catch (e) { next(e); } });
router.patch("/admin/users/:id", async (req, res, next) => { try { res.json(await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })); } catch (e) { next(e); } });
router.get("/admin/subscriptions", async (_req, res, next) => { try { res.json(await Subscription.find().populate("userId planId").sort({ createdAt: -1 })); } catch (e) { next(e); } });
router.patch("/admin/tickets/:id", async (req, res, next) => { try { res.json(await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })); } catch (e) { next(e); } });
router.post("/admin/posts", async (req, res, next) => { try { res.status(201).json(await BlogPost.create({ ...req.body, authorId: req.user.id })); } catch (e) { next(e); } });

export default router;
