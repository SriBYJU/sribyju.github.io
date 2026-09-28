# Weekly email recovery

The old Gmail SMTP sender cannot deliver to the current audience of about
10,000 people each week. The September 21 and September 28, 2026 runs were
partial: 94 and 91 messages, respectively, were accepted before Gmail
throttled authentication. Do not rerun either old workflow attempt.

## Required before enabling the replacement

1. Set up a bulk email provider plan with capacity for at least the current
   audience each week. The replacement code targets Resend's Email API.
   Resend's free plan is too small for this audience.
2. Verify a sending domain with the provider. Configure SPF, DKIM, and DMARC
   for that domain and use a sender address on it.
3. Add repository secret `RESEND_API_KEY`.
4. Add repository variables `EMAIL_FROM` (for example,
   `Scholark <tips@example.com>`) and `EMAIL_UNSUBSCRIBE_ADDRESS` (a
   monitored mailbox that actually processes opt-outs).
5. Verify the current list has a valid subscription basis and that opt-outs
   in `email_subscribers` are current. Set up a working one-click
   unsubscribe endpoint before sending at bulk scale; a mailto link alone
   does not meet Gmail's one-click requirement for subscribed messages sent
   at 5,000 or more per day to personal Gmail accounts.
6. Test the provider account and sender with a separate small test audience,
   then set repository variable `WEEKLY_EMAIL_ENABLED=true` to enable the
   scheduled workflow. Until then the job is skipped. Do not dispatch a catch-up run for
   September 28 without reconciling the 91 previously accepted messages.

The job now fails before sending if its provider configuration is absent.
For each new Monday UTC, it stores one campaign number and one delivery
record per recipient in Firestore. Accepted deliveries are skipped on a
same-week retry. Pending deliveries older than 23 hours are held for manual
reconciliation because the provider's idempotency keys expire after 24 hours.
The job stops at the first send error and reports partial counts.
