# TALAGO Tours — Transactional Email Configuration Guide

This document describes how transactional emails (magic sign-in links, booking confirmations, admin replies, abandoned checkout recovery, and review invitations) are configured and sent via **Brevo API v3**.

---

## 1. Overview & Provider Architecture

Talago Tours uses **Brevo (formerly Sendinblue)** as the primary transactional email provider.

- **Primary Provider:** Brevo API v3 (REST endpoint `https://api.brevo.com/v3/smtp/email`)
- **Secondary / Optional:** Resend (active only if explicitly chosen via `EMAIL_PROVIDER=resend`)
- **Default Sender:** Centrally governed by `BREVO_FROM_EMAIL` and `BREVO_FROM_NAME`

> [!IMPORTANT]
> **Brevo requires sender verification.** You cannot send emails from arbitrary or unverified domains like `noreply@talago.com`. The sender email in `BREVO_FROM_EMAIL` **must** be an address that is either directly verified under your Brevo account or belongs to a verified sending domain in your Brevo dashboard.

---

## 2. Required Environment Variables

Configure these variables in **Vercel** (Production, Preview, and Development):

| Variable Name | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `EMAIL_PROVIDER` | No | `brevo` | Explicitly selects transactional provider (`brevo` or `resend`). |
| `BREVO_API_KEY` | **Yes** | `xkeysib-...` | Your Brevo REST API v3 key (found in Brevo: SMTP & API > API Keys). |
| `BREVO_FROM_EMAIL` | **Yes** | e.g. `loca.koca9@gmail.com` or `bookings@yourdomain.com` | **Single source of truth for email sender.** Must be verified in Brevo. |
| `BREVO_FROM_NAME` | No | `TALAGO Experiences` | Friendly sender name displayed to recipients. |
| `RESEND_API_KEY` | Optional | `re_...` | Only used if `EMAIL_PROVIDER=resend`. |
| `RESEND_FROM_EMAIL` | Optional | `TALAGO <onboarding@resend.dev>` | Resend from-address. |

---

## 3. How to Configure Senders in Brevo

### Option A: Use a Verified Personal / Business Email (Fastest)
1. Log in to your [Brevo Dashboard](https://app.brevo.com).
2. Go to **Senders, Domains & Dedicated IPs** → **Senders** (`https://app.brevo.com/senders`).
3. Click **Add a Sender**.
4. Enter your Name (e.g. `TALAGO Experiences`) and Email (e.g. `yourname@gmail.com` or your business email).
5. Brevo will send a 6-digit confirmation code or verification link to that inbox.
6. Verify the email.
7. Set `BREVO_FROM_EMAIL` in Vercel to this exact verified email.

### Option B: Authenticate Your Custom Domain (Recommended for Production)
1. In Brevo, go to **Senders, Domains & Dedicated IPs** → **Domains**.
2. Click **Add a Domain** (e.g. `talago-tours.com`).
3. Brevo will display **DKIM** (TXT) and **Brevo code** DNS records.
4. Add these DNS records in your domain registrar / DNS provider (e.g. Cloudflare, Namecheap, GoDaddy).
5. Click **Verify & Authenticate**.
6. Once authenticated, any address at that domain (e.g. `booking@talago-tours.com`, `concierge@talago-tours.com`) can be used as `BREVO_FROM_EMAIL` without individual verification.

---

## 4. How to Update Variables in Vercel

1. Go to your [Vercel Dashboard](https://vercel.com).
2. Select the `talago-tours` project.
3. Navigate to **Settings** → **Environment Variables**.
4. Add or edit:
   - `EMAIL_PROVIDER` = `brevo`
   - `BREVO_API_KEY` = `<your-brevo-api-key>`
   - `BREVO_FROM_EMAIL` = `<your-verified-email>`
   - `BREVO_FROM_NAME` = `TALAGO Experiences`
5. Select environments: **Production**, **Preview**, and **Development**.
6. Click **Save**.
7. **Redeploy**: Environment variable changes take effect on subsequent builds. Go to **Deployments** → click the three dots on your latest deployment → click **Redeploy** (or push a new commit).

---

## 5. How to Test Email Delivery

1. Open your Talago website (Production or Preview): `https://talago-tours.vercel.app/login` (or `/auth`).
2. Enter a real email address you have access to.
3. Click **"Send Sign-In Link"**.
4. Check results:
   - **Success:** The UI displays `"Check your inbox — we sent you a sign-in link."`
   - **Customer Inbox:** Open the email from `TALAGO Experiences` with subject `"Your TALAGO sign-in link"`.
   - Click the button to confirm it logs you in directly.
   - **Failure:** If Brevo rejects the sender (e.g., if `BREVO_FROM_EMAIL` is not verified), the API returns a descriptive error message indicating the provider issue without exposing secrets.
5. In development locally:
   Add `BREVO_FROM_EMAIL=your-verified-email` to your local `.env` file and test `/api/auth/magic-link`.
