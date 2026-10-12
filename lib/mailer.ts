import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Gmail transport authenticated with a Google App Password.
 * Requires 2-Step Verification on the sending Google account.
 */
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variable.");
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    // App passwords are often copied with spaces ("abcd efgh ..."); strip them.
    auth: { user, pass: pass.replace(/\s+/g, "") },
  });
  return transporter;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/** Send a single HTML email from the wedding Gmail account. */
export async function sendMail({ to, subject, html, replyTo }: SendMailOptions) {
  return getTransporter().sendMail({
    from: `"Longo & Santa Wedding" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
    replyTo,
  });
}
