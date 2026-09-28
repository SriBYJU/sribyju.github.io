import { createHash } from "node:crypto";

export function mondayUtcKey(now = new Date()) {
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

export function deliveryId(weekKey, email) {
  const hash = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  return `${weekKey}_${hash}`;
}

export function isRecentPending(record, nowMs = Date.now()) {
  return record?.status === "pending" && nowMs - record.reservedAtMs < 23 * 60 * 60 * 1000;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class ResendEmailClient {
  constructor({ apiKey, from, fetchImpl = fetch, sleep = delay, minIntervalMs = 600 }) {
    if (!apiKey || !from) throw new Error("Missing RESEND_API_KEY or EMAIL_FROM.");
    this.apiKey = apiKey;
    this.from = from;
    this.fetchImpl = fetchImpl;
    this.sleep = sleep;
    this.minIntervalMs = minIntervalMs;
    this.nextSendAt = 0;
  }

  async send({ to, subject, html, unsubscribeHeader, idempotencyKey }) {
    const waitMs = this.nextSendAt - Date.now();
    if (waitMs > 0) await this.sleep(waitMs);
    this.nextSendAt = Date.now() + this.minIntervalMs;

    const payload = {
      from: this.from,
      to: [to],
      subject,
      html,
      headers: { "List-Unsubscribe": unsubscribeHeader },
    };
    for (let attempt = 0; attempt < 5; attempt++) {
      let response;
      try {
        response = await this.fetchImpl("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30000),
        });
      } catch (error) {
        // A timeout can happen after acceptance. Reuse the same provider
        // idempotency key so a prompt retry cannot send a duplicate.
        if (attempt === 4) throw error;
        await this.sleep(Math.min(1000 * 2 ** attempt, 8000));
        continue;
      }
      const body = await response.json().catch(() => ({}));
      if (response.ok && body.id) return body.id;
      const error = new Error(`Resend HTTP ${response.status}: ${body.name || "send rejected"}`);
      error.status = response.status;
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 4) throw error;
      const retryAfter = Number(response.headers?.get?.("retry-after"));
      await this.sleep(Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 30000)
        : Math.min(1000 * 2 ** attempt, 8000));
    }
  }
}
