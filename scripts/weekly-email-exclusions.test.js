import test from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { isPlaceholderAddress, loadWeeklyEmailExclusions } from "./weekly-email-exclusions.js";

test("excludes reserved and known synthetic email domains", () => {
  for (const email of ["a@example.com", "a@sample.net", "a@test.com", "a@test.net", "a@foo.invalid"]) {
    assert.equal(isPlaceholderAddress(email), true);
  }
  assert.equal(isPlaceholderAddress("a@gmail.com"), false);
});

test("loads a private compressed exclusion list and fails closed on missing data", () => {
  const addresses = Array.from({ length: 1591 }, (_, i) => `student${i}@gmail.com`);
  const encoded = gzipSync(addresses.join("\n")).toString("base64");
  const loaded = loadWeeklyEmailExclusions(encoded);
  assert.equal(loaded.size, 1591);
  assert.equal(loaded.has("student0@gmail.com"), true);
  assert.throws(() => loadWeeklyEmailExclusions(""), /Missing or invalid/);
  assert.throws(() => loadWeeklyEmailExclusions("abcd"), /could not be decoded/);
});
