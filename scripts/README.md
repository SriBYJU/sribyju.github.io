# Scholark — Automated Weekly Email System

## SAT/ACT 9.6 release gate

The SAT/ACT quality phase stays local until `npm run prep:release` reaches at least **96/100**. Run `npm run prep:audit` for the scored breakdown. The audit uses `prep-official-sources.json` to record the official College Board and ACT publications used for structure, aggregate methodology, and scoring priors; copyrighted questions are not republished or number-swapped.

The current version generates and validates **5,963 original questions** across SAT Reading and Writing, SAT Math, ACT English, ACT Math, ACT Reading, and optional ACT Science. It includes official-size timed simulations, SAT module routing, aligned ACT passage/experiment forms, adaptive topic practice, mistake replay, pacing and confidence analytics, a score-progress timeline, an in-app SAT-style graphing workspace, keyboard-accessible test controls, and safe local/cloud persistence. Score ranges are independent practice estimates with uncertainty; they are not official College Board or ACT scores and do not promise a particular result.

Release verification:

```powershell
cd scripts
npm ci
npm test
npm run check
npm audit --omit=dev
npm run prep:release
```

Sends curated college prep tips every Monday via GitHub Actions. The workflow is scheduled for **13:15 UTC** and does not promise a particular inbox-delivery time.

## How It Works

- GitHub Actions runs `scripts/send-weekly-email.js` every Monday at 13:15 UTC
- The script pages through every Firebase Authentication user (1,000 per page) and combines those addresses with the Firestore `email_subscribers` collection
- Email addresses are normalized, deduplicated, and suppressed when any matching subscriber record is explicitly inactive or unsubscribed
- Sends a branded HTML email with 5 college prep tips via Gmail SMTP
- 52 unique weekly tip sets rotate throughout the year
- A workflow concurrency group and a Firestore lease prevent overlapping sends
- Aggregate eligible, attempted, sent, and failed counts are logged without printing full recipient addresses
- Each message includes a mail-based unsubscribe link and `List-Unsubscribe` header
- You can also trigger the workflow manually from the GitHub Actions tab

## Setup (One-Time)

### 1. Create a Gmail App Password

1. Go to https://myaccount.google.com/apppasswords
2. Sign in to your Google account
3. Select **"Mail"** and your device
4. Click **Generate** and copy the 16-character app password

> **Note:** You need 2-Step Verification enabled on your Google account first.

### 2. Get a Firebase Service Account Key

1. Go to [Firebase Console → Project Settings → Service Accounts](https://console.firebase.google.com/project/gradescope-539dd/settings/serviceaccounts/adminsdk)
2. Click **"Generate new private key"**
3. Download the JSON file (you'll paste its contents as a secret)

### 3. Add GitHub Repository Secrets

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**

Add these 3 secrets:

| Secret Name | Value |
|-------------|-------|
| `EMAIL_USER` | Your Gmail address (e.g. `you@gmail.com`) |
| `EMAIL_PASS` | The 16-character app password from step 1 |
| `FIREBASE_SERVICE_ACCOUNT` | The **entire contents** of the JSON key file from step 2 |

### 4. Done!

The workflow will attempt to send every Monday. Delivery remains subject to Gmail and recipient-provider filtering. You can also trigger it manually:
1. Go to the **Actions** tab in your GitHub repo
2. Select **"Weekly Email"** from the left sidebar
3. Click **"Run workflow"**

## Email Content

52 pre-written weekly tip sets covering:
- GPA strategy, study methods, time management
- College applications, essays, interviews
- Financial aid, scholarships, budgeting
- SAT/ACT prep, extracurriculars, campus visits
- Mental health, networking, career planning

Each email contains 5 actionable tips with a branded HTML template.
