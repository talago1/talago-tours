# TALAGO — Owner Guide: Centralized Company & Legal Profile

This guide explains how you (the platform owner) can enter and manage all official corporate identity, commercial registration, Egyptian tax credentials, and tourism licenses directly through the secure Admin Dashboard.

> **Privacy & Security Guarantee:**  
> Never send your Commercial Register numbers, Tax Cards, or confidential corporate documents to AI prompts or chat logs. Everything is entered privately by you inside your authenticated Admin Dashboard and stored securely in your database.

---

## 1. Where to Access the Profile

You can access the Company & Legal Profile from either of these paths in your Admin Dashboard:
- **Direct Link:** `https://talago-tours.com/admin/settings/company` (or `http://localhost:3000/admin/settings/company`)
- **Via Navigation:** Go to **Admin → Settings → "Company & Legal Profile"** (the first tab in the Settings sidebar, next to Contact Info).

---

## 2. Step-by-Step Field Instructions

The dashboard is organized into 5 focused tabs:

### Tab 1 — Corporate Identity
| Field | Where to Find in Official Documents | Public or Private? | Guidance / Example |
| :--- | :--- | :--- | :--- |
| **Legal Company Name (English)** | Top line of your Egyptian Commercial Register certificate (السجل التجاري) or GAFI Articles of Association. | Private by default; public if disclosure is enabled. | e.g., *Talago Tours for Tourism & Excursions LLC* |
| **Arabic Legal Name (الاسم العربي)** | Listed on your Commercial Register under (اسم الشركة أو المنشأة). | Private by default; public if disclosure is enabled. | e.g., *شركة تالاجو للخدمات والرحلات السياحية ذ.م.م* |
| **Commercial Trading Name** | Your consumer-facing trademark or brand name. | Public | Set to `TALAGO` |
| **Legal Entity Type** | Specified in your incorporation documents. | Public | Select *Limited Liability Company (LLC)*, *Sole Proprietorship*, or *Joint Stock*. |
| **Commercial Registration No. (رقم السجل التجاري)** | Found on the top-right box of your Egyptian Commercial Register extract (مستخرج السجل التجاري). Usually 5 to 7 digits. | **STRICTLY PRIVATE** by default. Only shown on `/terms` if you toggle the disclosure switch. | e.g., `123456` |
| **Tax Card Number (رقم البطاقة الضريبية)** | Stated on your plastic Egyptian Tax Card issued by the Egyptian Tax Authority (مصلحة الضرائب المصرية). Unified 9-digit format (`XXX-XXX-XXX`). | **STRICTLY PRIVATE** by default. Only shown on invoice/payment terms if you toggle the disclosure switch. | e.g., `123-456-789` |
| **VAT Registration (ضريبة القيمة المضافة)** | Found on your VAT Registration Certificate (شهادة تسجيل ضريبة القيمة المضافة) if registered. | Private by default. | Optional |
| **Registered Jurisdiction** | Stated on your corporate certificate. | Public | e.g., *Red Sea Governorate, Arab Republic of Egypt* |

---

### Tab 2 — Tourism Licenses & Authorizations
Use this tab to record all operational permits issued by the Egyptian Ministry of Tourism and Antiquities (وزارة السياحة والآثار):
- **Click "+ Add License Record"** to add a new license.
- **License Number:** The official permit number (e.g. `2481-MOT`).
- **Licensing Authority:** The issuing ministry or chamber (e.g. *Ministry of Tourism and Antiquities* or *Egyptian Travel Agents Association ETAA*).
- **Issue & Expiry Dates:** Enter the dates stated on the permit. The dashboard automatically calculates expiry alerts and warns you 30 days before expiration.
- **Public Disclosure Toggle:** Check this box if you want this specific license number displayed in the website footer or on customer booking vouchers.

---

### Tab 3 — Registered Address & Official Contacts
- **Registered Street Address & Office:** The official physical headquarters in Hurghada or Cairo as registered with local authorities.
- **Customer Support Email & WhatsApp:** The live channels used by travelers for pickup inquiries and day-to-day concierge assistance.
- **Legal Notice & Complaints Email:** Dedicated email addresses (e.g. `legal@talago-tours.com` and `care@talago-tours.com`) for formal inquiries and traveler escalation.

---

### Tab 4 — Operating Model (Marketplace Delineation)
This section clearly articulates Talago's commercial role:
1. **Commercial Role:** Select *Tourism Booking Marketplace & Intermediary Platform*.
2. **Supplier Relationship:** Affirms that excursions, guided quad safaris, and boat trips are conducted by vetted, licensed local operating partners.
3. **Booking Confirmation:** Clarifies that Talago issues instant digital booking vouchers and boarding passes confirming guest spots with suppliers.
4. **Payments & Refunds:** Confirms that customer payments and authorized refunds are handled through licensed payment service providers in compliance with Egyptian banking regulations.

---

### Tab 5 — Public Disclosure Controls (Your Master Privacy Switches)
You have granular control over what the public sees:
- **Disclose Commercial Register Number:** Unchecked by default. Check to publish on `/terms`.
- **Disclose Tax Card Number:** Unchecked by default. Check to publish on `/payments-and-pricing`.
- **Display Full Street Address:** When checked, your building and street address are shown in the website footer.
- **Display Marketplace Intermediary Notice:** When checked, the legal pages clearly communicate that tours are performed by vetted independent local operators.

---

## 3. Saving & Reviewing Your Changes

1. You can fill out fields partially and click **"Save Profile"** at any time. You do not need to enter everything in one sitting.
2. The **Profile Completeness Bar** at the top will track your progress from 0% to 100% and list any pending items.
3. All changes take effect immediately across all legal pages (`/terms`, `/booking-terms`, `/cancellation`, `/privacy`, `/payments-and-pricing`) without needing a new software build.
