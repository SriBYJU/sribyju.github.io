---
name: testing-gradescope
description: Test GradeScope features end-to-end in the browser. Use when verifying UI, Pro gating, calculators, or new feature PRs.
---

# Testing GradeScope

## Architecture

- **Single-file app**: Everything is in `index.html` (~4700+ lines of HTML/CSS/JS)
- **Backend**: Firebase Auth + Firestore (client-side SDK)
- **Storage**: localStorage for transient state (SAT Prep progress, dark mode, email subs), Firestore for user profiles
- **Feature gating**: `isPro()` function checks `getUserPlan()` which returns `'pro'` for admin emails

## Running Locally

```bash
cd /home/ubuntu/repos/GradeScope
python3 -m http.server 8080
# Open http://localhost:8080/index.html
```

## Devin Secrets Needed

No secrets required for basic testing. The app uses Firebase client-side auth which works without server credentials.

## Test Accounts

- **Admin (Pro)**: `admin@gradescope.app` / `GradeScope2026!`
  - Has all Pro features unlocked via `ADMIN_EMAILS` constant
  - No trial/subscription needed — `getUserPlan()` returns `'pro'` immediately
- You can create test accounts via the signup form (free tier)

## Key Testing Patterns

### Pro Feature Gating
- Pro features: AI Essay Coach, AI Counselor, Study Planner, Scholarship Finder, College Quiz (full results)
- Free features: GPA calculators, SAT Prep, College Comparison, Dark Mode, Community Q&A
- Gate check: `isPro()` → `getUserPlan()` → checks `ADMIN_EMAILS` array first, then `window._gsProfile?.plan`
- Admin email bypasses all plan checks

### localStorage-Dependent Features
- **SAT Prep**: State stored in `gs_prep_state` key — clear with `localStorage.removeItem('gs_prep_state')` before testing to get fresh state
- **Dark Mode**: Stored in `gs_dark_mode` key
- **Email subscriptions**: Stored in `gs_email_subs` key
- Always clear relevant localStorage before testing to ensure clean initial state

### Navigation Entry Points
All features are accessible from 3 places:
1. **Nav bar** (top): Direct buttons for major features
2. **Hero section** (home page): "Jump to a calculator" cards
3. **Profile dropdown** (when logged in): Full feature menu

### Known Issues
- **AI features (Essay Coach, AI Counselor) lack API keys**: The fetch calls to `api.anthropic.com` are missing the `x-api-key` header. They will fail with a graceful error message. Test the UI flow and error handling, not the AI response content.
- **Firestore may timeout**: If Firestore rules aren't configured, DB calls may hang. The app uses localStorage fallbacks for most features, so core functionality still works.
- **Google Sign-In**: Requires the Google provider to be enabled in Firebase Console. If not enabled, the popup will fail (but error message should be visible).

## Testing Checklist

1. **Auth flow**: Sign up → verify modal closes + nav updates → sign out → sign in → verify persistence
2. **Pro gating**: Sign in as admin → verify Pro features show content (not upgrade prompt)
3. **SAT Prep**: Clear localStorage → answer 5+ questions → verify XP/streak/accuracy math → verify score prediction appears after exactly 5 questions
4. **College Comparison**: Select 2 colleges → verify radar chart renders (non-blank canvas) → verify data table matches `COLLEGE_DATA` constants → verify reset clears state
5. **Mobile**: Test at 375px viewport width — verify no horizontal overflow, inputs stack properly
6. **Dark mode**: Toggle → verify persistence after refresh

## Tips

- The app is a single HTML file — use browser search or grep with line numbers to find specific functions
- `showPage('pagename')` is the navigation function — each feature has a page ID
- Score prediction formula: `min(400 + (accuracy% / 100) * 1200, 1600)` — verify with known inputs
- When testing newsletter checkbox on signup, it's required — unchecking blocks account creation
- No CI is configured on this repo, so all testing is manual browser-based
