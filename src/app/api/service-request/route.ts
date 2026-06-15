import { NextResponse } from "next/server";

type ServiceRequest = {
  name?: string;
  phone?: string;
  service?: string;
  message?: string;
};

function clean(value: unknown) {
  return String(value || "").trim();
}

function escapeTelegram(value: string) {
  return value.replace(/[<>&]/g, (char) => {
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    return "&amp;";
  });
}

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json({ error: "Telegram bot is not configured" }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as ServiceRequest;
  const name = clean(body.name);
  const phone = clean(body.phone);
  const service = clean(body.service);
  const message = clean(body.message);

  if (!name || !phone || !service) {
    return NextResponse.json({ error: "Заполните имя, телефон и услугу" }, { status: 400 });
  }

  const text = [
    "<b>Новая заявка Barakat Estate</b>",
    "",
    `<b>Услуга:</b> ${escapeTelegram(service)}`,
    `<b>Имя:</b> ${escapeTelegram(name)}`,
    `<b>Телефон:</b> ${escapeTelegram(phone)}`,
    message ? `<b>Комментарий:</b> ${escapeTelegram(message)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      parse_mode: "HTML",
      text,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Telegram send failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
