# Longo & Santa Wedding Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Sage Botanical wedding invitation + two-event RSVP site for Longo & Santa, copied from the Ebenezer & Audrey project, saving to a new Supabase table and emailing through the shared Gmail.

**Architecture:** Next.js App Router site. Pure logic (event constants, countdown math, RSVP validation, email HTML) lives in small dependency-free `lib/*.ts` modules that are unit-tested with Node's built-in test runner; the API route and React components are thin layers over them, verified with curl and headless Chrome.

**Tech Stack:** Next.js 15 (App Router, TypeScript), React 19, Tailwind CSS 3.4, @supabase/supabase-js 2, Nodemailer 7 (Gmail + App Password), Node 24 `node --test` (native TypeScript), playwright-core + system Chrome for browser checks, Vercel.

**Spec:** `docs/superpowers/specs/2026-10-12-longo-santa-wedding-design.md`

## Global Constraints

- Project root: `C:\Users\Kelson Sales\Desktop\longo-santa-wedding` (git repo already initialised; spec committed). Source project: `C:\Users\Kelson Sales\Desktop\Wedding`. Never modify the source project.
- Couple text: "Longo & Santa" (that order). Date: Saturday, 19 December 2026. Church Blessing 9:00 AM, Central PAOG, Kitwe. Reception 3:00 PM, CABU Main Hall. Dress code: "Formal attire". Footer: "L & S · 19.12.2026".
- Countdown target: `2026-12-19T09:00:00+02:00` (Africa/Lusaka).
- Palette: sage `#7d9471`, sage-light `#cdd8c6`, background `#f4f6f1`, ink `#2f3b2f`. Fonts: Cormorant Garamond (headings), Josefin Sans (body).
- Supabase table: `rsvps_longo_santa`. RLS on, one INSERT policy for `anon` with `WITH CHECK (true)`, no SELECT policy.
- Env vars (unchanged names): `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `COUPLE_EMAIL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Only the publishable key; never `sb_secret_...`; no `NEXT_PUBLIC_` prefix.
- Email sender: `"Longo & Santa Wedding" <GMAIL_USER>`. Emails use inline CSS only; all user input HTML-escaped.
- Modules imported by tests (`lib/event.ts`, `lib/countdown.ts`, `lib/validation.ts`, `lib/emails.ts`) must import each other with explicit `.ts` extensions and use `type` modifiers on type-only imports (Node type-stripping requirement).
- `.env.local` and `.superpowers/` are never committed.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Guest accepts but unticks both events: form refuses to submit with a clear message, API returns 400, DB constraint rejects it (Task 2 test + Task 4 curl + Task 5 browser check).
2. Guest declines but a crafted request sends `blessing: true`: stored as both `false`, guest_count 1, dietary null (Task 2 test).
3. Name/message containing HTML (`<script>`, `<b>`): rendered as text in all three emails (Task 3 test).
4. Visitor in another time zone, or visiting on/after the wedding: countdown is computed from an absolute instant and switches to "Just married!" at/after 07:00 UTC 19 Dec 2026 (Task 1 tests).
5. `guest_count` arrives as a string (`"3"`) or a non-integer (`"2.5"`, `""`): string integers accepted, others rejected with a 400 (Task 2 tests).

---

## File Map

| File | Responsibility |
| --- | --- |
| `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `.gitignore`, `.env.example` | Project config |
| `lib/event.ts` | Single source of truth for couple, date, events, dress code |
| `lib/countdown.ts` | Pure `getTimeLeft(targetMs, nowMs)` |
| `lib/validation.ts` | Pure `parseRsvp(body)`, request validation/normalisation |
| `lib/emails.ts` | Pure HTML email templates |
| `lib/supabase.ts`, `lib/mailer.ts` | Server-only clients (copied; mailer sender renamed) |
| `app/api/rsvp/route.ts` | POST handler: parse → insert → emails |
| `app/components/Leaves.tsx` | Decorative SVGs (`LeafArch`, `Sprig`) |
| `app/components/Countdown.tsx` | Client countdown display |
| `app/components/RSVPForm.tsx` | Client RSVP form |
| `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `app/icon.svg` | Page shell + content |
| `supabase/schema.sql` | Table, constraints, RLS |
| `tests/*.test.ts` | Unit tests for the four pure modules |
| `README.md` | Setup + deploy instructions |

---

### Task 1: Scaffold project, event constants and countdown logic

**Files:**
- Copy from source: `next.config.mjs`, `postcss.config.mjs`, `package-lock.json`, `lib/supabase.ts`, `lib/mailer.ts`, `.env.local`
- Create: `package.json`, `tsconfig.json`, `.gitignore`, `.env.example`, `lib/event.ts`, `lib/countdown.ts`, `tests/countdown.test.ts`
- Modify: `lib/mailer.ts` (sender name)

**Interfaces:**
- Produces: `lib/event.ts` exports `COUPLE`, `WEDDING_DATE_LABEL`, `WEDDING_DATE_SHORT`, `WEDDING_DATE_NUMERIC`, `CITY`, `DRESS_CODE`, `WEDDING_START_ISO`, `type EventKey = "blessing" | "reception"`, `interface WeddingEvent`, `EVENTS: readonly WeddingEvent[]`.
- Produces: `lib/countdown.ts` exports `interface TimeLeft { days; hours; minutes; done }` and `getTimeLeft(targetMs: number, nowMs: number): TimeLeft`.
- Produces: `sendMail({ to, subject, html, replyTo? })` (unchanged from source), `getSupabase()` (unchanged).

