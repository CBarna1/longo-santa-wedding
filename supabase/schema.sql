-- Longo & Santa RSVPs. Run once in the Supabase SQL Editor
-- (same project as Ebenezer & Audrey; separate table).

create table if not exists public.rsvps_longo_santa (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  email                text not null,
  attending            boolean not null,
  guest_count          int not null default 1,
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
  -- An accepting guest must pick at least one event; a declining guest picks none.
  constraint rsvps_ls_events      check (not attending or blessing or reception),
  constraint rsvps_ls_decline     check (attending or (not blessing and not reception))
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
