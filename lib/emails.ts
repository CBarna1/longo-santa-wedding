/**
 * HTML email templates (Sage Botanical theme).
 *
 * Inline CSS only: Gmail, Outlook and most other clients strip <style> tags.
 * Table-based layout for consistent rendering across clients.
 * All user-supplied values are HTML-escaped to prevent markup injection.
 */
import { CITY, COUPLE_FULL, DRESS_CODE, EVENTS, WEDDING_DATE_LABEL, WEDDING_DATE_SHORT, type EventKey } from "./event.ts";

const SAGE = "#7d9471";
const SAGE_LIGHT = "#cdd8c6";
const PAPER = "#f4f6f1";
const INK = "#2f3b2f";
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', Times, serif";
const SANS = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const COUPLE_HTML = COUPLE_FULL.replace("&", "&amp;");

/** Which events a guest chose. */
export type EventChoice = Record<EventKey, boolean>;

/** Escape characters that have meaning in HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape and keep the guest's line breaks. */
function multiline(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

/** Shared wrapper for the two guest-facing, serif-styled emails. */
function guestLayout(heading: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:${PAPER};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${PAPER};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border:1px solid ${SAGE_LIGHT};border-radius:12px;">
          <tr>
            <td align="center" style="padding:40px 32px 8px 32px;">
              <p style="margin:0;font-family:${SANS};font-size:12px;letter-spacing:4px;text-transform:uppercase;color:${SAGE};">${COUPLE_HTML}</p>
              <h1 style="margin:16px 0 0 0;font-family:${SERIF};font-size:30px;font-weight:normal;line-height:1.3;color:${INK};">${heading}</h1>
              <div style="width:48px;height:1px;background-color:${SAGE};margin:24px auto 0 auto;line-height:1px;font-size:1px;">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 40px 32px;font-family:${SERIF};font-size:18px;line-height:1.7;color:${INK};">
              ${body}
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0 0;font-family:${SANS};font-size:12px;letter-spacing:1px;color:#7a857a;">${WEDDING_DATE_LABEL} · ${CITY}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const signOff = `<p style="margin:24px 0 0 0;">With love,<br /><span style="font-size:24px;color:${SAGE};">${COUPLE_HTML}</span></p>`;

/** Confirmation for guests who accepted; lists only the events they chose. */
export function attendingEmail(
  name: string,
  guestCount: number,
  dietary: string | null | undefined,
  events: EventChoice
): string {
  const label = (text: string) =>
    `<td style="padding:8px 0;font-family:${SANS};font-size:13px;color:${SAGE};width:90px;vertical-align:top;font-weight:600;">${text}</td>`;
  const value = (html: string) =>
    `<td style="padding:8px 0;font-family:${SERIF};font-size:17px;color:${INK};vertical-align:top;">${html}</td>`;

  const eventRows = EVENTS.filter((e) => events[e.key])
    .map((e) => `<tr>${label(e.time)}${value(`<strong>${e.name}</strong><br />${e.venue}`)}</tr>`)
    .join("");
  const partyLabel = guestCount === 1 ? "1 guest" : `${guestCount} guests`;
  const dietaryRow = dietary ? `<tr>${label("Dietary")}${value(multiline(dietary))}</tr>` : "";

  return guestLayout(
    "We can't wait to celebrate with you!",
    `<p style="margin:0 0 16px 0;">Dear ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px 0;">Thank you so much for your RSVP. It means the world to us that you'll be with us on ${WEDDING_DATE_SHORT}. Here is what we have for you:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px 0;background-color:${PAPER};border-left:3px solid ${SAGE};border-radius:6px;">
      <tr><td style="padding:12px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${eventRows}
          <tr>${label("Party")}${value(partyLabel)}</tr>
          ${dietaryRow}
          <tr>${label("Dress")}${value(DRESS_CODE)}</tr>
        </table>
      </td></tr>
    </table>
    <p style="margin:0 0 16px 0;">If anything changes, just reply to this email and let us know.</p>
    ${signOff}`
  );
}

/** Confirmation for guests who declined. */
export function declinedEmail(name: string): string {
  return guestLayout(
    "We'll miss you!",
    `<p style="margin:0 0 16px 0;">Dear ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px 0;">Thank you for letting us know. We're sorry you can't join us, but we're so grateful you took the time to reply, and we'll be thinking of you on our big day.</p>
    <p style="margin:0 0 16px 0;">If your plans change, just reply to this email and we'll do our best to make room for you.</p>
    ${signOff}`
  );
}

export interface CoupleNotification {
  name: string;
  email: string;
  attending: boolean;
  guestCount: number;
  events: EventChoice;
  dietary?: string | null;
  message?: string | null;
}

/** Plain, scannable summary sent to the couple for each RSVP. */
export function notifyCoupleEmail({
  name,
  email,
  attending,
  guestCount,
  events,
  dietary,
  message,
}: CoupleNotification): string {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eeeeee;font-family:${SANS};font-size:14px;color:#777777;width:140px;vertical-align:top;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eeeeee;font-family:${SANS};font-size:14px;color:${INK};vertical-align:top;">${value}</td>
    </tr>`;
  const none = `<span style="color:#aaaaaa;">None</span>`;

  const status = attending
    ? `<span style="display:inline-block;padding:2px 10px;border-radius:999px;background-color:#e6efe2;color:#4d6343;font-weight:600;">Attending</span>`
    : `<span style="display:inline-block;padding:2px 10px;border-radius:999px;background-color:#f3e9e7;color:#9a5a50;font-weight:600;">Declined</span>`;

  const safeEmail = escapeHtml(email);
  const eventRows = attending
    ? EVENTS.map((e) => row(e.name, events[e.key] ? "✓ Yes" : "✗ No")).join("")
    : "";

  const rows = [
    row("Name", escapeHtml(name)),
    row("Email", `<a href="mailto:${safeEmail}" style="color:${SAGE};text-decoration:none;">${safeEmail}</a>`),
    row("Response", status),
    eventRows,
    attending ? row("Guests", String(guestCount)) : "",
    attending ? row("Dietary", dietary ? multiline(dietary) : none) : "",
    row("Message", message ? multiline(message) : none),
  ].join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;">
          <tr>
            <td style="padding:28px 28px 8px 28px;font-family:${SANS};">
              <p style="margin:0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${SAGE};font-weight:600;">New RSVP · ${COUPLE_HTML}</p>
              <h1 style="margin:6px 0 0 0;font-size:20px;font-weight:600;color:${INK};">${escapeHtml(name)} ${attending ? "is coming 🎉" : "can't make it"}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 28px 28px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
              <p style="margin:20px 0 0 0;font-family:${SANS};font-size:12px;color:#999999;">Reply to this email to respond directly to ${escapeHtml(name)}.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
