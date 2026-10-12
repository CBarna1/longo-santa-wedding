# Longo & Santa Wedding Site: Design

**Date:** 2026-10-12
**Status:** Approved in chat, pending written-spec review

## Goal

A wedding invitation + RSVP site for **Longo & Santa**, built by copying the
existing Ebenezer & Audrey project (`Desktop\Wedding`, repo `CBarna1/wedding`)
and giving it a new "Sage Botanical" design and two-event RSVP.

One-off site for this couple (not a reusable multi-couple template).

## Event details

| Item            | Value                                   |
| --------------- | --------------------------------------- |
| Couple          | Longo & Santa (in that order)           |
| Date            | Saturday, 19 December 2026              |
| Church Blessing | 9:00 AM · Central PAOG, Kitwe           |
| Reception       | 3:00 PM · CABU Main Hall                |
| Dress code      | Formal attire                           |
| Time zone       | Africa/Lusaka (UTC+2, no DST)           |

## 1. Project setup

- Location: `C:\Users\Kelson Sales\Desktop\longo-santa-wedding`, a copy of the
  Ebenezer & Audrey source (no `node_modules`, `.next`, `.git`, `.env.local`).
- Fresh git history; pushed to a **new GitHub repo** (user supplies URL) and
  deployed as a **separate Vercel project**.
- The Ebenezer & Audrey site and repo are not modified.
- `.superpowers/` added to `.gitignore`.

## 2. Shared accounts

- **Gmail:** same account and App Password as Ebenezer & Audrey
  (`GMAIL_USER`, `GMAIL_APP_PASSWORD`).
- **COUPLE_EMAIL:** same Gmail for now (user can change the env var later).
- **Supabase:** same project (`SUPABASE_URL`, `SUPABASE_ANON_KEY`), but a
  **new table `rsvps_longo_santa`** so guest lists never mix.
- Env var names are unchanged; the table name is a constant in the API route.

## 3. Visual design: Sage Botanical

- Palette: sage `#7d9471` (accent), sage-light `#cdd8c6` (borders),
  background `#f4f6f1`, ink `#2f3b2f` (text), white cards.
- Fonts (via `next/font/google`): **Cormorant Garamond** headings,
  **Josefin Sans** body.
- Decoration: inline-SVG line-art leaf arch in the hero, small leaf sprig as
  section dividers. No images.
- Mobile-first; no horizontal scroll at 360px.

## 4. Page structure (`app/page.tsx`)

1. **Hero:** leaf arch SVG, "Longo / *and* / Santa",
   "Saturday · 19 December 2026 · Kitwe", RSVP button anchoring to `#rsvp`.
2. **Countdown** (`app/components/Countdown.tsx`, client): days / hours /
   minutes until `2026-12-19T09:00:00+02:00`, updating every 30s. Renders
   nothing until mounted (avoids hydration mismatch). After the target time it
   shows "Just married!".
3. **The Day:** two-row timeline:
   - 9:00 AM: Church Blessing, Central PAOG, Kitwe
   - 3:00 PM: Reception, CABU Main Hall
4. **Dress code:** "Formal attire".
5. **RSVP** section with the form.
6. **Footer:** "L & S · 19.12.2026".

## 5. RSVP form (`app/components/RSVPForm.tsx`)

- Full name (required), email (required).
- Attending: "Joyfully accepts" / "Regretfully declines".
- If accepting:
  - Event checkboxes **Church Blessing** and **Reception**, both checked by
    default; at least one must stay checked (client + server validation).
  - Number of guests 1–10 (default 1), dietary restrictions (optional).
- Message to the couple (optional).
- Loading state; success "Thank you! 💌"; 5xx shows the friendly
  "We couldn't save your RSVP right now…" message, 4xx shows server message.

## 6. Data: `rsvps_longo_santa`

Columns as the original `rsvps` table plus:

- `blessing boolean not null default false`
- `reception boolean not null default false`

Constraints: same length/guest-count checks as before, plus
`check (not attending or blessing or reception)`, so an accepting guest must
pick at least one event. Declining guests store both as `false`.

RLS enabled; single `INSERT` policy for `anon` with `WITH CHECK (true)`;
`grant insert ... to anon`; no SELECT policy. Delivered as
`supabase/schema.sql`, run once by the user in the SQL Editor.

## 7. API route (`app/api/rsvp/route.ts`)

Same flow as the original: validate → insert (no `.select()`) → 500 with
error message on DB failure → send both emails with `Promise.allSettled` →
log email failures → `{ success: true }`.

Validation additions: `blessing` and `reception` must be booleans; if
`attending`, at least one is `true`; if declining, both forced to `false`.

## 8. Emails (`lib/emails.ts`, `lib/mailer.ts`)

Inline CSS only, sage palette, Cormorant/Georgia serif stack for guest emails,
all user input HTML-escaped.

- **attendingEmail(name, guestCount, dietary, events)**: lists only the chosen
  events with time + venue; party size; dietary if given.
- **declinedEmail(name)**: gracious "we'll miss you".
- **notifyCoupleEmail(...)**: sans-serif summary incl. Blessing ✓/✗ and
  Reception ✓/✗; `replyTo` = guest email.
- Sender: `"Longo & Santa Wedding" <GMAIL_USER>`.
- Subjects: "You're on the list! Longo & Santa · 19 December 2026" /
  "Thank you for your RSVP · Longo & Santa" /
  "RSVP: {name} is attending ({n}) · Blessing ✓ Reception ✓" (or "declined").

## 9. Testing

Before deploy:
- `tsc --noEmit` and `next build` pass.
- Headless Chrome: page renders at 360px and 1280px with no horizontal
  overflow; countdown shows; event checkboxes appear only when accepting;
  unticking both events blocks submit with a message.
- API: 400 for invalid email, 11 guests, attending with no events.
- One real RSVP to the shared Gmail → 200; anon SELECT on
  `rsvps_longo_santa` returns `[]`.

After deploy: page loads with correct content; one live test RSVP → 200;
user confirms row in Supabase and both emails.

## Out of scope

Map links, gifts section, photo gallery, invite codes, editing/updating an
existing RSVP, admin dashboard.
