import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { findDemoUser, findDemoUserById, publicDemoUser } from "../lib/demo-users.js";

const authRouter = Router();
const isLocalMode = () => process.env.NODE_ENV !== "production";
const secret = (value, fallback) => {
  if (value) return value;
  if (isLocalMode()) return fallback;
  throw new Error("JWT secret is not configured");
};
const accessSecret = () => secret(process.env.JWT_ACCESS_SECRET, "eksaha-local-access-secret");
const refreshSecret = () => secret(process.env.JWT_REFRESH_SECRET, "eksaha-local-refresh-secret");
const accessToken = (user) => jwt.sign({ sub: user.id, role: user.role }, accessSecret(), { expiresIn: "15m" });
const refreshToken = (user) => jwt.sign({ sub: user.id, type: "refresh" }, refreshSecret(), { expiresIn: "30d" });
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 30 * 24 * 60 * 60 * 1000 };

authRouter.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 8) return res.status(400).json({ message: "Valid name, email and password are required" });
    if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ message: "Email already registered" });
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    const refresh = refreshToken(user);
    user.refreshTokens.push({ tokenHash: crypto.createHash("sha256").update(refresh).digest("hex"), expiresAt: new Date(Date.now() + cookieOptions.maxAge) });
    await user.save();
    res.cookie("refreshToken", refresh, cookieOptions).status(201).json({ accessToken: accessToken(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { next(error); }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const demoUser = isLocalMode() ? findDemoUser(req.body.email, req.body.password || "") : null;
    if (demoUser) {
      const refresh = refreshToken(demoUser);
      return res.cookie("refreshToken", refresh, cookieOptions).json({ accessToken: accessToken(demoUser), user: publicDemoUser(demoUser) });
    }

    const user = await User.findOne({ email: req.body.email?.toLowerCase() }).select("+passwordHash");
    if (!user || !await bcrypt.compare(req.body.password || "", user.passwordHash || "")) return res.status(401).json({ message: "Invalid email or password" });
    const refresh = refreshToken(user);
    user.refreshTokens.push({ tokenHash: crypto.createHash("sha256").update(refresh).digest("hex"), expiresAt: new Date(Date.now() + cookieOptions.maxAge) });
    await user.save();
    res.cookie("refreshToken", refresh, cookieOptions).json({ accessToken: accessToken(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { next(error); }
});

authRouter.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    const payload = jwt.verify(token, refreshSecret());
    const demoUser = isLocalMode() ? findDemoUserById(payload.sub) : null;
    if (demoUser) return res.json({ accessToken: accessToken(demoUser) });

    const user = await User.findById(payload.sub);
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    if (!user?.refreshTokens.some(item => item.tokenHash === hash && item.expiresAt > new Date())) throw new Error();
    res.json({ accessToken: accessToken(user) });
  } catch { res.status(401).json({ message: "Refresh token invalid" }); }
});

authRouter.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Authentication required" });
    const payload = jwt.verify(token, accessSecret());
    const demoUser = isLocalMode() ? findDemoUserById(payload.sub) : null;
    if (demoUser) return res.json(publicDemoUser(demoUser));

    const user = await User.findById(payload.sub).select("-refreshTokens");
    if (!user) return res.status(401).json({ message: "Account not found" });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch {
    res.status(401).json({ message: "Invalid or expired access token" });
  }
});

authRouter.post("/logout", async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) await User.updateOne({ "refreshTokens.tokenHash": crypto.createHash("sha256").update(token).digest("hex") }, { $pull: { refreshTokens: { tokenHash: crypto.createHash("sha256").update(token).digest("hex") } } });
  res.clearCookie("refreshToken").status(204).end();
});

export default authRouter;
