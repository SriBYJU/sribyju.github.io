import { gunzipSync } from "node:zlib";

const PLACEHOLDER_DOMAINS = new Set([
  "example.com",
  "example.net",
  "example.org",
  "sample.com",
  "sample.net",
  "test.com",
  "test.net",
  "test.org",
  "localhost",
]);

export function isPlaceholderAddress(email) {
  const domain = String(email).trim().toLowerCase().split("@").at(-1);
  return PLACEHOLDER_DOMAINS.has(domain) ||
    domain.endsWith(".example") ||
    domain.endsWith(".test") ||
    domain.endsWith(".invalid") ||
    domain.endsWith(".localhost");
}

export function loadWeeklyEmailExclusions(encoded) {
  if (!encoded || !/^[A-Za-z0-9+/=\s]+$/.test(encoded)) {
    throw new Error("Missing or invalid WEEKLY_EMAIL_EXCLUSIONS_GZIP_BASE64 secret.");
  }
  let content;
  try {
    content = gunzipSync(Buffer.from(encoded.replace(/\s/g, ""), "base64")).toString("utf8");
  } catch {
    throw new Error("WEEKLY_EMAIL_EXCLUSIONS_GZIP_BASE64 could not be decoded.");
  }
  const addresses = new Set(content.split(/\r?\n/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean));
  if (addresses.size < 1591 || [...addresses].some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new Error("WEEKLY_EMAIL_EXCLUSIONS_GZIP_BASE64 is incomplete or contains invalid addresses.");
  }
  return addresses;
}
