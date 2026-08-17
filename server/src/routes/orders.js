import express from "express";
import rateLimit from "express-rate-limit";
import Order from "../db/models/Order.js";
import { optionalUserAuth, requireUserAuth } from "../middleware/userAuth.js";

const router = express.Router();

const PHONE_RE = /^[+\d][\d\s()-]{6,20}$/;
const COMMENT_MAX = 500;
const MAX_ITEMS = 50;

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много заявок с этого адреса. Попробуйте позже." },
});

router.post("/", orderLimiter, optionalUserAuth, async (req, res) => {
  const { name, phone, comment, items, website } = req.body;

  // Honeypot: real users never fill this hidden field — bots that
  // auto-fill every input do. Pretend success so bots don't retry.
  if (website) {
    return res.status(200).json({ status: "sent" });
  }

  if (
    !name ||
    typeof name !== "string" ||
    !phone ||
    typeof phone !== "string" ||
    !PHONE_RE.test(phone.trim()) ||
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > MAX_ITEMS
  ) {
    return res.status(400).json({ error: "Проверьте имя, телефон и состав заявки" });
  }

  const safeName = name.trim().slice(0, 120);
  const safePhone = phone.trim().slice(0, 30);
  const safeComment = typeof comment === "string" ? comment.trim().slice(0, COMMENT_MAX) : "";
  // Clamp qty to a positive integer (1-999) — items.slice() alone left
  // whatever the client sent (including negative/NaN values) flowing
  // straight into the stored order and the Telegram notification.
  const safeItems = items.slice(0, MAX_ITEMS).map((item) => {
    const qty = Math.floor(Number(item?.qty));
    return {
      ...item,
      qty: Number.isFinite(qty) && qty > 0 ? Math.min(qty, 999) : 1,
    };
  });

  await Order.create({
    userId: req.userId || null,
    name: safeName,
    phone: safePhone,
    comment: safeComment,
    items: safeItems,
  });

  const lines = [
    "🛒 Новая заявка на заказ — nsp-club.ru",
    `Имя: ${safeName}`,
    `Телефон: ${safePhone}`,
    safeComment ? `Комментарий: ${safeComment}` : null,
    "",
    "Товары:",
    ...safeItems.map(
      (i) => `— ${String(i.name).slice(0, 200)} × ${Number(i.qty) || 1}${i.article ? ` (арт. ${String(i.article).slice(0, 30)})` : ""}`
    ),
  ].filter(Boolean);

  const text = lines.join("\n");

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const relayUrl = process.env.TG_RELAY_URL;
  const relaySecret = process.env.TG_RELAY_SECRET;

  if (!token || !chatId || !relayUrl || !relaySecret) {
    console.error("Order received but Telegram relay is not configured:", text);
    return res.status(200).json({ status: "received_no_notification" });
  }

  try {
    const relayResp = await fetch(relayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Relay-Secret": relaySecret,
      },
      body: JSON.stringify({ token, chatId, text }),
    });
    if (!relayResp.ok) throw new Error(`Relay responded ${relayResp.status}`);
    return res.status(200).json({ status: "sent" });
  } catch (error) {
    console.error("Telegram relay error:", error);
    return res.status(200).json({ status: "received_no_notification" });
  }
});

router.get("/mine", requireUserAuth, async (req, res) => {
  const orders = await Order.findAll({
    where: { userId: req.userId },
    order: [["createdAt", "DESC"]],
  });
  res.json(orders);
});

export default router;
