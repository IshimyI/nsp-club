import { verifyToken } from "./jwt.js";

// Real login (POST /admin/login) issues this same JWT into an httpOnly
// cookie — this middleware just checks it's present, valid, and has the
// admin role. Replaces the earlier single-shared-password Basic Auth gate.
export default function requireAdminAuth(req, res, next) {
  const token = req.cookies?.admin_token;
  const payload = token && verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return res.redirect("/admin/login");
  }
  next();
}
