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

const FROM = process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || "Intervo <no-reply@intervo.io>";

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  if (!transporter) {
    console.log(`\n📧  [DEV] Verification code for ${to}: ${code}\n`);
    return;
  }

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Your Intervo verification code",
    text: `Your Intervo verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
          <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#7c3aed,#a855f7);"></div>
          <span style="font-size:20px;font-weight:700;color:#111;">Intervo</span>
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

export async function sendContactEmail(name: string, email: string, message: string): Promise<void> {
  const to = process.env.CONTACT_EMAIL || process.env.EMAIL_SERVER_USER;

  if (!transporter || !to) {
    console.log(`\n✉️  [DEV] Contact form submission:\nFrom: ${name} <${email}>\n${message}\n`);
    return;
  }

  await transporter.sendMail({
    from: FROM,
    to,
    replyTo: email,
    subject: `Intervo contact form — ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    html: `
      <div style="font-family:-apple-system,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="margin:0 0 12px;color:#111;">New contact message</h2>
        <p style="margin:0 0 4px;color:#555;"><strong>Name:</strong> ${name}</p>
        <p style="margin:0 0 12px;color:#555;"><strong>Email:</strong> ${email}</p>
        <div style="background:#f5f3ff;border-radius:12px;padding:16px;color:#333;white-space:pre-wrap;">${message
          .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
      </div>
    `,
  });
}

/** Generates a 6-digit numeric code. */
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendPasswordResetEmail(to: string, link: string): Promise<void> {
  if (!transporter) {
    console.log(`\n🔑  [DEV] Password reset link for ${to}:\n${link}\n`);
    return;
  }

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Reset your Intervo password",
    text: `Reset your Intervo password using this link (valid for 24 hours): ${link}`,
    html: `
      <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
          <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#7c3aed,#a855f7);"></div>
          <span style="font-size:20px;font-weight:700;color:#111;">Intervo</span>
        </div>
        <h1 style="font-size:20px;color:#111;margin:0 0 8px;">Reset your password</h1>
        <p style="color:#555;font-size:14px;margin:0 0 24px;">Click the button below to set a new password. This link is valid for 24 hours.</p>
        <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;">Reset password</a>
        <p style="color:#999;font-size:12px;margin:24px 0 0;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
        <p style="color:#bbb;font-size:11px;margin:12px 0 0;word-break:break-all;">${link}</p>
      </div>
    `,
  });
}
