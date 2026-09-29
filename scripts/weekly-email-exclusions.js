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

export function loadWeeklyEmailExclusions(encodedParts) {
  if (!Array.isArray(encodedParts) || encodedParts.length !== 2 ||
      encodedParts.some((part) => !part || !/^[A-Za-z0-9+/=\s]+$/.test(part))) {
    throw new Error("Missing or invalid weekly email exclusion secrets.");
  }
  const addresses = new Set();
  for (const encoded of encodedParts) {
    let content;
    try {
      content = gunzipSync(Buffer.from(encoded.replace(/\s/g, ""), "base64")).toString("utf8");
    } catch {
      throw new Error("Weekly email exclusion secret could not be decoded.");
    }
    for (const value of content.split(/\r?\n/)) {
      const email = value.trim().toLowerCase();
      if (email) addresses.add(email);
    }
  }
  if (addresses.size < 11591 || [...addresses].some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new Error("Weekly email exclusion secrets are incomplete or contain invalid addresses.");
  }
  return addresses;
}
