import jwt from "jsonwebtoken";
export function signAccessToken(payload, opts) {
    const secret = opts.secret;
    const options = { expiresIn: opts.expiresIn };
    return jwt.sign(payload, secret, options);
}
export function verifyAccessToken(token, secret) {
    return jwt.verify(token, secret);
}
