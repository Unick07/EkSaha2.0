import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, select: false },
  role: { type: String, enum: ["user", "admin", "support", "billing"], default: "user" },
  plan: { type: Schema.Types.ObjectId, ref: "Plan" },
  stripeCustomerId: String,
  refreshTokens: [{ tokenHash: String, expiresAt: Date }],
}, { timestamps: true });

const planSchema = new Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  features: [String],
  stripePriceId: String,
  active: { type: Boolean, default: true },
}, { timestamps: true });

const subscriptionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
  status: { type: String, enum: ["trialing", "active", "paused", "cancelled", "past_due"], default: "trialing" },
  billingCycle: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
  stripeSubscriptionId: String,
  startDate: Date,
  endDate: Date,
}, { timestamps: true });

const messageSchema = new Schema({
  senderId: { type: Schema.Types.ObjectId, ref: "User" },
  body: { type: String, required: true },
  attachments: [String],
}, { timestamps: true });

const ticketSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true },
  priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
  status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
  messages: [messageSchema],
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const invoiceSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "usd" },
  status: { type: String, enum: ["draft", "open", "paid", "void", "uncollectible"] },
  stripeInvoiceId: String,
  invoiceUrl: String,
}, { timestamps: true });

const blogPostSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: String,
  content: { type: String, required: true },
  category: String,
  tags: [String],
  published: { type: Boolean, default: false },
  authorId: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export const User = models.User || model("User", userSchema);
export const Plan = models.Plan || model("Plan", planSchema);
export const Subscription = models.Subscription || model("Subscription", subscriptionSchema);
export const Ticket = models.Ticket || model("Ticket", ticketSchema);
export const Invoice = models.Invoice || model("Invoice", invoiceSchema);
export const BlogPost = models.BlogPost || model("BlogPost", blogPostSchema);
