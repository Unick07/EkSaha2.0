import crypto from "node:crypto";

const developmentOnly = process.env.NODE_ENV !== "production";
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

const disposableAccessSecret = crypto.randomBytes(48).toString("hex");
const disposableRefreshSecret = crypto.randomBytes(48).toString("hex");

const accounts = [
  {
    id: "local-demo-user",
    name: "Local Demo User",
    email: "local.user@eksaha.test",
    password: "LocalUser!2026",
    role: "user",
    emailVerified: true,
    demo: true,
  },
  {
    id: "local-demo-admin",
    name: "Local Demo Admin",
    email: "local.admin@eksaha.test",
    password: "LocalAdmin!2026",
    role: "admin",
    emailVerified: true,
    demo: true,
  },
];

export const localDemoEnabled = (req) => developmentOnly && localHosts.has(req.hostname);
export const localDemoAccountByEmail = (email) => accounts.find((account) => account.email === email?.toLowerCase());
export const localDemoAccountById = (id) => accounts.find((account) => account.id === id);
export const publicLocalDemoAccount = ({ password: _password, ...account }) => account;

export const accessJwtSecret = () => process.env.JWT_ACCESS_SECRET || (developmentOnly ? disposableAccessSecret : undefined);
export const refreshJwtSecret = () => process.env.JWT_REFRESH_SECRET || (developmentOnly ? disposableRefreshSecret : undefined);

