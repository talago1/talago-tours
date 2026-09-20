# TALAGO TOURS — Custom Domain, SEO & Marketing Operations Guide

This guide provides step-by-step instructions for connecting your custom domain, submitting your sitemap to Google Search Console for rapid indexing, utilizing the new Review Management Desk, and launching promo campaigns.

---

## 1. Connecting Your Custom Domain on Vercel

To connect your custom domain (e.g., `talago-tours.com` or `talagotours.com`):

### Step 1: Add Domain in Vercel Dashboard
1. Go to **[vercel.com](https://vercel.com)** and log in.
2. Select the **`talago-tours`** project.
3. Click **Settings** > **Domains**.
4. Type your domain (e.g. `talago-tours.com`) and click **Add**.
5. Vercel will prompt you to add both `talago-tours.com` and `www.talago-tours.com` (recommended: redirect `www` to root or vice versa).

### Step 2: Configure DNS Records at Your Domain Registrar (Namecheap, GoDaddy, Cloudflare, etc.)
Log in to where you bought your domain, go to the **DNS Management / Advanced DNS** section, and add:

| Type | Host / Name | Value / Points To | TTL |
| :--- | :--- | :--- | :--- |
| **A Record** | `@` (or blank) | `76.76.21.21` | Automatic / 3600 |
| **CNAME Record** | `www` | `cname.vercel-dns.com` | Automatic / 3600 |

*Note: SSL certificate generation happens automatically in Vercel within 5–15 minutes after DNS propagation.*

### Step 3: Update `NEXT_PUBLIC_APP_URL` on Vercel
1. In Vercel, go to **Settings** > **Environment Variables**.
2. Find `NEXT_PUBLIC_APP_URL` (or add it if missing).
3. Set value to: `https://yourdomain.com` (replace with your actual live domain).
4. Save and trigger a redeployment (or push a commit) so metadata, canonical tags, and `sitemap.xml` dynamically generate links using your official domain.

---

## 2. Google Search Console & Instant Indexing

Now that your sitemap has been updated to include **all 33 active tours** across 7 languages, follow these steps to get indexed on Google:

### Step 1: Verify Ownership in Google Search Console
1. Go to **[search.google.com/search-console](https://search.google.com/search-console)**.
2. Click **Add Property**.
3. Choose **Domain** (e.g. `talago-tours.com`) and add the TXT record to your DNS, OR choose **URL Prefix** (`https://talago-tours.com`) and verify via HTML tag or DNS.

### Step 2: Submit Your Dynamic Sitemap
1. In the left navigation, click **Sitemaps**.
2. In the "Add a new sitemap" input, enter:
   ```text
   sitemap.xml
   ```
3. Click **Submit**.
4. Status will switch to **Success**, discovering:
   - Homepage & Core pages (`/`, `/tours`, `/destinations`, `/about`, `/faq`, etc.)
   - All **33 Tours** with full multilingual hreflang links (`en`, `de`, `ru`, `it`, `fr`, `pl`, `es`).

### Step 3: Request Priority Indexing for Key Pages
1. Use the URL Inspection bar at the top of Google Search Console.
2. Enter your homepage: `https://yourdomain.com/` and click **Request Indexing**.
3. Inspect your top 5 tours (e.g. Orange Bay, Quad Safari, Dolphin House, Luxor VIP) and click **Request Indexing** to expedite crawler discovery within 24–48 hours.

---

## 3. Verified Review Desk (`/admin/reviews`)

The platform now features a dedicated moderation and creation hub for guest reviews:

- **Add Custom Reviews**: Click **"+ Add Review"** to select any tour, enter the customer's name, choose a star rating (1–5), and write an authentic review in English, German, Russian, Italian, etc.
- **Real-Time Score Calibration**: When you publish, edit, or delete a review, the tour's `ratingAverage` (e.g., 4.9★) and `ratingCount` are automatically re-calculated from actual approved records in the database.
- **Tour Filtering**: Use the **Tour Filter** dropdown to view and manage reviews tour-by-tour.

---

## 4. Promo Code Campaigns (`/admin/campaigns`)

The Campaign Manager is now styled in the luxury dark theme with KPI metrics:

- **Creating a Promo**: Set Code (e.g. `VIP15`), Discount Type (% or Fixed $), Min Order spend, Maximum redemptions, and Expiration date.
- **1-Click Shareable URLs**: Click the **Share icon** next to any code to copy a link like:
  ```text
  https://talago-tours.com/tours?promo=SUMMER20
  ```
  When travelers open this link, the promo code is automatically stored and applied at checkout.

---

## 5. Hero & Multilingual Content Controls (`/admin/settings`)

In `/admin/settings`:
- Under the **Hero Section**, click any language flag (`EN`, `DE`, `RU`, `IT`, `FR`, `PL`, `ES`) to customize:
  - Hero Top Badge
  - Main Headline
  - Brand Slogan (*"Not a Tour. A Memory."*)
  - Description
  - CTA Button Texts
  - Featured Tour Card (Title, Price tag, Excerpt, Target link)
- If left empty, the site automatically uses the hand-crafted localized defaults.

---

## 6. Payment Methods & Checkout Controls (`/admin/settings`)

Under **Payment Methods & Checkout Visibility**, manage which payment options are accessible to visitors at checkout:

- **Full Online Payment**: Enable or disable upfront credit card payment. When turned off, guests will not see the option to pay in full online.
- **Pay at Location / Cash on Arrival**: Enable or disable the option for travelers to pay cash in person upon hotel pickup.
- **Deposit Option & Deposit %**: Allow travelers to pay a partial deposit online (e.g. 15%, 20%) and settle the remainder in cash at pickup.
- **Payment Link Dispatch**: Enable manual payment link sending workflows for custom concierge bookings.

---

## 7. Excursion Logistics Hub & WhatsApp Dispatch (`/admin/bookings`)

Click any booking row in `/admin/bookings` to expand the excursion logistics desk:

- **Hotel & Room Details**: Displays hotel name, room number, pickup instructions, and a 1-click **Open Map Search** link to locate the guest's hotel immediately.
- **Pickup Schedule**: Highlights the scheduled pickup time in amber alongside the tour date and guest count breakdown (Adults, Children, Infants).
- **Cash Due at Pickup**: Prominently highlights in amber the exact remaining cash amount due to be collected by your tour guides or drivers upon pickup.
- **1-Click WhatsApp Button**: Click **"Chat on WhatsApp"** to immediately open WhatsApp with a pre-filled, localized message containing the guest's booking reference, tour date, and pickup time.

---

## 8. Tour Add-ons & Pickup Schedule Editor (`/admin/tours`)

When creating or editing tours in `/admin/tours`:

- **Tour Options & Extras**: Define optional add-ons (such as Photo Packages, Private Speedboat Upgrades, VIP Transfers). For each option, set:
  - English Title & Russian Title
  - USD Price
  - Calculation Type: **Per Person** (multiplies by guest count) or **Flat Rate** (fixed per booking)
  - Active Toggle (enable/disable without deleting)
- **Pickup Times Schedule**: Add multiple daily departure/pickup times (e.g. `08:00 AM`, `01:30 PM`). These are displayed directly to guests during checkout and synced with driver pickup logs.

