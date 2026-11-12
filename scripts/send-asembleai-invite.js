/**
 * One-time AsembleAI/Scholark live showcase invitation.
 * Scheduled for November 12, 2026 at 08:00 America/New_York.
 * Uses the exact eligibility/exclusion logic of the weekly newsletter.
 * Idempotent: recipient send claims are recorded before SMTP attempts.
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { createTransport } from "nodemailer";
import { createHash } from "node:crypto";
import { getEligibleRecipients, redactEmailAddresses } from "./send-weekly-email.js";
import { loadWeeklyEmailExclusions } from "./weekly-email-exclusions.js";

const CAMPAIGN = "asembleai-live-invite-2026-11-12";
const URL = "https://luma.com/ooihcl9e";
const SUBJECT = "You Use Scholark. Now See What You've Been Missing. 🚀";
const ESCAPE = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function assertSendWindow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date());
  const fields = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  if (fields.year !== "2026" || fields.month !== "11" || fields.day !== "12" ||
      Number(fields.hour) < 8 || Number(fields.hour) > 11) {
    throw new Error("Outside the one-time November 12, 2026 8:00–11:59 AM EST send window.");
  }
}

function makeEmail(sender) {
  const unsub = "mailto:" + encodeURIComponent(sender).replace(/%40/g, "@") +
    "?subject=" + encodeURIComponent("Unsubscribe from Scholark weekly tips");
  const plain = [
    "Hey Scholark Community!",
    "",
    "You've used Scholark to simplify your academic journey. But what if you've only scratched the surface of what it can do?",
    "",
    "I'm excited to invite you to a live showcase hosted by AsembleAI, where I'll be demonstrating Scholark's most powerful features, sharing the story behind its creation, and showing you how to get even more out of the platform.",
    "",
    "And there's more. You'll also get a firsthand look at two of my other projects:",
    "",
    "🎓 Scholark — Unlock powerful academic tools and college-planning features you may not even know exist.",
    "💼 Capital Mastery — Explore 16 finance career pathways, hands-on training, and 80+ free credentials.",
    "🔐 DataShadow — Discover my patent-pending approach to data privacy and intelligent data valuation.",
    "",
    "Three platforms. One live event. A behind-the-scenes look at how they were built at just 16.",
    "",
    "📅 Saturday, November 21, 2026",
    "🕚 11:00 AM EST",
    "🎟️ Free to attend | LinkedIn Live",
    "",
    "REGISTER FOR FREE: " + URL,
    "",
    "I'll be sharing live demonstrations, insights into the technology, and answering your questions directly.",
    "",
    "I'd love to see the Scholark community there. Save your spot!",
    "",
    "See you live,",
    "Shriyan Avadhanula",
    "Founder, Scholark & Capital Mastery",
    "",
    "You're receiving this email because you have a Scholark account or subscribed to weekly updates.",
    "To unsubscribe, contact " + sender + " with the subject 'Unsubscribe from Scholark weekly tips'."
  ].join("\n");

  const html = [
    '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>',
    '<body style="margin:0;padding:30px 14px;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#17213a;">',
    '<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e7f0;">',
    '<div style="background:#172a6b;color:#fff;padding:24px 32px;"><div style="font-size:12px;letter-spacing:2px;font-weight:700;">SCHOLARK</div><h1 style="font-size:26px;line-height:1.25;margin:14px 0 0;color:#fff;">You use Scholark.<br>See what you’ve been missing.</h1></div>',
    '<div style="padding:28px 32px;font-size:15px;line-height:1.7;">',
    '<p style="margin-top:0;">Hey Scholark Community!</p>',
    '<p>You’ve used Scholark to simplify your academic journey. But <strong>what if you’ve only scratched the surface of what it can do?</strong></p>',
    '<p>I’m excited to invite you to a <strong>live showcase hosted by AsembleAI</strong>, where I’ll demonstrate Scholark’s most powerful features, share the story behind its creation, and show you how to get even more out of the platform.</p>',
    '<p>And there’s more. You’ll also get a firsthand look at two of my other projects:</p>',
    '<p>🎓 <strong>Scholark</strong> — Unlock academic tools and college-planning features you may not even know exist.<br>💼 <strong>Capital Mastery</strong> — Explore 16 finance career pathways, hands-on training, and 80+ free credentials.<br>🔐 <strong>DataShadow</strong> — Discover my patent-pending approach to data privacy and intelligent data valuation.</p>',
    '<p style="font-weight:700;font-size:16px;">Three platforms. One live event. A behind-the-scenes look at how they were built at just 16.</p>',
    '<p>📅 <strong>Saturday, November 21, 2026</strong><br>🕚 <strong>11:00 AM EST</strong><br>📍 LinkedIn Live &nbsp; · &nbsp; 🎟️ Free to attend</p>',
    '<p style="text-align:center;margin:28px 0;"><a href="' + URL + '" style="background:#3159e6;color:#fff;padding:15px 24px;text-decoration:none;border-radius:9px;font-weight:700;display:inline-block;">REGISTER FOR FREE →</a></p>',
    '<p>I’ll be sharing live demonstrations, insights into the technology, and answering your questions directly.</p>',
    '<p><strong>I’d love to see the Scholark community there. Save your spot!</strong></p>',
    '<p>See you live,<br><strong>Shriyan Avadhanula</strong><br>Founder, Scholark &amp; Capital Mastery</p>',
    '</div><div style="background:#f6f8fc;padding:18px 32px;font-size:12px;line-height:1.6;color:#606a80;">',
    'You’re receiving this because you have a Scholark account or subscribed to weekly updates. ',
    '<a href="' + ESCAPE(unsub) + '" style="color:#3159e6;">Unsubscribe from Scholark emails</a>.',
    '</div></div></body></html>'
  ].join("\n");
  return { text: plain, html, unsub };
}

async function main() {
  // GitHub cron expressions have no year field. Future years must never resend.
  if (new Date().getUTCFullYear() > 2026) {
    console.log("One-time 2026 campaign expired; no messages sent.");
    return;
  }
  assertSendWindow();
  const service = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "null");
  const sender = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASS;
  if (!service || !sender || !password) throw new Error("Missing Firebase or SMTP configuration.");
  const exclusions = loadWeeklyEmailExclusions([
    process.env.WEEKLY_EMAIL_EXCLUSIONS_GZIP_BASE64,
    process.env.WEEKLY_EMAIL_EXCLUSIONS_GZIP_BASE64_2
  ]);
  initializeApp({ credential: cert(service) });
  const db = getFirestore();
  const recipients = await getEligibleRecipients(getAuth(), db, exclusions);
  const campaignRef = db.collection("email_campaigns").doc(CAMPAIGN);
  const { text, html, unsub } = makeEmail(sender);
  const transport = createTransport({ service: "gmail", auth: { user: sender, pass: password } });
  const totals = { eligible: recipients.length, attempted: 0, sent: 0, failed: 0, alreadyClaimed: 0 };

  console.log("Scholark AsembleAI invitation: eligible recipients:", totals.eligible);
  for (const email of recipients) {
    const hashed = createHash("sha256").update(email).digest("hex");
    const claim = campaignRef.collection("recipients").doc(hashed);
    try {
      await claim.create({ status: "attempting", claimedAt: FieldValue.serverTimestamp() });
    } catch (error) {
      if (error.code === 6 || error.code === "already-exists") {
        totals.alreadyClaimed++;
        continue;
      }
      throw error;
    }
    totals.attempted++;
    try {
      await transport.sendMail({
        from: '"Scholark" <' + sender + '>',
        to: email,
        subject: SUBJECT,
        text,
        html,
        headers: { "List-Unsubscribe": "<" + unsub + ">" }
      });
      totals.sent++;
      await claim.update({ status: "sent", sentAt: FieldValue.serverTimestamp() });
      console.log("Sent recipient:", hashed.slice(0, 10));
    } catch (error) {
      totals.failed++;
      console.error("Send failed:", hashed.slice(0, 10), redactEmailAddresses(error.message));
      await claim.update({ status: "failed", failedAt: FieldValue.serverTimestamp() });
    }
    await new Promise((resolve) => setTimeout(resolve, 700));
  }

  await campaignRef.set({ ...totals, finishedAt: FieldValue.serverTimestamp(), subject: SUBJECT, eventUrl: URL }, { merge: true });
  console.log("Campaign totals:", JSON.stringify(totals));
  if (totals.failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Campaign failed:", redactEmailAddresses(error.message));
  process.exitCode = 1;
});
