import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { findDemoUserById, publicDemoUser } from "../lib/demo-users.js";

const isLocalMode = () => process.env.NODE_ENV !== "production";
const accessSecret = () => {
  if (process.env.JWT_ACCESS_SECRET) return process.env.JWT_ACCESS_SECRET;
  if (isLocalMode()) return "eksaha-local-access-secret";
  throw new Error("JWT access secret is not configured");
};

export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Authentication required" });
    const payload = jwt.verify(token, accessSecret());
    const demoUser = isLocalMode() ? findDemoUserById(payload.sub) : null;
    if (demoUser) {
      req.user = publicDemoUser(demoUser);
      return next();
    }

    req.user = await User.findById(payload.sub).select("-refreshTokens");
    if (!req.user) return res.status(401).json({ message: "Account not found" });
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired access token" });
  }
}

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) return res.status(403).json({ message: "Insufficient permissions" });
  next();
};