- [ ] **Step 1: Copy reusable files from the source project**

```bash
SRC="/c/Users/Kelson Sales/Desktop/Wedding"; DST="/c/Users/Kelson Sales/Desktop/longo-santa-wedding"
mkdir -p "$DST/lib" "$DST/tests" "$DST/app/api/rsvp" "$DST/app/components" "$DST/supabase"
cp "$SRC/next.config.mjs" "$SRC/postcss.config.mjs" "$SRC/package-lock.json" "$SRC/.env.local" "$DST/"
cp "$SRC/lib/supabase.ts" "$SRC/lib/mailer.ts" "$DST/lib/"
sed -i 's/"Ebenezer & Audrey Wedding"/"Longo \& Santa Wedding"/' "$DST/lib/mailer.ts"
grep -n "Wedding\" <" "$DST/lib/mailer.ts"
```

Expected last line: `    from: \`"Longo & Santa Wedding" <${process.env.GMAIL_USER}>\`,`

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "longo-santa-wedding",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "node --test \"tests/*.test.ts\""
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.58.0",
    "next": "^15.5.4",
    "nodemailer": "^7.0.6",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "server-only": "^0.0.1"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "@types/nodemailer": "^7.0.1",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 3: Write `tsconfig.json`** (same as source plus `allowImportingTsExtensions`)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Write `.gitignore` and `.env.example`**

`.gitignore`:
```
node_modules
.next
out
.vercel
*.tsbuildinfo
next-env.d.ts
.env*.local
.env
npm-debug.log*
.DS_Store
.superpowers/
```

`.env.example`:
```
# Gmail account that sends the emails (must have 2-Step Verification enabled)
GMAIL_USER=ourwedding2026@gmail.com
# 16-character Google App Password (no spaces)
GMAIL_APP_PASSWORD=abcdefghijklmnop
# Where RSVP notifications go
COUPLE_EMAIL=ourwedding2026@gmail.com

# Supabase project URL + PUBLISHABLE key only. Never put sb_secret_... here.
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_xxxxx
```

- [ ] **Step 5: Install dependencies**

Run: `cd "/c/Users/Kelson Sales/Desktop/longo-santa-wedding" && npm install --no-fund --no-audit`
Expected: completes without errors; `package-lock.json` name updates to `longo-santa-wedding`.

- [ ] **Step 6: Write `lib/event.ts`**

```ts
/**
 * Single source of truth for the wedding details.
 * Used by the page, the countdown, the RSVP validation and the emails.
 * Dependency-free so it can be imported directly by `node --test`.
 */

export const COUPLE = { first: "Longo", second: "Santa", initials: "L & S" } as const;

export const WEDDING_DATE_LABEL = "Saturday · 19 December 2026";
export const WEDDING_DATE_SHORT = "19 December 2026";
export const WEDDING_DATE_NUMERIC = "19.12.2026";
export const CITY = "Kitwe";
export const DRESS_CODE = "Formal attire";

/** Countdown target: start of the Church Blessing, Zambia time (UTC+2, no DST). */
export const WEDDING_START_ISO = "2026-12-19T09:00:00+02:00";

export type EventKey = "blessing" | "reception";

export interface WeddingEvent {
  key: EventKey;
  name: string;
  time: string;
  venue: string;
}

export const EVENTS: readonly WeddingEvent[] = [
  { key: "blessing", name: "Church Blessing", time: "9:00 AM", venue: "Central PAOG, Kitwe" },
  { key: "reception", name: "Reception", time: "3:00 PM", venue: "CABU Main Hall" },
];
```

- [ ] **Step 7: Write the failing countdown test `tests/countdown.test.ts`**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { getTimeLeft } from "../lib/countdown.ts";
import { WEDDING_START_ISO } from "../lib/event.ts";

const target = Date.parse(WEDDING_START_ISO);
const MIN = 60_000;

test("target is 07:00 UTC on 19 Dec 2026 regardless of viewer time zone", () => {
  assert.equal(new Date(target).toISOString(), "2026-12-19T07:00:00.000Z");
});

test("splits remaining time into days, hours and minutes", () => {
  const now = target - ((2 * 24 + 3) * 60 + 4) * MIN;
  assert.deepEqual(getTimeLeft(target, now), { days: 2, hours: 3, minutes: 4, done: false });
});

test("a partial minute rounds up so it never shows 0m while time remains", () => {
  assert.deepEqual(getTimeLeft(target, target - 30_000), { days: 0, hours: 0, minutes: 1, done: false });
});

test("exactly at the target it is done", () => {
  assert.deepEqual(getTimeLeft(target, target), { days: 0, hours: 0, minutes: 0, done: true });
});

test("after the target it stays done", () => {
  assert.equal(getTimeLeft(target, target + 5 * 24 * 60 * MIN).done, true);
});
```

- [ ] **Step 8: Run test to verify it fails**

Run: `npm test`
Expected: FAIL, `Cannot find module '.../lib/countdown.ts'`.

- [ ] **Step 9: Write `lib/countdown.ts`**

```ts
/** Remaining time until a target instant, for the countdown display. */
export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  done: boolean;
}

/**
 * Pure so it can be unit-tested with fixed timestamps.
 * Partial minutes round up, so the display never reads "0 minutes" early.
 */
