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
