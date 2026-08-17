import express from "express";
import rateLimit from "express-rate-limit";
import crypto from "node:crypto";
import Order from "../db/models/Order.js";
import Product from "../db/models/Product.js";
import requireAdminAuth from "../middleware/adminAuth.js";
import { signAdminToken } from "../middleware/jwt.js";
import { escapeHtml, csvEscape } from "../utils/html.js";

const router = express.Router();
const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://nsp-club.ru";

// Plain === leaks how many leading characters matched via response timing.
// Hashing both sides to a fixed length first lets us use
// crypto.timingSafeEqual (which requires equal-length buffers) regardless
// of the actual credential lengths.
function timingSafeStringEqual(a, b) {
  const bufA = crypto.createHash("sha256").update(String(a)).digest();
  const bufB = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(bufA, bufB);
}

// Basic Auth used to be the whole gate; now a real JWT login guards /admin,
// so this just slows down password brute-forcing against /admin/login.
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Слишком много запросов, попробуйте позже.",
});

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 12 * 60 * 60 * 1000,
};

function filterOrders(orders, q, status) {
  let result = orders;
  if (status === "pending") result = result.filter((o) => !o.processed);
  if (status === "processed") result = result.filter((o) => o.processed);
  const needle = (q || "").toLowerCase().trim();
  if (needle) {
    result = result.filter((o) => {
      const hay = [o.name, o.phone, o.comment, ...(o.items || []).map((i) => i.name)]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }
  return result;
}

router.get("/login", adminLimiter, (req, res) => {
  const error = req.query.error ? "Неверный логин или пароль" : "";
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Вход — NSP Club admin</title>
<style>
  body { font-family: system-ui, sans-serif; background: #f7fafc; color: #1a202c; margin: 0; padding: 24px; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  form { background: white; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); width: 100%; max-width: 320px; }
  h1 { font-size: 18px; margin: 0 0 20px; }
  label { display: block; font-size: 13px; margin-bottom: 4px; color: #4a5568; }
  input { width: 100%; padding: 8px 10px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 14px; margin-bottom: 14px; box-sizing: border-box; }
  button { width: 100%; padding: 10px; border: none; background: #275820; color: white; border-radius: 4px; font-size: 14px; cursor: pointer; }
  .error { color: #c53030; font-size: 13px; margin-bottom: 12px; }
</style>
</head>
<body>
  <form method="POST" action="/admin/login">
    <h1>Вход в админ-панель</h1>
    ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
    <label>Логин</label>
    <input type="text" name="username" autoComplete="username" required>
    <label>Пароль</label>
    <input type="password" name="password" autoComplete="current-password" required>
    <button type="submit">Войти</button>
  </form>
</body>
</html>`);
});

router.post("/login", adminLimiter, (req, res) => {
  const { username, password } = req.body || {};
  const ok =
    typeof username === "string" &&
    typeof password === "string" &&
    timingSafeStringEqual(username, process.env.ADMIN_USERNAME || "") &&
    timingSafeStringEqual(password, process.env.ADMIN_PASSWORD || "");
  if (!ok) {
    return res.redirect("/admin/login?error=1");
  }
  res.cookie("admin_token", signAdminToken(), COOKIE_OPTS);
  res.redirect("/admin");
});

router.post("/logout", adminLimiter, (req, res) => {
  res.clearCookie("admin_token");
  res.redirect("/admin/login");
});

router.get("/", adminLimiter, requireAdminAuth, async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const status = ["pending", "processed"].includes(req.query.status) ? req.query.status : "all";
  const all = await Order.findAll({ order: [["createdAt", "DESC"]] });
  const filtered = filterOrders(all, q, status);
  const orders = filtered.slice(0, 300);
  const qs = new URLSearchParams({ ...(q ? { q } : {}), ...(status !== "all" ? { status } : {}) }).toString();

  const noPriceProducts = await Product.findAll({ where: { priceRetailUsd: null } });
  const noPriceRows = noPriceProducts
    .map(
      (p) => `<tr>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.article || "")}</td>
        <td><a href="${SITE_ORIGIN}/product/${escapeHtml(p.slug)}" target="_blank" rel="noopener">Открыть на сайте</a></td>
      </tr>`
    )
    .join("\n");

  const rows = orders
    .map(
      (o) => `<tr class="${o.processed ? "done" : ""}">
        <td>${escapeHtml(new Date(o.createdAt).toLocaleString("ru-RU"))}</td>
        <td>${escapeHtml(o.name)}</td>
        <td><a href="tel:${escapeHtml(o.phone)}">${escapeHtml(o.phone)}</a></td>
        <td>${escapeHtml(o.comment || "")}</td>
        <td>${(o.items || [])
          .map((i) => escapeHtml(`${i.name} × ${i.qty}${i.article ? ` (арт. ${i.article})` : ""}`))
          .join("<br>")}</td>
        <td>
          <form method="POST" action="/admin/toggle">
            <input type="hidden" name="id" value="${escapeHtml(o.id)}">
            <input type="hidden" name="q" value="${escapeHtml(q)}">
            <input type="hidden" name="status" value="${escapeHtml(status)}">
            <button type="submit" class="toggle-btn">${o.processed ? "Отменить" : "Обработано"}</button>
          </form>
        </td>
      </tr>`
    )
    .join("\n");

  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Заявки — NSP Club admin</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; background: #f7fafc; color: #1a202c; margin: 0; padding: 24px; }
  h1 { font-size: 20px; display: flex; justify-content: space-between; align-items: center; }
  .logout { font-size: 13px; font-weight: 400; color: #718096; text-decoration: none; }
  .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table { border-collapse: collapse; width: 100%; min-width: 640px; background: white; }
  th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; font-size: 14px; vertical-align: top; }
  th { background: #275820; color: white; position: sticky; top: 0; }
  tr:nth-child(even) { background: #f9fafb; }
  tr.done { opacity: 0.55; }
  .count { color: #4a5568; margin-bottom: 16px; }
  .toolbar { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
  .toolbar input, .toolbar select { padding: 6px 8px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 14px; }
  .toolbar button, .toggle-btn, .toolbar a.export { padding: 6px 12px; border: 1px solid #275820; background: #275820; color: white; border-radius: 4px; font-size: 13px; cursor: pointer; text-decoration: none; }
  tr.done .toggle-btn { background: white; color: #275820; }
  @media (max-width: 600px) {
    body { padding: 12px; }
    .toolbar { flex-direction: column; align-items: stretch; }
    .toolbar input, .toolbar select, .toolbar button, .toolbar a.export { width: 100%; text-align: center; }
    th, td { padding: 6px 8px; font-size: 13px; }
  }
</style>
</head>
<body>
  <h1>Заявки на заказ <form method="POST" action="/admin/logout" style="margin:0"><button type="submit" class="logout" style="background:none;border:none;cursor:pointer;padding:0">Выйти</button></form></h1>
  <form class="toolbar" method="GET" action="/admin">
    <input type="text" name="q" placeholder="Поиск по имени, телефону, товару..." value="${escapeHtml(q)}">
    <select name="status">
      <option value="all" ${status === "all" ? "selected" : ""}>Все</option>
      <option value="pending" ${status === "pending" ? "selected" : ""}>Не обработаны</option>
      <option value="processed" ${status === "processed" ? "selected" : ""}>Обработаны</option>
    </select>
    <button type="submit">Найти</button>
    <a class="export" href="/admin/export.csv${qs ? "?" + qs : ""}">Экспорт CSV</a>
  </form>
  <p class="count">Показано ${orders.length} из ${filtered.length} (всего заявок: ${all.length})</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Когда</th><th>Имя</th><th>Телефон</th><th>Комментарий</th><th>Товары</th><th>Статус</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6">Ничего не найдено</td></tr>'}</tbody>
    </table>
  </div>

  <details style="margin-top: 24px;">
    <summary style="cursor: pointer; font-weight: 600;">Товары без цены (${noPriceProducts.length})</summary>
    <div class="table-wrap" style="margin-top: 12px;">
    <table>
      <thead><tr><th>Название</th><th>Артикул</th><th>Ссылка</th></tr></thead>
      <tbody>${noPriceRows || '<tr><td colspan="3">Все товары с ценой</td></tr>'}</tbody>
    </table>
    </div>
  </details>
</body>
</html>`);
});

router.post("/toggle", adminLimiter, requireAdminAuth, async (req, res) => {
  const { id, q, status } = req.body || {};
  if (typeof id === "string" && id) {
    const order = await Order.findByPk(id);
    if (order) {
      order.processed = !order.processed;
      await order.save();
    }
  }
  const qs = new URLSearchParams({ ...(q ? { q } : {}), ...(status && status !== "all" ? { status } : {}) }).toString();
  res.redirect(`/admin${qs ? "?" + qs : ""}`);
});

router.get("/export.csv", adminLimiter, requireAdminAuth, async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const status = ["pending", "processed"].includes(req.query.status) ? req.query.status : "all";
  const all = await Order.findAll({ order: [["createdAt", "DESC"]] });
  const orders = filterOrders(all, q, status);
  const header = ["Дата", "Имя", "Телефон", "Комментарий", "Товары", "Статус"];
  const rows = orders.map((o) => [
    new Date(o.createdAt).toLocaleString("ru-RU"),
    o.name,
    o.phone,
    o.comment || "",
    (o.items || []).map((i) => `${i.name} x${i.qty}`).join("; "),
    o.processed ? "Обработано" : "Ожидает",
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n");
  res.set("Content-Type", "text/csv; charset=utf-8");
  res.set("Content-Disposition", `attachment; filename="orders-${Date.now()}.csv"`);
  res.send("﻿" + csv);
});

export default router;
