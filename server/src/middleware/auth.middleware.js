import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Authentication required" });
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
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
