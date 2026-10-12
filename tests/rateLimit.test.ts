import { test } from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter } from "../lib/rateLimit.ts";

test("allows up to the limit within the window, then blocks", () => {
  const allow = createRateLimiter(3, 60_000);
  assert.deepEqual([1, 2, 3, 4].map(() => allow("1.2.3.4", 0)), [true, true, true, false]);
});

test("window resets after it expires", () => {
  const allow = createRateLimiter(1, 60_000);
  assert.equal(allow("ip", 0), true);
  assert.equal(allow("ip", 59_999), false);
  assert.equal(allow("ip", 60_000), true);
});

test("different keys are counted separately", () => {
  const allow = createRateLimiter(1, 60_000);
  assert.equal(allow("a", 0), true);
  assert.equal(allow("b", 0), true);
  assert.equal(allow("a", 1), false);
});