export function getTimeLeft(targetMs: number, nowMs: number): TimeLeft {
  const diff = targetMs - nowMs;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, done: true };

  const totalMinutes = Math.ceil(diff / 60_000);
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
    done: false,
  };
}
```

- [ ] **Step 10: Run tests to verify they pass**

Run: `npm test`
Expected: `pass 5`, `fail 0`.

- [ ] **Step 11: Commit**

```bash
git add .gitignore .env.example package.json package-lock.json tsconfig.json next.config.mjs postcss.config.mjs lib/event.ts lib/countdown.ts lib/supabase.ts lib/mailer.ts tests/countdown.test.ts
git status --short | grep -F ".env.local" && echo "STOP: .env.local staged" || true
git commit -m "Scaffold Longo & Santa site with event constants and countdown logic

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: RSVP validation

**Files:**
- Create: `lib/validation.ts`, `tests/validation.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `LIMITS`, `interface RsvpInput { name: string; email: string; attending: boolean; guest_count: number; blessing: boolean; reception: boolean; dietary_restrictions: string | null; message: string | null }`, `type ParseResult = { ok: true; data: RsvpInput } | { ok: false; error: string }`, `parseRsvp(body: unknown): ParseResult`. `RsvpInput` keys equal DB column names.

- [ ] **Step 1: Write the failing test `tests/validation.test.ts`**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRsvp } from "../lib/validation.ts";

const base = {
  name: "  Jane Banda ",
  email: " Jane@Example.COM ",
  attending: true,
  guest_count: 2,
  blessing: true,
  reception: true,
  dietary_restrictions: " Vegetarian ",
  message: "",
};

function ok(body: unknown) {
  const r = parseRsvp(body);
  assert.equal(r.ok, true, r.ok ? "" : r.error);
  return (r as { ok: true; data: any }).data;
}
function err(body: unknown) {
  const r = parseRsvp(body);
  assert.equal(r.ok, false);
  return (r as { ok: false; error: string }).error;
}

test("accepts a valid attending RSVP and normalises fields", () => {
  assert.deepEqual(ok(base), {
    name: "Jane Banda",
    email: "jane@example.com",
    attending: true,
    guest_count: 2,
    blessing: true,
    reception: true,
    dietary_restrictions: "Vegetarian",
    message: null,
  });
});

test("rejects non-object bodies", () => {
  assert.match(err(null), /invalid/i);
  assert.match(err("hello"), /invalid/i);
});

test("requires name and a valid email", () => {
  assert.match(err({ ...base, name: "   " }), /name/i);
  assert.match(err({ ...base, email: "not-an-email" }), /email/i);
});

test("requires attending to be a boolean", () => {
  assert.match(err({ ...base, attending: "yes" }), /attend/i);
});

test("attending guest must choose at least one event", () => {
  assert.match(err({ ...base, blessing: false, reception: false }), /at least one event/i);
  assert.equal(ok({ ...base, blessing: false }).reception, true);
});

test("declining forces events off, one guest and no dietary notes", () => {
  const d = ok({ ...base, attending: false, blessing: true, reception: true, guest_count: 5 });
  assert.equal(d.blessing, false);
  assert.equal(d.reception, false);
  assert.equal(d.guest_count, 1);
  assert.equal(d.dietary_restrictions, null);
});

test("guest_count: string integers accepted, others rejected", () => {
  assert.equal(ok({ ...base, guest_count: "3" }).guest_count, 3);
  assert.match(err({ ...base, guest_count: "2.5" }), /between 1 and 10/);
  assert.match(err({ ...base, guest_count: "" }), /between 1 and 10/);
  assert.match(err({ ...base, guest_count: 11 }), /between 1 and 10/);
  assert.match(err({ ...base, guest_count: 0 }), /between 1 and 10/);
});

test("missing guest_count defaults to 1", () => {
  const { guest_count, ...rest } = base;
  assert.equal(ok(rest).guest_count, 1);
});

test("rejects over-long text fields", () => {
  assert.match(err({ ...base, message: "x".repeat(2001) }), /2000/);
  assert.match(err({ ...base, name: "x".repeat(121) }), /too long/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL, `Cannot find module '.../lib/validation.ts'`.

- [ ] **Step 3: Write `lib/validation.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: `pass 14`, `fail 0` (5 countdown + 9 validation).

- [ ] **Step 5: Commit**

