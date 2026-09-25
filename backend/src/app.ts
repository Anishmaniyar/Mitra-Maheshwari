import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { pool } from "./config/database";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { requestLogger } from "./utils/logger";
import { authRouter } from "./modules/auth/auth.routes";
import { familyRouter } from "./modules/family/family.routes";
import { memberRouter } from "./modules/members/member.routes";
import { paymentRouter } from "./modules/payment/payment.routes";
import { statsRouter } from "./modules/stats/stats.routes";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL.split(",").map((s) => s.trim()),
    credentials: true,
  }),
);
app.use(requestLogger);

// Raw body for webhook signature verification — mounted before express.json so
// the HMAC is computed over the exact bytes the gateway signed.
app.use("/api/payments/webhook", express.raw({ type: "*/*" }));
app.use(express.json({ limit: "100kb" }));

// Health check with a lightweight database readiness probe (no internals exposed).
app.get("/health", async (_req, res) => {
  let db = "down";
  try {
    await pool.query("SELECT 1");
    db = "up";
  } catch {
    db = "down";
  }
  res.json({
    success: true,
    data: {
      status: db === "up" ? "ok" : "degraded",
      uptime: process.uptime(),
      db,
      timestamp: new Date().toISOString(),
    },
  });
});

app.use("/api", memberRouter);
app.use("/api/auth", authRouter);
app.use("/api/family", familyRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/stats", statsRouter);

app.use(notFoundHandler);
app.use(errorHandler);