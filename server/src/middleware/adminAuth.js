import { verifyToken } from "./jwt.js";

export default function requireAdminAuth(req, res, next) {
  const token = req.cookies?.admin_token;
  const payload = token && verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return res.redirect("/admin/login");
  }
  next();
}