```bash
git add lib/validation.ts tests/validation.test.ts
git commit -m "Add RSVP validation with two-event rules

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Email templates

**Files:**
- Create: `lib/emails.ts`, `tests/emails.test.ts`

**Interfaces:**
- Consumes: `EVENTS`, `COUPLE`, `WEDDING_DATE_LABEL`, `WEDDING_DATE_SHORT`, `DRESS_CODE`, `CITY`, `type EventKey` from `./event.ts`.
- Produces: `type EventChoice = Record<EventKey, boolean>`, `escapeHtml(value: string): string`, `attendingEmail(name: string, guestCount: number, dietary: string | null | undefined, events: EventChoice): string`, `declinedEmail(name: string): string`, `interface CoupleNotification { name; email; attending; guestCount; events: EventChoice; dietary?; message? }`, `notifyCoupleEmail(n: CoupleNotification): string`.

- [ ] **Step 1: Write the failing test `tests/emails.test.ts`**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { attendingEmail, declinedEmail, notifyCoupleEmail } from "../lib/emails.ts";

const both = { blessing: true, reception: true };

test("user input is HTML-escaped in every template", () => {
  const evil = "<script>alert(1)</script>";
  const htmls = [
    attendingEmail(evil, 1, "<b>nuts</b>", both),
    declinedEmail(evil),
    notifyCoupleEmail({ name: evil, email: "a@b.co", attending: true, guestCount: 1, events: both, dietary: "<b>x</b>", message: evil }),
  ];
  for (const html of htmls) {
    assert.ok(!html.includes("<script>"), "raw <script> leaked");
    assert.ok(!html.includes("<b>"), "raw <b> leaked");
    assert.ok(html.includes("&lt;script&gt;"));
  }
});

test("attending email lists only the chosen events", () => {
  const html = attendingEmail("Jane", 2, null, { blessing: false, reception: true });
  assert.ok(html.includes("Reception"));
  assert.ok(html.includes("CABU Main Hall"));
  assert.ok(!html.includes("Church Blessing"));
  assert.ok(!html.includes("Central PAOG"));
});

test("party size wording", () => {
  assert.ok(attendingEmail("J", 1, null, both).includes("1 guest<"));
  assert.ok(attendingEmail("J", 3, null, both).includes("3 guests"));
});

test("dietary row only appears when given", () => {
  assert.ok(!attendingEmail("J", 1, null, both).includes("Dietary"));
  assert.ok(attendingEmail("J", 1, "Vegan", both).includes("Vegan"));
});

test("no <style> blocks (email clients strip them)", () => {
  const all = attendingEmail("J", 1, null, both) + declinedEmail("J") +
    notifyCoupleEmail({ name: "J", email: "j@x.co", attending: false, guestCount: 1, events: { blessing: false, reception: false } });
  assert.ok(!all.includes("<style"));
});

test("couple email shows per-event status for attending guests", () => {
  const html = notifyCoupleEmail({ name: "J", email: "j@x.co", attending: true, guestCount: 2, events: { blessing: true, reception: false } });
  assert.match(html, /Church Blessing<\/td>\s*<td[^>]*>✓ Yes/);
  assert.match(html, /Reception<\/td>\s*<td[^>]*>✗ No/);
});

test("couple email for a decline has no event rows", () => {
  const html = notifyCoupleEmail({ name: "J", email: "j@x.co", attending: false, guestCount: 1, events: { blessing: false, reception: false } });
  assert.ok(html.includes("Declined"));
  assert.ok(!html.includes("Church Blessing"));
});

test("messages keep line breaks", () => {
  const html = notifyCoupleEmail({ name: "J", email: "j@x.co", attending: false, guestCount: 1, events: { blessing: false, reception: false }, message: "line1\nline2" });
  assert.ok(html.includes("line1<br />line2"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL, `Cannot find module '.../lib/emails.ts'`.

- [ ] **Step 3: Write `lib/emails.ts`**

```ts
/**
 * HTML email templates (Sage Botanical theme).
 *
 * Inline CSS only: Gmail, Outlook and most other clients strip <style> tags.
 * Table-based layout for consistent rendering across clients.
 * All user-supplied values are HTML-escaped to prevent markup injection.
 */
import { CITY, COUPLE, DRESS_CODE, EVENTS, WEDDING_DATE_LABEL, WEDDING_DATE_SHORT, type EventKey } from "./event.ts";

const SAGE = "#7d9471";
const SAGE_LIGHT = "#cdd8c6";
const PAPER = "#f4f6f1";
const INK = "#2f3b2f";
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', Times, serif";
const SANS = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const COUPLE_HTML = `${COUPLE.first} &amp; ${COUPLE.second}`;

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: `pass 22`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add lib/emails.ts tests/emails.test.ts
git commit -m "Add sage-themed email templates with per-event details

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Database schema and RSVP API route

**Files:**
- Create: `supabase/schema.sql`, `app/api/rsvp/route.ts`

**Interfaces:**
- Consumes: `parseRsvp` (Task 2), `attendingEmail`, `declinedEmail`, `notifyCoupleEmail` (Task 3), `COUPLE`, `WEDDING_DATE_SHORT` (Task 1), `getSupabase`, `sendMail` (copied).
- Produces: `POST /api/rsvp` accepting JSON `{ name, email, attending, guest_count, blessing, reception, dietary_restrictions, message }`; responses `200 {success:true}`, `400 {success:false,error}`, `500 {success:false,error}`.

- [ ] **Step 1: Write `supabase/schema.sql`**

```sql
-- Longo & Santa RSVPs. Run once in the Supabase SQL Editor
-- (same project as Ebenezer & Audrey; separate table).

create table if not exists public.rsvps_longo_santa (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  email                text not null,
  attending            boolean not null,
  guest_count          int default 1,
  blessing             boolean not null default false,
  reception            boolean not null default false,
  dietary_restrictions text,
  message              text,
  created_at           timestamptz default now(),

  -- The publishable key can insert via the Supabase REST API directly,
  -- bypassing the API route, so the rules are enforced here too.
  constraint rsvps_ls_name_len    check (char_length(name) between 1 and 120),
  constraint rsvps_ls_email_len   check (char_length(email) between 3 and 254),
  constraint rsvps_ls_guest_count check (guest_count between 1 and 10),
  constraint rsvps_ls_dietary_len check (dietary_restrictions is null or char_length(dietary_restrictions) <= 2000),
  constraint rsvps_ls_message_len check (message is null or char_length(message) <= 2000),
  -- An accepting guest must pick at least one event.
  constraint rsvps_ls_events      check (not attending or blessing or reception)
);

alter table public.rsvps_longo_santa enable row level security;

drop policy if exists "Anyone can submit an RSVP" on public.rsvps_longo_santa;
create policy "Anyone can submit an RSVP"
  on public.rsvps_longo_santa
  for insert
  to anon
  with check (true);

-- Table-level privilege for the Data API (RLS above still applies).
grant insert on public.rsvps_longo_santa to anon;

-- Intentionally NO select/update/delete policies: the guest list stays private.
```

