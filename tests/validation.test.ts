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
