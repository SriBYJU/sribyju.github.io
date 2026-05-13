# GradeScope — Automated Weekly Email System

Sends AI-curated college prep tips to subscribers every **Monday at 8 AM ET**.

## How It Works

- 52 unique weekly tip emails rotate throughout the year (one per week)
- Subscribers are stored in Firestore `email_subscribers` collection
- Users auto-subscribe when creating an account (checkbox on signup form)
- Users can also subscribe via the "Weekly College Tips" banner on the homepage
- Emails are sent via Gmail SMTP using Nodemailer

## Setup (One-Time)

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 2. Upgrade to Firebase Blaze Plan
Scheduled functions require the Blaze (pay-as-you-go) plan.
Go to: https://console.firebase.google.com/project/gradescope-539dd/usage/details

### 3. Create a Gmail App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and your device
3. Copy the 16-character app password

### 4. Set Email Credentials
```bash
cd functions
firebase functions:secrets:set EMAIL_USER
# Enter your Gmail address when prompted

firebase functions:secrets:set EMAIL_PASS
# Enter the 16-character app password when prompted
```

### 5. Deploy
```bash
firebase deploy --only functions
```

## Functions

| Function | Trigger | Description |
|----------|---------|-------------|
| `sendWeeklyEmails` | Scheduled (Monday 8 AM ET) | Sends that week's tips to all active subscribers |
| `sendTestEmail` | HTTP `?email=test@example.com` | Manually send a test email to verify setup |

## Testing

After deploying, test with:
```bash
curl "https://us-central1-gradescope-539dd.cloudfunctions.net/sendTestEmail?email=your@email.com"
```

## Email Content

52 pre-written weekly tip sets covering:
- GPA strategy, study methods, time management
- College applications, essays, interviews
- Financial aid, scholarships, budgeting
- SAT/ACT prep, extracurriculars, campus visits
- Mental health, networking, career planning

Each email contains 5 actionable tips with a branded HTML template.