- [ ] **Step 2: Ask the user to run the SQL**

Tell the user: open Supabase → SQL Editor → New query, paste `supabase/schema.sql`, click Run, reply "done". Wait for confirmation before Step 6.

- [ ] **Step 3: Write `app/api/rsvp/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { sendMail } from "@/lib/mailer";
import { parseRsvp } from "@/lib/validation";
import { attendingEmail, declinedEmail, notifyCoupleEmail } from "@/lib/emails";
import { COUPLE, WEDDING_DATE_SHORT } from "@/lib/event";

// Nodemailer needs the Node.js runtime (not Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Separate table from the Ebenezer & Audrey site, in the same Supabase project. */
const TABLE = "rsvps_longo_santa";
const COUPLE_TEXT = `${COUPLE.first} & ${COUPLE.second}`;
const mark = (v: boolean) => (v ? "✓" : "✗");

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON." }, { status: 400 });
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
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no output (exit 0).

- [ ] **Step 5: Start dev server and verify 400 paths**

```bash
(npx next dev -p 3200 > "$TEMP/ls-dev.log" 2>&1 &)
timeout 120 bash -c 'until curl -s -o /dev/null http://localhost:3200/api/rsvp; do sleep 2; done'
post() { curl -s -X POST localhost:3200/api/rsvp -H "Content-Type: application/json" -d "$1" -w " %{http_code}\n"; }
post '{"name":"A","email":"bad","attending":true,"blessing":true}'
post '{"name":"A","email":"a@b.co","attending":true,"guest_count":11,"blessing":true}'
post '{"name":"A","email":"a@b.co","attending":true,"blessing":false,"reception":false}'
```

Expected, in order: `...valid email address."} 400`, `...between 1 and 10."} 400`, `...at least one event to attend."} 400`.

- [ ] **Step 6: Real RSVP + privacy check** (after the user confirms the SQL ran)

```bash
E=$(grep '^COUPLE_EMAIL=' .env.local | cut -d= -f2 | tr -d '\r')
post "{\"name\":\"TEST LS (delete me)\",\"email\":\"$E\",\"attending\":true,\"guest_count\":2,\"blessing\":false,\"reception\":true,\"message\":\"plan test\"}"
U=$(grep '^SUPABASE_URL=' .env.local | cut -d= -f2 | tr -d '\r'); K=$(grep '^SUPABASE_ANON_KEY=' .env.local | cut -d= -f2 | tr -d '\r')
curl -s "$U/rest/v1/rsvps_longo_santa?select=name" -H "apikey: $K" -w " %{http_code}\n"
curl -s -X POST "$U/rest/v1/rsvps_longo_santa" -H "apikey: $K" -H "Content-Type: application/json" -d '{"name":"x","email":"x@y.co","attending":true,"blessing":false,"reception":false}' -w " %{http_code}\n"
grep -c "Failed to send" "$TEMP/ls-dev.log"
```

Expected: `{"success":true} 200`; `[] 200` (no rows readable); a `23514` check-violation JSON with `400` (DB rejects no-event accept); `0` email failures.

- [ ] **Step 7: Commit**

```bash
git add supabase/schema.sql app/api/rsvp/route.ts
git commit -m "Add rsvps_longo_santa schema and RSVP API route

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Sage Botanical UI

**Files:**
- Create: `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`, `app/icon.svg`, `app/components/Leaves.tsx`, `app/components/Countdown.tsx`, `app/components/RSVPForm.tsx`, `app/page.tsx`
- Test (scratchpad, not committed): `$SP/ls-drive.mjs` using `playwright-core` already installed in the session scratchpad

**Interfaces:**
- Consumes: `getTimeLeft`, `TimeLeft` (Task 1), all `lib/event.ts` constants, `POST /api/rsvp` contract (Task 4).
- Produces: the finished page at `/`.

- [ ] **Step 1: Write `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sage: { DEFAULT: "#7d9471", dark: "#66795c", light: "#cdd8c6" },
        paper: "#f4f6f1",
        ink: "#2f3b2f",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Write `app/globals.css`, `app/icon.svg`, `app/layout.tsx`**

`app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}

::selection {
  background: #cdd8c6;
}
```

`app/icon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="31" fill="#f4f6f1" stroke="#7d9471" stroke-width="2"/>
  <text x="32" y="42" text-anchor="middle" font-family="Georgia, serif" font-size="26" font-style="italic" fill="#7d9471">L&amp;S</text>
</svg>
```

`app/layout.tsx`:
```tsx
import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Josefin_Sans } from "next/font/google";
import { COUPLE, WEDDING_DATE_SHORT, CITY } from "@/lib/event";
import "./globals.css";

// Self-hosted at build time by next/font: no runtime request to Google.
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const sans = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: `${COUPLE.first} & ${COUPLE.second} · ${WEDDING_DATE_SHORT}`,
  description: `Join us in ${CITY} to celebrate. Kindly RSVP.`,
};

export const viewport: Viewport = {
  themeColor: "#f4f6f1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Write `app/components/Leaves.tsx`**

```tsx
/** Decorative line-art leaves. Stroke uses currentColor, so set colour with a text-* class. */

export function LeafArch({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 60" className={className} fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
      <path d="M10 50 Q60 0 110 50" />
      <path d="M30 34 q-8 -10 -2 -16 q8 4 2 16z" />
      <path d="M50 22 q-4 -12 4 -16 q6 8 -4 16z" />
      <path d="M70 22 q4 -12 -4 -16 q-6 8 4 16z" />
      <path d="M90 34 q8 -10 2 -16 q-8 4 -2 16z" />
    </svg>
  );
}

