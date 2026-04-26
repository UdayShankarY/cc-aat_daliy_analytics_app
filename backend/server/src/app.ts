import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/auth.js";
import { entriesRouter } from "./routes/entries.js";
import type { Env } from "./lib/env.js";

export function createApp(env: Env) {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/auth", authRouter({ jwtSecret: env.JWT_SECRET, jwtExpiresIn: env.JWT_EXPIRES_IN }));
  app.use("/entries", entriesRouter({ jwtSecret: env.JWT_SECRET }));

  app.use((req, res) => res.status(404).json({ error: "not_found", path: req.path }));

  return app;
}

