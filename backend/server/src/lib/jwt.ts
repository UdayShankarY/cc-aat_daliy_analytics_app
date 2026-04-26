import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

export type JwtUserPayload = {
  sub: string;
  email: string;
  name?: string;
};

export function signAccessToken(payload: JwtUserPayload, opts: { secret: string; expiresIn: string }) {
  const secret: Secret = opts.secret;
  const options: SignOptions = { expiresIn: opts.expiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, secret, options);
}

export function verifyAccessToken(token: string, secret: string): JwtUserPayload {
  return jwt.verify(token, secret as Secret) as JwtUserPayload;
}

