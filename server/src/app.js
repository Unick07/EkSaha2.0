import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import platformRoutes from "./routes/platform.routes.js";

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(
  "/api/auth",
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }),
  authRoutes,
);
app.use("/api", platformRoutes);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "demo",
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res
    .status(error.name === "ValidationError" ? 400 : 500)
    .json({ message: error.message || "Internal server error" });
});

export default app;
