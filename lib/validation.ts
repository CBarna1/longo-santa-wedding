/**
 * Validates and normalises an RSVP request body.
 * Pure and dependency-free so it can be unit-tested with `node --test`.
 * Limits are mirrored by CHECK constraints in supabase/schema.sql.
 */

export const LIMITS = { name: 120, email: 254, text: 2000, maxGuests: 10 } as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Keys match the `rsvps_longo_santa` column names exactly. */
export interface RsvpInput {
  name: string;
  email: string;
  attending: boolean;
  guest_count: number;
  blessing: boolean;
  reception: boolean;
  dietary_restrictions: string | null;
  message: string | null;
}

export type ParseResult = { ok: true; data: RsvpInput } | { ok: false; error: string };

/** Trim a value to a string, or null if it is empty or not a string. */
function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

/**
 * Honeypot check: the form has a hidden "website" field that people never see,
 * so any value there means a bot filled it in.
 */
export function isSpam(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const website = (body as Record<string, unknown>).website;
  return typeof website === "string" && website.trim().length > 0;
}

export function parseRsvp(body: unknown): ParseResult {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid request body." };
  const b = body as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";

  if (!name) return { ok: false, error: "Please enter your name." };
  if (name.length > LIMITS.name) return { ok: false, error: "Name is too long." };
  if (!email || email.length > LIMITS.email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (typeof b.attending !== "boolean") {
    return { ok: false, error: "Please let us know if you can attend." };
  }
  const attending = b.attending;

  let guestCount = 1;
  let blessing = false;
  let reception = false;
  if (attending) {
    guestCount = b.guest_count === undefined ? 1 : Number(b.guest_count);
    if (b.guest_count === "" || !Number.isInteger(guestCount) || guestCount < 1 || guestCount > LIMITS.maxGuests) {
      return { ok: false, error: `Number of guests must be between 1 and ${LIMITS.maxGuests}.` };
    }
    blessing = b.blessing === true;
    reception = b.reception === true;
    if (!blessing && !reception) {
      return { ok: false, error: "Please choose at least one event to attend." };
    }
  }

  // Dietary notes only make sense for guests who are attending.
  const dietary = attending ? optionalText(b.dietary_restrictions) : null;
  const message = optionalText(b.message);
  if ((dietary?.length ?? 0) > LIMITS.text || (message?.length ?? 0) > LIMITS.text) {
    return { ok: false, error: `Please keep text fields under ${LIMITS.text} characters.` };
  }

  return {
    ok: true,
    data: {
      name,
      email,
      attending,
      guest_count: guestCount,
      blessing,
      reception,
      dietary_restrictions: dietary,
      message,
    },
  };
}
