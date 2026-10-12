/**
 * Single source of truth for the wedding details.
 * Used by the page, the countdown, the RSVP validation and the emails.
 * Dependency-free so it can be imported directly by `node --test`.
 */

export const COUPLE = {
  first: "Longo",
  firstSurname: "Sinyinza",
  second: "Santa",
  secondSurname: "Jinaina",
  initials: "L & S",
} as const;

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
