import "dotenv/config";
import fs from "node:fs";

const SITE_URL = "https://nsp-club.ru/api/v1/products";
const STATE_FILE = "/tmp/nsp-club-uptime-down";

async function notify(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const relayUrl = process.env.TG_RELAY_URL;
  const relaySecret = process.env.TG_RELAY_SECRET;
  if (!token || !chatId || !relayUrl || !relaySecret) return;
  try {
    await fetch(relayUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Relay-Secret": relaySecret },
      body: JSON.stringify({ token, chatId, text }),
    });
  } catch (err) {
    console.error("Uptime alert relay failed:", err);
  }
}

async function main() {
  let ok = false;
  try {
    const res = await fetch(SITE_URL, { signal: AbortSignal.timeout(10000) });
    ok = res.ok;
  } catch {
    ok = false;
  }

  const wasDown = fs.existsSync(STATE_FILE);

  if (!ok && !wasDown) {
    fs.writeFileSync(STATE_FILE, new Date().toISOString());
    await notify("⚠️ nsp-club.ru не отвечает (проверка /api/v1/products).");
  } else if (ok && wasDown) {
    fs.unlinkSync(STATE_FILE);
    await notify("✅ nsp-club.ru снова в порядке.");
  }
}

main();
