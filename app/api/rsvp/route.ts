import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { sendMail } from "@/lib/mailer";
import { isSpam, parseRsvp } from "@/lib/validation";
import { createRateLimiter } from "@/lib/rateLimit";
import { attendingEmail, declinedEmail, notifyCoupleEmail } from "@/lib/emails";
import { COUPLE, WEDDING_DATE_SHORT } from "@/lib/event";

// Nodemailer needs the Node.js runtime (not Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Separate table from the Ebenezer & Audrey site, in the same Supabase project. */
const TABLE = "rsvps_longo_santa";
const COUPLE_TEXT = `${COUPLE.first} & ${COUPLE.second}`;
const mark = (v: boolean) => (v ? "✓" : "✗");

// Each RSVP sends two emails from the shared Gmail (~500/day limit), so cap
// submissions per IP. Generous enough for a family sharing one Wi-Fi.
const allowRequest = createRateLimiter(10, 10 * 60_000);

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!allowRequest(ip)) {
    return NextResponse.json(
      { success: false, error: "Too many RSVPs from this connection. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON." }, { status: 400 });
  }

  // Bots fill the hidden honeypot field. Pretend success so they don't adapt,
  // but save nothing and send no email.
  if (isSpam(body)) {
    return NextResponse.json({ success: true });
  }

  const parsed = parseRsvp(body);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  }
  const rsvp = parsed.data;
  const events = { blessing: rsvp.blessing, reception: rsvp.reception };

  // 1. Save the RSVP. No `.select()` after insert: anon has no SELECT policy,
  //    so asking for the inserted row back would fail RLS.
  try {
    const { error } = await getSupabase().from(TABLE).insert(rsvp);
    if (error) {
      console.error("[rsvp] Supabase insert failed:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  } catch (err) {
    console.error("[rsvp] Supabase client error:", err);
    const message = err instanceof Error ? err.message : "Database error.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }

  // 2. Send emails. The RSVP is already saved, so failures are logged, not
  //    surfaced to the guest. Awaited because Vercel may freeze the function
  //    as soon as the response is returned.
  const guestMail = sendMail({
    to: rsvp.email,
    subject: rsvp.attending
      ? `You're on the list! ${COUPLE_TEXT} · ${WEDDING_DATE_SHORT}`
      : `Thank you for your RSVP · ${COUPLE_TEXT}`,
    html: rsvp.attending
      ? attendingEmail(rsvp.name, rsvp.guest_count, rsvp.dietary_restrictions, events)
      : declinedEmail(rsvp.name),
  });

  const coupleMail = sendMail({
    to: process.env.COUPLE_EMAIL || process.env.GMAIL_USER || "",
    subject: rsvp.attending
      ? `RSVP: ${rsvp.name} is attending (${rsvp.guest_count}) · Blessing ${mark(rsvp.blessing)} Reception ${mark(rsvp.reception)}`
      : `RSVP: ${rsvp.name} declined`,
    replyTo: rsvp.email,
    html: notifyCoupleEmail({
      name: rsvp.name,
      email: rsvp.email,
      attending: rsvp.attending,
      guestCount: rsvp.guest_count,
      events,
      dietary: rsvp.dietary_restrictions,
      message: rsvp.message,
    }),
  });

  const results = await Promise.allSettled([guestMail, coupleMail]);
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`[rsvp] Failed to send ${i === 0 ? "guest" : "couple"} email:`, result.reason);
    }
  });

  return NextResponse.json({ success: true });
}
