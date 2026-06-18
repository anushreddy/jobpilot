import nodemailer from "nodemailer";

/**
 * Email sender. Uses Gmail SMTP when EMAIL_SERVER_USER / EMAIL_SERVER_PASSWORD
 * are set (use a Gmail App Password, not your account password). If they are
 * not configured (e.g. local dev), the code is logged to the console instead
 * so the flow remains testable without real email delivery.
 */
const hasSmtp = Boolean(process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD);

const transporter = hasSmtp
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })
  : null;

const FROM = process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || "JobPilot <no-reply@jobpilot.app>";

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  if (!transporter) {
    console.log(`\n📧  [DEV] Verification code for ${to}: ${code}\n`);
    return;
  }

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Your JobPilot verification code",
    text: `Your JobPilot verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
          <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#7c3aed,#a855f7);"></div>
          <span style="font-size:20px;font-weight:700;color:#111;">JobPilot</span>
        </div>
        <h1 style="font-size:20px;color:#111;margin:0 0 8px;">Verify your email</h1>
        <p style="color:#555;font-size:14px;margin:0 0 24px;">Enter this code to finish creating your account:</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#7c3aed;background:#f5f3ff;border-radius:12px;padding:16px;text-align:center;">
          ${code}
        </div>
        <p style="color:#999;font-size:12px;margin:24px 0 0;">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
      </div>
    `,
  });
}

/** Generates a 6-digit numeric code. */
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
