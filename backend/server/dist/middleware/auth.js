import { verifyAccessToken } from "../lib/jwt.js";
export function requireAuth(secret) {
    return (req, res, next) => {
        const header = req.header("authorization") || "";
        const match = header.match(/^Bearer\s+(.+)$/i);
        const token = match?.[1];
        if (!token)
            return res.status(401).json({ error: "missing_token" });
        try {
            req.auth = verifyAccessToken(token, secret);
            return next();
        }
        catch {
            return res.status(401).json({ error: "invalid_token" });
        }
    };
}
