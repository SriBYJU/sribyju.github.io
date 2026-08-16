import test from "node:test";
import assert from "node:assert/strict";
import {
  getAllAuthEmails,
  getEligibleRecipients,
  normalizeEmail,
  redactEmailAddresses,
  recipientFingerprint,
} from "./send-weekly-email.js";

test("normalizes email addresses and fingerprints do not reveal them", () => {
  assert.equal(normalizeEmail("  Student@Example.COM "), "student@example.com");
  const fingerprint = recipientFingerprint("student@example.com");
  assert.match(fingerprint, /^[a-f0-9]{10}$/);
  assert.equal(fingerprint.includes("student"), false);
});

test("redacts complete email addresses from provider errors", () => {
  assert.equal(
    redactEmailAddresses("550 rejected Student.Name@example.com during SMTP"),
    "550 rejected [redacted-email] during SMTP",
  );
});

test("pages through Firebase Authentication beyond 1,000 users", async () => {
  const calls = [];
  const auth = {
    async listUsers(limit, pageToken) {
      calls.push({ limit, pageToken });
      if (!pageToken) {
        return {
          users: Array.from({ length: 1000 }, (_, index) => ({ email: `USER${index}@Example.com` })),
          pageToken: "next-page",
        };
      }
      return { users: [{ email: "user1000@example.com" }] };
    },
  };
  const emails = await getAllAuthEmails(auth);
  assert.equal(emails.size, 1001);
  assert.deepEqual(calls, [
    { limit: 1000, pageToken: undefined },
    { limit: 1000, pageToken: "next-page" },
  ]);
});

test("combines auth and subscribers, deduplicates case, and preserves opt-outs", async () => {
  const auth = {
    async listUsers() {
      return { users: [
        { email: "Keep@Example.com" },
        { email: "OptOut@example.com" },
        { email: "keep@example.com" },
      ] };
    },
  };
  const docs = [
    { id: "extra@example.com", data: () => ({ email: "Extra@Example.com", active: true }) },
    { id: "optout@example.com", data: () => ({ email: "OPTOUT@example.com", active: true }) },
    { id: "legacy-optout", data: () => ({ email: "optout@example.com", active: false }) },
  ];
  const firestore = {
    collection(name) {
      assert.equal(name, "email_subscribers");
      return { get: async () => ({ docs }) };
    },
  };
  assert.deepEqual(await getEligibleRecipients(auth, firestore), [
    "extra@example.com",
    "keep@example.com",
  ]);
});
