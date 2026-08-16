import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { recordAuthActivity } from "./routes/auth-activity";
import { submitContactMessage } from "./routes/contact";
import { createPayment, getPaymentConfiguration } from "./routes/payments";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ verify: (req, _res, buffer) => { (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer); } }));
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/auth-activity", recordAuthActivity);
  app.post("/api/contact", submitContactMessage);
  app.get("/api/payments/configuration", getPaymentConfiguration);
  app.post("/api/payments/create", createPayment);

  return app;
}
