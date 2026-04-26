import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserModel } from "../models/User.js";
import { signAccessToken } from "../lib/jwt.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export function authRouter(opts: { jwtSecret: string; jwtExpiresIn: string }) {
  const router = Router();

  const signUpSchema = z.object({
    email: z.string().trim().email().max(255),
    password: z.string().min(6).max(72),
    name: z.string().trim().min(1).max(80),
  });

  const signInSchema = z.object({
    email: z.string().trim().email().max(255),
    password: z.string().min(6).max(72),
  });

  router.post("/register", async (req, res) => {
    const parsed = signUpSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid_body", message: parsed.error.issues[0]?.message });

    const email = parsed.data.email.toLowerCase();
    const existing = await UserModel.findOne({ email }).lean();
    if (existing) return res.status(409).json({ error: "email_in_use" });

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await UserModel.create({ email, name: parsed.data.name, passwordHash });

    const token = signAccessToken({ sub: user._id.toString(), email: user.email, name: user.name }, { secret: opts.jwtSecret, expiresIn: opts.jwtExpiresIn });
    return res.json({ token, user: { id: user._id.toString(), email: user.email, name: user.name } });
  });

  router.post("/login", async (req, res) => {
    const parsed = signInSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid_body", message: parsed.error.issues[0]?.message });

    const email = parsed.data.email.toLowerCase();
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(401).json({ error: "invalid_credentials" });

    const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "invalid_credentials" });

    const token = signAccessToken({ sub: user._id.toString(), email: user.email, name: user.name }, { secret: opts.jwtSecret, expiresIn: opts.jwtExpiresIn });
    return res.json({ token, user: { id: user._id.toString(), email: user.email, name: user.name } });
  });

  router.get("/me", requireAuth(opts.jwtSecret), async (req: AuthedRequest, res) => {
    const userId = req.auth!.sub;
    const user = await UserModel.findById(userId).lean();
    if (!user) return res.status(401).json({ error: "invalid_token" });
    return res.json({ user: { id: user._id.toString(), email: user.email, name: user.name } });
  });

  return router;
}

