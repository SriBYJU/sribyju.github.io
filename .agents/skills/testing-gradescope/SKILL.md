---
name: testing-gradescope
description: Test GradeScope app end-to-end. Covers local server setup, auth flows, Pro feature gating, SAT/ACT Prep, essay save/load, and UI verification.
---

# Testing GradeScope

## Local Server Setup

1. Start a local server from the repo root:
   ```bash
   cd /home/ubuntu/repos/GradeScope && python3 -m http.server 8080 &
   ```
2. Verify: `curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/index.html` should return `200`
3. The entire app is a single `index.html` file — all HTML, CSS, and JS in one file

## Auth Testing

- **Admin account**: `admin@gradescope.app` / `GradeScope2026!` (has Pro access)
- `isPro()` checks `window.currentUser?.email === 'admin@gradescope.app'`
- After login, nav should show "Admin ▾" (or display name + ▾) instead of "Sign In"
- Auth state comes from Firebase — the `onAuthStateChanged` handler updates `window.currentUser`
- **Gotcha**: If you sign in/out without navigating away from the current page section, some UI elements (like exam card onclick handlers) may have stale state. Navigate away and back to force re-render via the section's `init` function

## Pro Feature Gating

- Pro features: AI Essay Coach, College Quiz, AI Counselor, Full Practice Exams (SAT/ACT)
- Non-Pro users should see a toast: "This feature requires a Pro subscription. Upgrade to access full practice exams!"
- Pro gate exists in two layers: (1) card onclick handler in render functions, (2) defensive check inside the feature function itself (e.g. `startExam()`)
- To test Pro gate: sign out → navigate to feature → click the locked card → verify toast appears and feature does NOT activate

## SAT/ACT Prep Testing

- **Practice questions**: 66 total (26 easy, 20 medium, 20 hard) across Math, Reading, Writing
- **Difficulty filters**: Easy (🟢 1x XP), Medium (🟡 1.5x XP), Hard (🔴 2x XP)
- **XP tracking**: Correct answer = 10 × multiplier. Stats stored in `localStorage` key `gs_prep_state`
- **Full SAT Exam** (Pro): 20 questions, 50 min timer
- **Full ACT Exam** (Pro): 40 questions, 55 min timer
- **Gotcha**: Native `confirm()` dialogs (e.g. "End Exam" button) block browser tool interactions. Dismiss with `xdotool key Return` from shell
- To clear prep state for fresh testing: `localStorage.removeItem('gs_prep_state')` in browser console

## Essay Save/Load Testing

- Essays save to `localStorage` keyed by user UID
- Test flow: write essay → save → sign out → sign in → verify essay in saved list → load → verify text restored → delete → verify removed
- Firestore sync may hang due to security rules — localStorage is the primary storage

## Common Gotchas

- **Stale UI after auth change**: Section-specific UI (exam cards, Pro badges) doesn't auto-update on sign-in/out. Navigate away and back to trigger the section's init function
- **Firestore offline errors**: Firestore may show offline/timeout errors in console — this is expected if security rules aren't configured. Features fall back to localStorage
- **Dark mode**: Toggle at bottom-right corner. State persists in localStorage key `gs_dark_mode`
- **Mobile testing**: Use browser DevTools to set viewport to 375px width for phone simulation

## Devin Secrets Needed

No secrets required for local testing. Firebase auth works client-side with the embedded config.
