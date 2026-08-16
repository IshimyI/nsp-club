import { verifyToken } from "./jwt.js";

function extractPayload(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== "customer") return null;
  return payload;
}

// Rejects the request if there's no valid customer session.
export function requireUserAuth(req, res, next) {
  const payload = extractPayload(req);
  if (!payload) return res.status(401).json({ error: "Требуется вход в аккаунт" });
  req.userId = payload.sub;
  next();
}

// Attaches req.userId when a valid token is present, but never blocks the
// request — used on POST /api/v1/order so a logged-in customer's order gets
// linked to their account while guests can still order without one.
export function optionalUserAuth(req, res, next) {
  const payload = extractPayload(req);
  req.userId = payload?.sub || null;
  next();
}
