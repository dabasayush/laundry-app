import express, { type Application } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import type { RequestHandler } from "express";
import morgan from "morgan";
import { env } from "./config/env";
import { apiLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import router from "./routes";
import authRoutes from "./routes/auth.routes";

const app: Application = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGINS.split(",").map((o) => o.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(
  express.json({
    limit: "10kb",
    // Keep raw body for Stripe webhook signature verification
    verify: (req: express.Request & { rawBody?: Buffer }, _res, buf) => {
      if (req.originalUrl.startsWith("/api/v1/payments/webhook")) {
        req.rawBody = buf;
      }
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(compression() as unknown as RequestHandler);

// ── HTTP request logging ──────────────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use("/api/", apiLimiter);

// ── Root ──────────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ success: true, message: "Laundry API is running 🚀" });
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({
    status: "ok",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }),
);

// ── Auth shorthand (no version prefix) ──────────────────────────────────────
app.use("/auth", authRoutes);

// ── API routes (v1) ───────────────────────────────────────────────────────────
app.use("/api/v1", router);

// ── 404 / global error handler ────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
