# Free refinement: owner checklist

## Shipped configuration

No hosted proxy, API key, billing account, or Cloudflare setup is required. The offline compressor is always available after the workspace loads. An optional **on-device AI refine** button uses Scholark’s existing local model runtime. Student text stays in-browser.

The proposed Gemini free-tier proxy was deliberately replaced: [Gemini API terms](https://ai.google.dev/gemini-api/terms) currently prohibit API clients directed toward or likely accessed by under-18s, and unpaid processing has separate data-use provisions. An age checkbox on a high-school website would not resolve that application-level restriction. Do not configure a Gemini key for Scholark.

## If considering an eligible hosted alternative later

1. Verify the provider permits the actual student audience, regions, and data processing. Confirm a genuinely free quota without automatic billing.
2. Use a server-only secret, never a browser key. Review provider terms and retention before choosing the service.
3. A proxy must verify Firebase token signature, issuer, audience, subject and expiry; allow-list exact origins; enforce durable per-UID/IP quotas; bound request size; use timeouts; log no student text.
4. Require explicit off-device consent and update the privacy notice before enabling an endpoint. Never send essays.
5. Validate response schema, character limits, factual vocabulary, roles, and all numbers. Treat embedded instructions as activity data. On errors or quota exhaustion, keep the offline compressor available.
6. Test unauthorized requests, CORS, throttling, injection, network failures, and deletion/retention behavior before any rollout.

No hosted endpoint is implemented or enabled by this release. This is an intentional alternative, not a hidden dependency waiting for a secret.
