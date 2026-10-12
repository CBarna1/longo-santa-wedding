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
