import test from "node:test";
import assert from "node:assert/strict";
import { deliveryId, isRecentPending, mondayUtcKey, ResendEmailClient } from "./weekly-email-delivery.js";

test("campaign key stays fixed from Monday through Sunday UTC", () => {
  assert.equal(mondayUtcKey(new Date("2026-09-28T13:15:00Z")), "2026-09-28");
  assert.equal(mondayUtcKey(new Date("2026-10-04T23:59:59Z")), "2026-09-28");
  assert.equal(mondayUtcKey(new Date("2026-10-05T00:00:00Z")), "2026-10-05");
});

test("delivery id is stable and does not reveal the address", () => {
  const first = deliveryId("2026-09-28", " Student@Example.com ");
  assert.equal(first, deliveryId("2026-09-28", "student@example.com"));
  assert.notEqual(first, deliveryId("2026-10-05", "student@example.com"));
  assert.equal(first.includes("student"), false);
});

test("pending delivery is only safe to retry while provider idempotency is retained", () => {
  const now = Date.now();
  assert.equal(isRecentPending({ status: "pending", reservedAtMs: now - 22 * 60 * 60 * 1000 }, now), true);
  assert.equal(isRecentPending({ status: "pending", reservedAtMs: now - 24 * 60 * 60 * 1000 }, now), false);
  assert.equal(isRecentPending({ status: "accepted", reservedAtMs: now }, now), false);
});

test("provider retries a rate limit with the same idempotency key", async () => {
  const calls = [];
  const client = new ResendEmailClient({
    apiKey: "test-key",
    from: "Scholark <tips@example.com>",
    minIntervalMs: 0,
    sleep: async () => {},
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return calls.length === 1
        ? { ok: false, status: 429, headers: { get: () => "1" }, json: async () => ({ name: "rate_limit_exceeded" }) }
        : { ok: true, status: 200, json: async () => ({ id: "provider-id" }) };
    },
  });
  const id = await client.send({
    to: "student@example.com",
    subject: "Weekly tip",
    html: "<p>Tip</p>",
    unsubscribeHeader: "<mailto:help@example.com>",
    idempotencyKey: "week-recipient",
  });
  assert.equal(id, "provider-id");
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.headers["Idempotency-Key"], "week-recipient");
  assert.equal(calls[1].options.headers["Idempotency-Key"], "week-recipient");
  assert.deepEqual(JSON.parse(calls[0].options.body).to, ["student@example.com"]);
});

test("provider stops on permanent authentication failure", async () => {
  const client = new ResendEmailClient({
    apiKey: "invalid",
    from: "Scholark <tips@example.com>",
    minIntervalMs: 0,
    fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({ name: "invalid_api_key" }) }),
  });
  await assert.rejects(
    () => client.send({
      to: "student@example.com",
      subject: "Weekly tip",
      html: "<p>Tip</p>",
      unsubscribeHeader: "<mailto:help@example.com>",
      idempotencyKey: "week-recipient",
    }),
    /HTTP 401/,
  );
});
