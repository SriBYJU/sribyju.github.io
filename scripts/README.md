# GradeScope — Automated Weekly Email System

Sends AI-curated college prep tips to subscribers every **Monday at 8 AM ET** via GitHub Actions. **Completely free** — no Firebase Blaze plan needed.

## How It Works

- GitHub Actions runs `scripts/send-weekly-email.js` every Monday at 12:00 UTC (8 AM ET)
- The script reads active subscribers from Firestore (`email_subscribers` collection)
- Sends a branded HTML email with 5 college prep tips via Gmail SMTP
- 52 unique weekly tip sets rotate throughout the year
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

The workflow will automatically run every Monday. You can also trigger it manually:
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
