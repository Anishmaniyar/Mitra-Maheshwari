import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import * as paymentController from "./payment.controller";

export const paymentRouter = Router();

paymentRouter.get("/", requireAuth, paymentController.list);
paymentRouter.post("/create", requireAuth, paymentController.create);

// Public to the gateway. HMAC signature is verified inside the service.
// The raw body parser for this path is mounted in app.ts before express.json.
paymentRouter.post("/webhook", paymentController.webhook);