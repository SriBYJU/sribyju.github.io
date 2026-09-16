/**
 * One-time Scholark Firebase Authentication import.
 *
 * Input is staged in owner-restricted Firestore documents under a temporary
 * Firebase user. The importer validates the complete payload before creating
 * accounts, never changes existing accounts, and removes staging data only
 * after a fully successful import.
 */

import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = "gradescope-539dd";
const STAGING_EMAIL_PREFIX = "scholark-import-";
const STAGING_EMAIL_SUFFIX = "@example.com";
const CONCURRENCY = 20;
const MAX_RETRIES = 5;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function initializeFirebase() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT.");

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT must contain valid JSON.");
  }

  if (serviceAccount.project_id !== PROJECT_ID) {
    throw new Error(`Refusing to import into unexpected project ${serviceAccount.project_id}.`);
  }

  initializeApp({ credential: cert(serviceAccount), projectId: PROJECT_ID });
  return { auth: getAuth(), db: getFirestore() };
}

async function listAllUsers(auth) {
  const users = [];
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);
  return users;
}

function isStagingUser(user) {
  const email = (user.email || "").toLowerCase();
  return email.startsWith(STAGING_EMAIL_PREFIX) && email.endsWith(STAGING_EMAIL_SUFFIX);
}

async function loadStagedImport(db, stagingUser) {
  const ref = db.collection("users").doc(stagingUser.uid).collection("bulk_import");
  const manifestSnapshot = await ref.doc("manifest").get();
  if (!manifestSnapshot.exists) return null;

  const manifest = manifestSnapshot.data();
  if (manifest.projectId !== PROJECT_ID) throw new Error("Staged project ID mismatch.");
  if (!Number.isInteger(manifest.count) || manifest.count < 1) throw new Error("Invalid staged row count.");
  if (!Number.isInteger(manifest.chunkCount) || manifest.chunkCount < 1) throw new Error("Invalid staged chunk count.");
  if (typeof manifest.password !== "string" || manifest.password.length < 6) throw new Error("Invalid staged password.");

  const snapshot = await ref.get();
  const chunks = snapshot.docs
    .map((doc) => doc.data())
    .filter((doc) => doc.kind === "data")
    .sort((a, b) => a.index - b.index);

  if (chunks.length !== manifest.chunkCount) {
    throw new Error(`Incomplete staging payload: expected ${manifest.chunkCount} chunks, found ${chunks.length}.`);
  }

  const rows = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    if (chunk.index !== index || typeof chunk.payload !== "string") {
      throw new Error(`Invalid staging chunk ${index}.`);
    }
    const decoded = gunzipSync(Buffer.from(chunk.payload, "base64")).toString("utf8");
    const parsed = JSON.parse(decoded);
    if (!Array.isArray(parsed)) throw new Error(`Staging chunk ${index} is not an array.`);
    rows.push(...parsed);
  }

  if (rows.length !== manifest.count) {
    throw new Error(`Row-count mismatch: expected ${manifest.count}, found ${rows.length}.`);
  }

  const digest = createHash("sha256").update(JSON.stringify(rows)).digest("hex");
  if (digest !== manifest.sha256) throw new Error("Staging integrity check failed.");

  const seen = new Set();
  for (const [index, row] of rows.entries()) {
    if (!row || typeof row.name !== "string" || !row.name.trim()) {
      throw new Error(`Missing name at staged row ${index + 1}.`);
    }
    if (typeof row.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      throw new Error(`Invalid email at staged row ${index + 1}.`);
    }
    const email = row.email.trim().toLowerCase();
    if (seen.has(email)) throw new Error(`Duplicate staged email at row ${index + 1}.`);
    seen.add(email);
    row.name = row.name.trim();
    row.email = email;
  }

  return { ref, rows, password: manifest.password };
}

function retryable(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();
  return ["auth/internal-error", "auth/quota-exceeded", "auth/too-many-requests"].includes(code)
    || message.includes("timeout")
    || message.includes("temporar")
    || message.includes("econnreset");
}

async function createWithRetry(auth, row, password) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await auth.createUser({
        email: row.email,
        password,
        displayName: row.name,
        emailVerified: false,
        disabled: false,
      });
      return "created";
    } catch (error) {
      if (error?.code === "auth/email-already-exists") return "skipped";
      if (attempt === MAX_RETRIES || !retryable(error)) throw error;
      await sleep(250 * (2 ** (attempt - 1)));
    }
  }
  throw new Error("Unreachable retry state.");
}

async function importRows(auth, rows, password, existingEmails) {
  let created = 0;
  let skipped = 0;
  const failures = [];

  const pending = rows.filter((row) => {
    if (existingEmails.has(row.email)) {
      skipped += 1;
      return false;
    }
    return true;
  });

  for (let start = 0; start < pending.length; start += CONCURRENCY) {
    const batch = pending.slice(start, start + CONCURRENCY);
    const results = await Promise.all(batch.map(async (row) => {
      try {
        const status = await createWithRetry(auth, row, password);
        return { status };
      } catch (error) {
        return { status: "failed", code: String(error?.code || "unknown") };
      }
    }));

    for (const result of results) {
      if (result.status === "created") created += 1;
      else if (result.status === "skipped") skipped += 1;
      else failures.push(result.code);
    }

    const processed = Math.min(start + batch.length, pending.length);
    if (processed % 500 === 0 || processed === pending.length) {
      console.log(`Progress: ${processed}/${pending.length} new accounts processed.`);
    }
  }

  return { created, skipped, failures };
}

async function cleanupStaging(auth, db, stagingUser, ref) {
  const snapshot = await ref.get();
  for (let start = 0; start < snapshot.docs.length; start += 400) {
    const batch = db.batch();
    for (const doc of snapshot.docs.slice(start, start + 400)) batch.delete(doc.ref);
    await batch.commit();
  }
  await db.collection("users").doc(stagingUser.uid).delete().catch(() => undefined);
  await auth.deleteUser(stagingUser.uid);
}

async function main() {
  const { auth, db } = initializeFirebase();
  const allUsers = await listAllUsers(auth);
  const stagingUsers = allUsers.filter(isStagingUser);
  if (stagingUsers.length === 0) throw new Error("No Scholark staging account found.");

  const existingEmails = new Set(
    allUsers
      .filter((user) => !isStagingUser(user) && user.email)
      .map((user) => user.email.toLowerCase()),
  );

  let completedImports = 0;
  let totalCreated = 0;
  let totalSkipped = 0;

  for (const stagingUser of stagingUsers) {
    const staged = await loadStagedImport(db, stagingUser);
    if (!staged) continue;

    console.log(`Validated ${staged.rows.length} staged Scholark accounts.`);
    const result = await importRows(auth, staged.rows, staged.password, existingEmails);
    totalCreated += result.created;
    totalSkipped += result.skipped;

    if (result.failures.length > 0) {
      const counts = result.failures.reduce((acc, code) => {
        acc[code] = (acc[code] || 0) + 1;
        return acc;
      }, {});
      console.error("Import failures by code:", JSON.stringify(counts));
      throw new Error(`${result.failures.length} accounts failed; staging retained for a safe retry.`);
    }

    await cleanupStaging(auth, db, stagingUser, staged.ref);
    completedImports += 1;
  }

  if (completedImports === 0) throw new Error("No complete Scholark staging payload found.");

  console.log(`RESULT_JSON=${JSON.stringify({
    projectId: PROJECT_ID,
    stagedRows: totalCreated + totalSkipped,
    created: totalCreated,
    skippedExisting: totalSkipped,
    failed: 0,
    stagingDeleted: true,
  })}`);
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
