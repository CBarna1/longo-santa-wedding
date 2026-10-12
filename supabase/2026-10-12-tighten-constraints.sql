-- One-off update for a rsvps_longo_santa table created from the original
-- schema.sql. Safe to run more than once. Fresh installs don't need it:
-- schema.sql already includes these rules.

-- Backfill and forbid NULL guest counts.
update public.rsvps_longo_santa set guest_count = 1 where guest_count is null;
alter table public.rsvps_longo_santa alter column guest_count set not null;

-- A declining guest can't be marked as attending an event.
update public.rsvps_longo_santa set blessing = false, reception = false where not attending;
alter table public.rsvps_longo_santa drop constraint if exists rsvps_ls_decline;
alter table public.rsvps_longo_santa
  add constraint rsvps_ls_decline check (attending or (not blessing and not reception));
