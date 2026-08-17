import express from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import User from "../db/models/User.js";
import { signUserToken } from "../middleware/jwt.js";
import { requireUserAuth } from "../middleware/userAuth.js";

const router = express.Router();

const PHONE_RE = /^[+\d][\d\s()-]{6,20}$/;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много попыток. Попробуйте позже." },
});

function publicUser(user) {
  return { id: user.id, name: user.name, phone: user.phone };
}

// Used to keep /login's response time the same whether the phone is
// registered or not — comparing against this dummy hash when no user is
// found costs roughly the same as a real bcrypt.compare, closing the
// timing side-channel that would otherwise let an attacker enumerate
// registered phone numbers.
const DUMMY_HASH = bcrypt.hashSync("no-such-user-timing-guard", 10);

router.post("/register", authLimiter, async (req, res) => {
  const { name, phone, password } = req.body || {};
  if (
    !name ||
    typeof name !== "string" ||
    name.trim().length < 2 ||
    !phone ||
    typeof phone !== "string" ||
    !PHONE_RE.test(phone.trim()) ||
    !password ||
    typeof password !== "string" ||
    password.length < 6
  ) {
    return res.status(400).json({ error: "Проверьте имя, телефон (мин. 6 симв.) и пароль (мин. 6 симв.)" });
  }

  const safePhone = phone.trim().slice(0, 30);
  const existing = await User.findOne({ where: { phone: safePhone } });
  if (existing) {
    return res.status(409).json({ error: "Аккаунт с этим телефоном уже существует" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  let user;
  try {
    user = await User.create({ name: name.trim().slice(0, 120), phone: safePhone, passwordHash });
  } catch (error) {
    // Two concurrent registrations for the same phone can both pass the
    // findOne check above before either commits — the unique constraint
    // on phone catches it here instead.
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Аккаунт с этим телефоном уже существует" });
    }
    throw error;
  }
  const token = signUserToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post("/login", authLimiter, async (req, res) => {
  const { phone, password } = req.body || {};
  if (!phone || typeof phone !== "string" || !password || typeof password !== "string") {
    return res.status(400).json({ error: "Укажите телефон и пароль" });
  }
  const user = await User.findOne({ where: { phone: phone.trim().slice(0, 30) } });
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) {
    return res.status(401).json({ error: "Неверный телефон или пароль" });
  }
  const token = signUserToken(user);
  res.json({ token, user: publicUser(user) });
});

router.get("/me", requireUserAuth, async (req, res) => {
  const user = await User.findByPk(req.userId);
  if (!user) return res.status(401).json({ error: "Аккаунт не найден" });
  res.json({ user: publicUser(user) });
});

export default router;
