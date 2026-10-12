import { test } from "node:test";
import assert from "node:assert/strict";
import { getTimeLeft, isRsvpOpen } from "../lib/countdown.ts";
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

test("RSVPs are open before the wedding starts and closed from then on", () => {
  assert.equal(isRsvpOpen(target, target - 1), true);
  assert.equal(isRsvpOpen(target, target), false);
  assert.equal(isRsvpOpen(target, target + MIN), false);
});
