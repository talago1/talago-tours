# Talago Tours — Project Architecture Map

## Overview
**Talago** is an enterprise-grade tourism marketplace built on Next.js 14 (App Router) with TypeScript strict mode, Tailwind CSS, PostgreSQL via Prisma ORM, and Supabase Auth & Storage.

- **Production:** https://talago-tours.vercel.app
- **Repository:** https://github.com/talago1/talago-tours
- **Branch Strategy:** `main` (production), feature branches merged via PR

---

## High-Level Topology

```
┌──────────────────────────────────────────────────────────────┐
│                    Talago Public Storefront                  │
│  /  |  /tours  |  /tours/[slug]  |  /destinations            │
│  /checkout/[tourId]  |  /booking/[token]  |  /account        │
│  /my-bookings  |  /auth  |  /login  |  /blog                 │
└──────────────┬───────────────────────────────┬───────────────┘
               │                               │
┌──────────────▼──────────────┐ ┌──────────────▼───────────────┐
│     Public Route Handlers   │ │       Admin Workspace        │
│  /api/checkout/initialize   │ │  /admin/* (RBAC Middleware)  │
│  /api/public/my-bookings/*  │ │  /admin/bookings             │
│  /api/auth/session          │ │  /admin/operations           │
│  /api/payments/webhook      │ │  /admin/crm                  │
└──────────────┬──────────────┘ └──────────────┬───────────────┘
               │                               │
┌──────────────▼───────────────────────────────▼───────────────┐
│                     Shared Service Layer                     │
│  src/server/customerSession.ts  src/server/customerBookings  │
│  src/utils/priceCalculator.ts   src/utils/capacityEngine.ts  │
│  src/utils/phoneMatch.ts        src/utils/pdfGenerator.ts    │
└──────────────┬───────────────────────────────┬───────────────┘
               │                               │
┌──────────────▼──────────────┐ ┌──────────────▼───────────────┐
│    PostgreSQL via Prisma    │ │    External Integrations     │
│  Booking, CustomerProfile   │ │  Supabase Auth & Storage     │
│  Tour, Destination, Zone    │ │  Paymob (EGP Gateway)        │
│  LiveChat, PromoCode        │ │  Telegram OIDC & Bot         │
│  Transaction, Review        │ │  Brevo / Resend (Email)      │
└─────────────────────────────┘ └──────────────────────────────┘
```

---

## Directory Organization

```
d:/talago-tours/
├── src/
│   ├── app/
│   │   ├── (public)/          # Public-facing customer pages
│   │   │   ├── account/       # Customer profile, bookings, reviews, messages
│   │   │   ├── auth/          # Login/Registration (Google, Telegram, Email)
│   │   │   ├── booking/       # Booking lookup by token
│   │   │   ├── checkout/      # Multi-step checkout experience
│   │   │   ├── destinations/  # City & regional landing pages
│   │   │   ├── login/         # Smart redirect bridge to /auth or /account
│   │   │   ├── my-bookings/   # Guest booking portal & lookup
│   │   │   └── tours/         # Catalog, details, boarding pass, vouchers
│   │   ├── (admin)/admin/     # Admin dashboard (protected by middleware)
│   │   └── api/               # Serverless Next.js API routes
│   │       ├── admin/         # Operations, bookings, CRM, tours, media
│   │       ├── auth/          # Session persistence, magic links, Telegram OIDC
│   │       ├── checkout/      # Atomic checkout initialization
│   │       ├── payments/      # Webhooks & payment initiation
│   │       └── public/        # My-bookings, reviews, availability, lookup
│   ├── components/            # Reusable UI components
│   │   ├── admin/             # Dashboard modals, tables, forms
│   │   ├── layout/            # Navbar, NavActions, Footer, MobileMenu
│   │   ├── modals/            # Review modal, booking modal
│   │   ├── public/            # Public marketing blocks, reviews
│   │   └── tours/             # ContinuousBookingModal, BookingFormSteps, TourCard
│   ├── context/               # React Contexts (Language, Currency, Wishlist)
│   ├── hooks/                 # useContactSettings, useCurrency, useAuth
│   ├── lib/                   # Prisma client, Supabase client/server singletons
│   ├── locales/               # 8 hand-written locale files (en, de, ru, it, fr, pl, es, uk)
│   ├── server/                # Authoritative server-side domain logic
│   │   ├── customerSession.ts # Cookie/Bearer session resolution & persistence
│   │   └── customerBookings.ts# Identity adoption & ownership engine
│   ├── types/                 # Shared TypeScript models and contracts
│   └── utils/                 # Utilities (phoneMatch, priceCalculator, capacityEngine)
├── prisma/
│   └── schema.prisma          # PostgreSQL relational schema
└── graphify-out/              # Persistent knowledge graph & wiki
```

---

## Key Core Models (Prisma)
- **`Tour`**: Travel experience with pricing, tier options, schedules, translated JSON copy.
- **`Booking`**: Authoritative reservation with `bookingReference`, `accessToken`, financial breakdown, customer contact details, and `customerProfileId`.
- **`CustomerProfile`**: Member or shadow profile, holds name, email, phone, telegramId, `isShadow`.
- **`Transaction`**: Payment audit record linked to Booking (Cash, Paymob).
- **`BookingLead`**: Early stage booking inquiries or pre-checkout conversions.
- **`LiveChatConversation` / `LiveChatMessage`**: On-site concierge messages linked to visitors, bookings, or leads.