export function Sprig({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 16" className={className} fill="none" stroke="currentColor" strokeWidth={1} aria-hidden>
      <path d="M4 8 H30" />
      <path d="M50 8 H76" />
      <path d="M40 8 q-5 -7 -10 -4 q4 5 10 4z" />
      <path d="M40 8 q5 -7 10 -4 q-4 5 -10 4z" />
      <path d="M40 8 q-5 7 -10 4 q4 -5 10 -4z" />
      <path d="M40 8 q5 7 10 4 q-4 -5 -10 -4z" />
    </svg>
  );
}
```

- [ ] **Step 4: Write `app/components/Countdown.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { getTimeLeft, type TimeLeft } from "@/lib/countdown";
import { WEDDING_START_ISO } from "@/lib/event";

const TARGET = Date.parse(WEDDING_START_ISO);

export default function Countdown() {
  // null until mounted, so server and client HTML match (no hydration mismatch).
  const [left, setLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const tick = () => setLeft(getTimeLeft(TARGET, Date.now()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  if (!left) return <div className="h-24" aria-hidden />;

  if (left.done) {
    return <p className="h-24 pt-6 text-center font-serif text-4xl italic text-sage">Just married!</p>;
  }

  const units = [
    { value: left.days, label: left.days === 1 ? "Day" : "Days" },
    { value: left.hours, label: left.hours === 1 ? "Hour" : "Hours" },
    { value: left.minutes, label: left.minutes === 1 ? "Minute" : "Minutes" },
  ];

  return (
    <div className="mx-auto flex h-24 max-w-sm justify-center gap-3 sm:gap-6" role="timer" aria-label="Time until the wedding">
      {units.map((u) => (
        <div key={u.label} className="w-24 rounded-2xl border border-sage-light bg-white/70 py-3 text-center">
          <div className="font-serif text-4xl leading-none text-ink">{u.value}</div>
          <div className="mt-2 text-[11px] uppercase tracking-[0.25em] text-sage">{u.label}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Write `app/components/RSVPForm.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { EVENTS, type EventKey } from "@/lib/event";

type Status = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full rounded-xl border border-sage-light bg-white px-4 py-3 text-ink placeholder:text-ink/40 " +
  "transition focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20";
const labelClass = "mb-2 block text-sm tracking-wide text-ink/80";

export default function RSVPForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [attending, setAttending] = useState<boolean | null>(null);
  const [events, setEvents] = useState<Record<EventKey, boolean>>({ blessing: true, reception: true });
  const [guestCount, setGuestCount] = useState(1);
  const [dietary, setDietary] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  function fail(msg: string) {
    setError(msg);
    setStatus("error");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (attending === null) return fail("Please let us know if you can attend.");
    if (attending && !events.blessing && !events.reception) {
      return fail("Please choose at least one event to attend.");
    }

    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          attending,
          guest_count: attending ? guestCount : 1,
          blessing: attending && events.blessing,
          reception: attending && events.reception,
          dietary_restrictions: attending ? dietary : "",
          message,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status >= 500) {
        // Server/database errors aren't meaningful to guests; keep details in the console.
        console.error("RSVP failed:", data.error);
        throw new Error("We couldn't save your RSVP right now. Please try again in a moment.");
      }
      if (!res.ok || !data.success) {
        // 4xx validation messages are written for guests, so show them as-is.
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setStatus("success");
    } catch (err) {
      fail(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-3xl border border-sage-light bg-white px-6 py-14 text-center shadow-sm" role="status">
        <p className="font-serif text-4xl text-sage">Thank you! 💌</p>
        <p className="mx-auto mt-4 max-w-sm text-ink/70">
          {attending
            ? "We can't wait to celebrate with you. A confirmation is on its way to your inbox."
            : "We'll miss you dearly. Thank you for letting us know."}
        </p>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-sage-light bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10"
    >
      <div>
        <label htmlFor="name" className={labelClass}>Full Name</label>
        <input id="name" type="text" required maxLength={120} autoComplete="name" value={name}
          onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your full name" />
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>Email</label>
        <input id="email" type="email" required maxLength={254} autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
      </div>

      <fieldset>
        <legend className={labelClass}>Will you attend?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { value: true, label: "Joyfully accepts" },
            { value: false, label: "Regretfully declines" },
          ].map((opt) => {
            const selected = attending === opt.value;
            return (
              <label
                key={opt.label}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                  selected ? "border-sage bg-sage/10 text-ink" : "border-sage-light text-ink/70 hover:border-sage/60 hover:bg-paper"
                }`}
              >
                <input type="radio" name="attending" required checked={selected}
                  onChange={() => setAttending(opt.value)} className="h-4 w-4 accent-sage" />
                <span className="font-serif text-xl">{opt.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {attending && (
        <div className="space-y-6">
          <fieldset>
            <legend className={labelClass}>Which events will you attend?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {EVENTS.map((ev) => (
                <label
                  key={ev.key}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                    events[ev.key] ? "border-sage bg-sage/10" : "border-sage-light hover:border-sage/60 hover:bg-paper"
                  }`}
                >
                  <input type="checkbox" checked={events[ev.key]}
                    onChange={(e) => setEvents((prev) => ({ ...prev, [ev.key]: e.target.checked }))}
                    className="mt-1 h-4 w-4 accent-sage" />
                  <span>
                    <span className="block font-serif text-xl text-ink">{ev.name}</span>
                    <span className="block text-sm text-ink/60">{ev.time} · {ev.venue}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="guests" className={labelClass}>Number of guests (including you)</label>
            <select id="guests" value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))} className={inputClass}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dietary" className={labelClass}>
              Dietary restrictions <span className="text-ink/50">(optional)</span>
            </label>
            <input id="dietary" type="text" maxLength={2000} value={dietary}
              onChange={(e) => setDietary(e.target.value)} className={inputClass} placeholder="Vegetarian, nut allergy…" />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="message" className={labelClass}>
          Message to the couple <span className="text-ink/50">(optional)</span>
        </label>
        <textarea id="message" rows={4} maxLength={2000} value={message}
          onChange={(e) => setMessage(e.target.value)} className={`${inputClass} resize-y`} placeholder="Share your well wishes…" />
      </div>

      {status === "error" && error && (
        <p className="rounded-xl bg-sage/10 px-4 py-3 text-sm text-sage-dark" role="alert">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-sage px-6 py-4 text-sm uppercase tracking-[0.25em] text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sage-dark hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />}
        {submitting ? "Sending…" : "Send RSVP"}
      </button>
    </form>
  );
}
```

- [ ] **Step 6: Write `app/page.tsx`**

```tsx
import RSVPForm from "./components/RSVPForm";
import Countdown from "./components/Countdown";
import { LeafArch, Sprig } from "./components/Leaves";
import { COUPLE, DRESS_CODE, EVENTS, WEDDING_DATE_LABEL, CITY, WEDDING_DATE_NUMERIC } from "@/lib/event";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8 text-center">
      <Sprig className="mx-auto mb-4 h-4 w-20 text-sage" />
      <h2 className="font-serif text-4xl text-ink sm:text-5xl">{children}</h2>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="flex min-h-[85vh] flex-col items-center justify-center px-6 py-20 text-center">
        <LeafArch className="h-20 w-40 text-sage sm:h-24 sm:w-48" />
        <h1 className="mt-6 font-serif text-6xl font-normal leading-[0.95] text-ink sm:text-8xl">
          {COUPLE.first}
          <span className="my-2 block text-3xl italic text-sage sm:text-4xl">and</span>
          {COUPLE.second}
        </h1>
        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-ink/70 sm:text-sm">
          {WEDDING_DATE_LABEL} · {CITY}
        </p>
        <a
          href="#rsvp"
          className="mt-10 inline-block rounded-full bg-sage px-9 py-3 text-sm uppercase tracking-[0.25em] text-white transition hover:-translate-y-0.5 hover:bg-sage-dark"
        >
          RSVP
        </a>
      </section>

      {/* Countdown */}
      <section className="px-4 pb-20">
        <p className="mb-5 text-center text-xs uppercase tracking-[0.3em] text-sage">Counting down</p>
        <Countdown />
      </section>

      {/* The Day */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-xl">
          <SectionTitle>The Day</SectionTitle>
          <ol className="divide-y divide-sage-light border-y border-sage-light">
            {EVENTS.map((ev) => (
              <li key={ev.key} className="flex items-baseline gap-5 px-2 py-5">
                <span className="w-20 shrink-0 text-sm font-semibold tracking-wide text-sage">{ev.time}</span>
                <span>
                  <span className="block font-serif text-2xl text-ink">{ev.name}</span>
                  <span className="block text-ink/60">{ev.venue}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Dress code */}
      <section className="px-4 pb-20 text-center">
        <SectionTitle>Dress Code</SectionTitle>
        <p className="font-serif text-2xl italic text-ink/80">{DRESS_CODE}</p>
      </section>

      {/* RSVP */}
      <section id="rsvp" className="scroll-mt-8 px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-xl">
          <SectionTitle>Kindly Reply</SectionTitle>
          <RSVPForm />
        </div>
      </section>

      <footer className="pb-12 text-center font-serif text-lg italic text-sage">
        {COUPLE.initials} · {WEDDING_DATE_NUMERIC}
      </footer>
    </main>
  );
}
```

- [ ] **Step 7: Type-check, unit tests, production build**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: no type errors; `pass 22 fail 0`; build lists `○ /` and `ƒ /api/rsvp`. (Google Fonts download may log "Retrying 1/3" on this network; that is fine if the build completes.)

- [ ] **Step 8: Browser check**

Set `SP="C:/Users/KELSON~1/AppData/Local/Temp/claude/C--Users-Kelson-Sales-Desktop-Wedding/0bd9fe0f-0337-4a26-ac51-9865f44b3c6d/scratchpad"` (has `playwright-core` installed) and write `$SP/ls-drive.mjs`:

```js
import { chromium } from "playwright-core";
const out = process.argv[2];
const b = await chromium.launch({ channel: "chrome" });
const errors = [];
for (const [w, h, tag] of [[360, 760, "mobile"], [1280, 900, "desktop"]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  p.on("console", (m) => m.type() === "error" && errors.push(`${tag}: ${m.text()}`));
  await p.goto("http://localhost:3200");
  await p.waitForSelector("[role=timer]");
  console.log(tag, "overflow:", await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  await p.screenshot({ path: `${out}/ls-${tag}-hero.png` });
  if (tag === "mobile") {
    console.log("event boxes hidden before accept:", (await p.$("text=Which events will you attend?")) === null);
    await p.fill("#name", "UI Test"); await p.fill("#email", "ui@example.com");
    await p.click("text=Joyfully accepts");
    await p.waitForSelector("text=Which events will you attend?");
    await p.locator("label:has-text('Church Blessing') input").uncheck();
    await p.locator("label:has-text('Reception') input").uncheck();
    await p.click("button[type=submit]");
    console.log("no-event message:", await p.locator("form p[role=alert]").textContent());
    await p.locator("label:has-text('Reception') input").check();
    await p.locator("form").screenshot({ path: `${out}/ls-mobile-form.png` });
  }
}
console.log("console errors:", errors);
await b.close();
```

Run (dev server from Task 4 still on :3200): `cd "$SP" && node ls-drive.mjs "$SP"`
Expected: `overflow: false` twice; `event boxes hidden before accept: true`; `no-event message: Please choose at least one event to attend.`; `console errors: []`. Read the screenshots and confirm the sage design matches the approved mockup (leaf arch, Longo/and/Santa, timeline).

- [ ] **Step 9: Commit**

```bash
git add tailwind.config.ts app/
git commit -m "Add Sage Botanical page with countdown, timeline, dress code and RSVP form

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: README, GitHub and Vercel deploy

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: everything above.
- Produces: GitHub repo + live Vercel URL.

- [ ] **Step 1: Write `README.md`**

````markdown
# Longo & Santa · Wedding Website

Sage Botanical wedding invitation with a two-event RSVP (Church Blessing +
Reception). RSVPs are saved to **Supabase** (`rsvps_longo_santa`) and
confirmation emails are sent through **Gmail** (Nodemailer + App Password).

- **Saturday, 19 December 2026**
- Church Blessing · 9:00 AM · Central PAOG, Kitwe
- Reception · 3:00 PM · CABU Main Hall

All wedding details live in `lib/event.ts`.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev                  # http://localhost:3000
npm test                     # unit tests (validation, emails, countdown)
```

| Variable             | Description                                    |
| -------------------- | ---------------------------------------------- |
| `GMAIL_USER`         | Gmail address that sends the emails            |
| `GMAIL_APP_PASSWORD` | 16-character Google App Password               |
| `COUPLE_EMAIL`       | Where RSVP notifications are delivered         |
| `SUPABASE_URL`       | `https://<project-ref>.supabase.co`            |
| `SUPABASE_ANON_KEY`  | The **publishable** key (`sb_publishable_...`) |

These are server-only (no `NEXT_PUBLIC_` prefix). Never use the secret key.

## Gmail App Password

Requires 2-Step Verification. Create one at
<https://myaccount.google.com/apppasswords> and paste it into
`GMAIL_APP_PASSWORD`. Changing the Google password revokes it.

## Supabase

This site shares a Supabase project with another wedding site but uses its own
table. In **SQL Editor → New query**, run [`supabase/schema.sql`](supabase/schema.sql).
It creates `rsvps_longo_santa`, adds validation constraints, enables RLS with
an insert-only policy for `anon`, and adds **no SELECT policy** (the guest list
is private; view it in **Table Editor**).

## Deploy to Vercel

1. Push to GitHub, then import the repo at <https://vercel.com/new>.
2. Add the five environment variables (paste the contents of `.env.local` into
   the first Key field). If Vercel says `SUPABASE_URL` / `SUPABASE_ANON_KEY`
   already exist, remove those two rows and check the existing values match.
3. Deploy. Env var changes need **Deployments → ⋯ → Redeploy**.

## Notes

- Emails may land in Spam for new recipients; ask guests to check Spam and
  click "Not spam".
- Duplicate RSVPs are allowed (a guest may update their reply).
````

- [ ] **Step 2: Commit and verify no secrets are tracked**

```bash
git add README.md
K=$(grep '^SUPABASE_ANON_KEY=' .env.local | cut -d= -f2 | tr -d '\r'); P=$(grep '^GMAIL_APP_PASSWORD=' .env.local | cut -d= -f2 | tr -d '\r')
git grep -lF -e "$K" -e "$P" && echo "STOP: secret in tracked files" || echo "no secrets tracked"
git ls-files | grep -E "^\.env\.local$|^\.superpowers" && echo "STOP" || echo "ignored files ok"
git commit -m "Add README

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Expected: `no secrets tracked`, `ignored files ok`.

- [ ] **Step 3: Push to GitHub**

Ask the user for the new (empty) GitHub repo URL. Then:

```bash
git remote add origin <URL>
git push -u origin main
```

Expected: `* [new branch] main -> main`.

- [ ] **Step 4: User deploys on Vercel**

Give the user the Vercel import steps from the README (new project, same five env vars, Deploy) and ask for the live URL.

- [ ] **Step 5: Verify live**

```bash
U=<live URL>
curl -s -o /dev/null -w "page: %{http_code}\n" $U/
curl -s $U/ | grep -oE "Longo|Central PAOG, Kitwe|CABU Main Hall|Formal attire" | sort -u
E=$(grep '^COUPLE_EMAIL=' .env.local | cut -d= -f2 | tr -d '\r')
curl -s -X POST $U/api/rsvp -H "Content-Type: application/json" -d "{\"name\":\"LIVE LS TEST (delete me)\",\"email\":\"$E\",\"attending\":true,\"guest_count\":1,\"blessing\":true,\"reception\":true}" -w " %{http_code} in %{time_total}s\n"
```

Expected: `page: 200`; all four strings; `{"success":true} 200` with time over ~1.5s (a sub-second response suggests email env vars are missing on Vercel). Ask the user to confirm the row in Supabase and both emails in the shared Gmail, then delete test rows.
