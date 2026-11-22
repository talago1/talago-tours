# TALAGO — Legal, Compliance & Corporate Governance Review

**Document Version:** 1.0.0  
**Date:** November 15, 2026  
**Status:** Audit Completed — Pending Owner Corporate Details  
**Platform:** [talago-tours.vercel.app](https://talago-tours.vercel.app)

---

## 1. Executive Summary

This document establishes the verified operational facts, compliance baseline, and open corporate questions for **TALAGO Experiences**.

TALAGO is structured strictly as an **online tourism technology marketplace** operating in Egypt, connecting international travellers with vetted, licensed independent excursion providers, dive operators, desert safari outfitters, and transport fleets across the Red Sea and Nile regions.

> [!IMPORTANT]
> **Strict Anti-Fabrication Rule Enforced:**  
> The codebase and public website contain **zero invented commercial registration numbers, zero fake tax cards, and zero fabricated Ministry of Tourism licenses**. All corporate fields requiring formal Egyptian registration are explicitly flagged with `[Pending Owner Input]` placeholders to protect the business against regulatory penalties for false advertising or unauthorized representation.

---

## 2. Verified Technical & Operational Architecture

The following facts have been verified against the production codebase, database schemas, and external service integrations:

| Domain | Verified Implementation | Technical Reference |
| :--- | :--- | :--- |
| **Operating Model** | Digital intermediary booking marketplace connecting travellers with independent vetted excursion providers. | `src/lib/contentPages.ts`, `src/app/(public)/about` |
| **Payment Gateway** | Paymob (Central Bank of Egypt regulated, PCI-DSS Level 1 compliant gateway supporting 3D-Secure 2.0). | `src/app/api/checkout`, `src/app/api/payments/paymob` |
| **Alternative Payments** | Deposit bookings (15%–30% online card deposit, remaining balance payable in cash on arrival). | `src/utils/priceCalculator.ts`, `src/components/checkout` |
| **Transactional Email** | Brevo API v3 (primary transactional email provider with custom verified domain headers). | `src/lib/brevo.ts`, `src/lib/email.ts` |
| **Customer Messaging** | WhatsApp booking notifications, driver pickup updates, and mobile vouchers via Green API / WhatsApp Cloud API. | `src/utils/whatsappNotifications.ts` |
| **Multilingual Coverage** | 8 languages natively supported: English (`en`), German (`de`), Russian (`ru`), French (`fr`), Italian (`it`), Polish (`pl`), Spanish (`es`), Ukrainian (`uk`). | `src/locales/`, `src/context/LanguageContext.tsx` |
| **Content Governance** | Dynamic Content Studio (`ManagedContentPage` model) allowing admin editing, translation, and versioning of all legal/informational pages. | `src/lib/contentPages.ts`, `/admin/content` |
| **Security & Auth** | Supabase authentication with httpOnly session cookies, cryptographic CSRF tokens, strict SSRF guards on URL imports. | `src/middleware.ts`, `src/utils/adminAuth.ts` |

---

## 3. Pending Corporate Facts Requiring Owner Input

The following formal business facts are currently marked as `[Pending Owner Input]` across the legal terms and footer. The platform owner and legal counsel should provide the exact legal values to finalize commercial filings:

| # | Item | Current Placeholder | Purpose & Regulatory Requirement |
| :---: | :--- | :--- | :--- |
| **1** | **Official Registered Entity Name** | `[Pending Owner Input: Official Legal Company Name]` | Required for invoice headers, terms of service, and merchant gateway agreement (e.g., *TALAGO Experiences S.A.E.* or *TALAGO Tours LLC*). |
| **2** | **Commercial Registration (CR) Number** | `[Pending Owner Input: Commercial Registration Number]` | Egyptian Commercial Registry (السجل التجاري) number required on all commercial websites under Egyptian E-Commerce regulations. |
| **3** | **Tax Identification Number (TIN)** | `[Pending Owner Input: Tax Card Number]` | Egyptian Tax Authority (مصلحة الضرائب المصرية) card number required on customer receipts and merchant records. |
| **4** | **Registered Office Address** | `[Pending Owner Input: Registered Office Address, City, Governorate, Egypt]` | Physical legal domicile for formal legal notices, registered with the Chamber of Tourism or General Authority for Investment (GAFI). |
| **5** | **Ministry of Tourism License / Intermediary Status** | `[Pending Owner Input: License Number / Category]` | Classification under Egyptian Ministry of Tourism (e.g., Category A Travel Agency partnership, or Electronic Intermediary / E-Commerce marketplace license). |
| **6** | **Legal Notice / Privacy Officer Contact** | `tala.tour@outlook.com` | Official email designated to receive copyright notices, GDPR/data subject requests, and regulatory communications. |
| **7** | **Customer Support Hotline** | `[Pending Owner Input: Verified Support Hotline / Local WhatsApp]` | Official customer service telephone number for emergency traveler assistance. |

---

## 4. Key Legal Pages & Contractual Architecture

All legal pages are centrally managed via the Content Studio (`src/lib/contentPages.ts`), rendered dynamically via `ManagedContentPage.tsx`, and accessible on public URLs:

```
├── /terms                    # Platform Terms of Service & General Website Conditions
├── /booking-terms            # Booking Terms, Deposit Contracts & Pickup Logistics
├── /cancellation             # Cancellation, Changes, No-Show & Refund Policy
├── /privacy                  # Privacy Policy, PCI-DSS Data Security & Traveler Rights
├── /cookies                  # Cookie Policy, Essential Sessions & Browser Preferences
├── /payments-and-pricing     # Multi-Currency Display, Taxes, Park Fees & Payment Methods
├── /about                    # About TALAGO, Marketplace Vetting Standards & Local Mission
├── /faq                      # Centralized Customer Help Center & High-Frequency FAQs
├── /safety-policies          # Maritime Coast Guard Permits, Desert Safari & Medical Advisory
├── /concierge-help           # Custom Trip Planning, Private Yacht Charters & Group Bookings
└── /partner-terms            # Operator Marketplace Agreement (Draft for Onboarding)
```

### Critical Legal Clauses Incorporated:

1. **Marketplace Intermediary Shield (Limitation of Liability):**
   - TALAGO is an online booking intermediary. All on-the-ground tour delivery, vessel navigation, vehicle transit, and guiding services are fulfilled by independent licensed Egyptian suppliers.
   - Operators maintain primary liability for their vessels, vehicles, and equipment.

2. **Force Majeure & Coast Guard Authority Orders:**
   - Specific statutory recognition of **Egyptian Coast Guard (حرس الحدود)** harbor closures for small watercraft due to high wind/waves, and Ministry of Tourism site restrictions.
   - In the event of authority-ordered weather or security cancellations, travelers are protected with **100% full refunds or complimentary rescheduling**.

3. **Transparent Outlying Resort Pickups:**
   - Clearly discloses that standard pickups cover central resort areas (e.g., central Hurghada or central Sharm El Sheikh), and that outlying areas (El Gouna, Makadi Bay, Soma Bay, Sahl Hasheesh, Safaga) incur reasonable operator transfer surcharges transparently itemized prior to checkout.

4. **PCI-DSS Level 1 & Zero Card Storage:**
   - Affirms that TALAGO never stores full 16-digit card numbers or CVV security codes on its servers, relying exclusively on tokenized processing via Paymob.

5. **WhatsApp & Operational Communication Consent:**
   - Complies with telecommunication consent requirements by clearly disclosing that guest mobile numbers are used for transactional driver ETA alerts, digital boarding passes, and emergency reschedule notices.

---

## 5. Chargeback Defense & Friendly Fraud Mitigation

To protect TALAGO and its operating partners against illegitimate chargebacks or friendly fraud:

1. **Digital Audit Trail:**
   - Every booking records: guest checkout timestamp, customer IP address, user-agent string, agreed cancellation policy snapshot, and payment gateway transaction ID.
2. **Smartphone Boarding Pass Verification:**
   - Boarding passes generate a dynamic QR code that guides/drivers scan at hotel pickup. This provides verifiable proof of service delivery and passenger attendance.
3. **Multi-Channel Confirmation:**
   - Automated email confirmation via Brevo + WhatsApp dispatch log via Green API provide dual-channel written acceptance of tour terms.

---

## 6. Recommendations for Platform Owner & Egyptian Legal Counsel

Prior to full commercial launch, the business owner should complete the following recommended steps:

- [ ] **Step 1: Fill Corporate Identifiers:** Replace the placeholders in `src/lib/contentPages.ts` and footer with your official Egyptian Commercial Registry (CR) and Tax Card (TIN) numbers.
- [ ] **Step 2: Sign Paymob Merchant Agreement:** Ensure the Paymob account is registered under the matching legal corporate entity for smooth bank settlements.
- [ ] **Step 3: Review Partner Terms:** Have your Egyptian local attorney review the draft in `/partner-terms` to ensure commission and indemnity terms align with your standard operator agreements.
- [ ] **Step 4: Establish Customer Complaints Log:** Maintain a dedicated email folder (`tala.tour@outlook.com`) for formal customer dispute tracking to satisfy Egyptian Consumer Protection Agency (جهاز حماية المستهلك) compliance.
