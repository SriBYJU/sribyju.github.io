# Scholark Security Policy

Scholark is a public, student-built educational project. The frontend repository must never contain private credentials.

## Secrets policy

- Never commit private API keys, service-account files, passwords, signing keys, access tokens, or provider secrets.
- Store server-side credentials in the hosting or CI secret store (for example, GitHub Actions Secrets) and access them only from trusted backend/server-side code.
- Browser code may contain **public client configuration** that a provider explicitly designs to be public. Firebase web configuration falls into this category; it is not an authentication secret. Firebase data must instead be protected by Authentication, Firestore Security Rules, authorized domains, quotas, and related controls.
- If a true secret is ever committed, remove it from use and rotate/revoke it immediately. Deleting it from the latest file is not enough because Git history can preserve old values.

## Automated checks

`scripts/secret-scan.js` scans public source files for common private-key and token patterns. The `Frontend secret scan` GitHub Actions workflow runs on pushes and pull requests.

## HTTPS

The production site is hosted on GitHub Pages, which redirects the public HTTP URL to HTTPS. Scholark also includes a browser-side HTTPS fallback redirect for non-localhost environments.

## Reporting

If you discover a security issue, avoid posting sensitive exploit details publicly. Use the repository owner's private contact method when available and include only the information needed to reproduce and fix the issue safely.
