import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

const FROM =
  process.env.EMAIL_FROM || process.env.MAIL_FROM || "no-reply@onresend.com";

if (!process.env.EMAIL_FROM && !process.env.MAIL_FROM) {
  console.warn(
    '[email] FROM fell back to "no-reply@onresend.com". Set EMAIL_FROM or MAIL_FROM in .env.'
  );
}

const APP_BASE_URL = (
  process.env.APP_BASE_URL || "http://localhost:5173"
).replace(/\/$/, "");

const IS_TEST = process.env.NODE_ENV === "test";

let resendClient = null;

function ensureResend() {
  if (IS_TEST) {
    throw new Error(
      "Email sending is disabled in test environment (NODE_ENV=test). " +
        "Run in development/production to send real emails."
    );
  }
  if (!RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY is missing. Set it in your environment to send emails via Resend."
    );
  }
  if (!resendClient) {
    resendClient = new Resend(RESEND_API_KEY);
  }
  return resendClient;
}

export function buildPasswordResetUrl(token) {
  return `${APP_BASE_URL}/reset/confirm?token=${encodeURIComponent(token)}`;
}

export async function sendPasswordResetEmail(to, resetUrl) {
  const client = ensureResend();

  const subject = "Сброс пароля";
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.45;">
      <h2 style="margin:0 0 12px;">Сброс пароля</h2>
      <p style="margin:0 0 12px;">Вы запросили сброс пароля. Нажмите кнопку ниже или перейдите по ссылке.</p>
      <p style="margin:0 0 12px;">
        <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;text-decoration:none;border:1px solid #d0d7de;border-radius:8px;">
          Сбросить пароль
        </a>
      </p>
      <p style="margin:0 0 12px;color:#6b7280;font-size:12px;word-break:break-all;">${resetUrl}</p>
      <p style="margin:0;color:#6b7280;font-size:12px;">Если вы не запрашивали сброс, просто проигнорируйте это письмо.</p>
    </div>
  `.trim();

  const { data, error } = await client.emails.send({
    from: FROM,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[email] Resend failed:", error);
    throw error;
  }

  console.log("[email] Resend sent id:", data?.id);
  return data;
}

export async function sendPasswordResetEmailByToken({ to, token }) {
  const url = buildPasswordResetUrl(token);
  return sendPasswordResetEmail(to, url);
}
