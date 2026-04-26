import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type JwtUserPayload } from "../lib/jwt.js";

export type AuthedRequest = Request & { auth?: JwtUserPayload };

export function requireAuth(secret: string) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const header = req.header("authorization") || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1];
    if (!token) return res.status(401).json({ error: "missing_token" });

    try {
      req.auth = verifyAccessToken(token, secret);
      return next();
    } catch {
      return res.status(401).json({ error: "invalid_token" });
    }
  };
}

