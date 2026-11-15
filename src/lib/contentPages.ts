import { prisma } from '@/lib/prisma';
import { parseSettingValue, serializeSettingValue } from '@/lib/systemSettings';
import { LANGUAGES, type LanguageCode } from '@/lib/i18n';
import { resolveServerLanguage } from '@/lib/i18n.server';

export type ContentBlock = { id: string; heading: string; body: string; visible: boolean; kind: 'TEXT' | 'FAQ' };
export type LocalizedContentPage = { title: string; intro: string; blocks: ContentBlock[] };
export type ManagedContentPage = { slug: string; label: string; visible: boolean; translations: Partial<Record<LanguageCode, LocalizedContentPage>> };

const page = (slug: string, label: string, title: string, intro: string, blocks: Array<[string, string, ('TEXT' | 'FAQ')?]>): ManagedContentPage => ({
  slug,
  label,
  visible: true,
  translations: {
    en: {
      title,
      intro,
      blocks: blocks.map(([heading, body, kind], index) => ({
        id: `${slug}-${index + 1}`,
        heading,
        body,
        kind: kind || 'TEXT',
        visible: true,
      })),
    },
  },
});

export const DEFAULT_CONTENT_PAGES: ManagedContentPage[] = [
  page(
    'about',
    'About TALAGO',
    'A Trusted Marketplace for Egypt’s Greatest Experiences',
    'TALAGO connects international travellers directly with vetted independent excursion operators, certified dive masters, desert safari specialists, and private transport providers across Egypt.',
    [
      [
        'What is TALAGO?',
        'TALAGO is a specialized tourism technology platform and marketplace based in Egypt. Rather than owning every vehicle or vessel directly, we partner with reputable, licensed local tour operators across Hurghada, Sharm El Sheikh, Luxor, Cairo, and Marsa Alam to provide curated, high-standard day tours and adventures.',
      ],
      [
        'How We Vet Local Operators',
        'Every operator listed on TALAGO undergoes a thorough onboarding check: verification of commercial operating credentials, vessel sea-worthiness / vehicle road-worthiness, qualified guides, passenger liability insurance, and commitment to transparent pricing and customer service standards.',
      ],
      [
        'Marketplace Guarantee & Traveler Protection',
        'Booking through TALAGO means you enjoy clear multilingual support, transparent pricing with no hidden tourist markups, instant digital vouchers, and dedicated customer concierge assistance before, during, and after your trip.',
      ],
      [
        'Our Local Footprint & Purpose',
        'We are proud to champion Egypt’s local tourism community, empowering independent captains, Bedouin guides, and cultural historians with modern technology while ensuring visitors receive authentic, safe, and unforgettable Red Sea and Nile experiences.',
      ],
    ]
  ),

  page(
    'terms',
    'Terms of Service',
    'Platform Terms of Service & Website Conditions',
    'Please read these Terms of Service carefully before browsing or using the TALAGO website, mobile web application, or booking marketplace services.',
    [
      [
        '1. Acceptance of Terms & Platform Role',
        'TALAGO operates as an online intermediary marketplace enabling travellers to discover, compare, and reserve excursion and transfer services offered by vetted third-party operators. By accessing or using TALAGO, you acknowledge and agree to be bound by these Terms of Service.',
      ],
      [
        '2. Platform Intermediary Disclaimer',
        'TALAGO is an intermediary marketplace platform. Unless explicitly stated otherwise on a listing, excursions, transportation, diving, and safari activities are operated and delivered by independent licensed service providers. TALAGO does not own, control, or operate third-party excursion fleets, and acts as an agent of discovery, reservation processing, and customer support.',
      ],
      [
        '3. Accuracy of Content & Listings',
        'While TALAGO works closely with local partners to verify all itineraries, inclusions, durations, and safety guidelines, operational adjustments may occur due to maritime authorities, coast guard orders, local weather conditions, or monument opening hours.',
      ],
      [
        '4. Intellectual Property & Acceptable Use',
        'All content, branding, trademarks, software, UI design, imagery, and text on TALAGO are the intellectual property of TALAGO or licensed from its partners. You agree not to scrape, copy, reverse engineer, or exploit the platform for unauthorized commercial purposes.',
      ],
      [
        '5. User Accounts & Reviews',
        'Guests creating an account or submitting reviews warrant that all information provided is accurate and genuine. TALAGO reserves the right to remove fraudulent, abusive, or defamatory content.',
      ],
      [
        '6. Limitation of Liability',
        'To the maximum extent permitted by applicable law, TALAGO shall not be liable for direct, indirect, or incidental injuries, property loss, or itinerary disruptions caused by third-party operator defaults, severe weather, or acts of nature, provided TALAGO has fulfilled its obligations with reasonable care.',
      ],
      [
        '7. Governing Law & Dispute Resolution',
        'These Terms of Service are governed by the laws of the Arab Republic of Egypt. In the event of an unresolved dispute, the parties submit to the exclusive jurisdiction of the competent courts of Cairo or the Red Sea Governorate.',
      ],
      [
        '8. Corporate Entity Information',
        '[Pending Owner Input: Official Legal Company Name, Commercial Registration (CR) Number, Tax Card (TIN), Registered Office Address]. For inquiries, contact: tala.tour@outlook.com.',
      ],
    ]
  ),

  page(
    'booking-terms',
    'Booking Terms',
    'Booking Terms & Conditions',
    'These Booking Terms govern every reservation made on the TALAGO marketplace, defining the contractual relationship between travellers, TALAGO, and local tour operators.',
    [
      [
        '1. Forming the Booking Contract',
        'When you place a booking on TALAGO, your reservation is confirmed once the checkout transaction is completed and a digital booking confirmation / voucher is issued. This forms a binding contract for the requested date and services.',
      ],
      [
        '2. Pricing, Inclusions & Extras',
        'The total price displayed at checkout includes all items explicitly listed under Inclusions on the tour page. Optional extras (such as photo packages, quad goggles, or specialized rental gear) and hotel pickup zone surcharges for out-of-town resorts are itemized before you pay.',
      ],
      [
        '3. Hotel Pickups & Meeting Logistics',
        'For tours with hotel pickup included, exact pickup time windows will be re-confirmed via WhatsApp or email the evening before your departure. Guests must be present at the hotel lobby or designated security gate at the confirmed time. Delays exceeding 15 minutes without contacting support may result in forfeiture as a no-show.',
      ],
      [
        '4. Guest Requirements & Participant Declarations',
        'It is the guest’s responsibility to review age limits, medical restrictions (such as pregnancy, spinal injuries, or heart conditions), and required attire before booking. Operators reserve the right to decline participation without refund if safety guidelines are breached.',
      ],
      [
        '5. Weather & Force Majeure Cancellations',
        'If an activity is cancelled due to adverse weather conditions, coast guard harbor closures, or military/governmental restrictions, guests are offered a free reschedule to another date or an immediate 100% full refund.',
      ],
      [
        '6. Vouchers & Digital Boarding Passes',
        'No paper printouts are required. Present your digital voucher or mobile boarding pass on your smartphone to your guide or driver upon pickup.',
      ],
    ]
  ),

  page(
    'cancellation',
    'Cancellation Policy',
    'Cancellation, Changes & Refund Policy',
    'We believe booking your holiday experiences should be transparent and stress-free. Here is our straightforward cancellation and refund policy.',
    [
      [
        '1. Free Cancellation Window',
        'Most TALAGO experiences offer free cancellation up to 24 hours before the scheduled departure time (unless a specific tour listing explicitly indicates a 48-hour or non-refundable window). Cancellations within this window receive a 100% full refund.',
      ],
      [
        '2. Late Cancellations (Within 24 Hours)',
        'Cancellations made less than 24 hours prior to departure are subject to a 50% cancellation fee to cover committed transport, permits, and crew allocations. The remaining 50% can be refunded or credited toward another experience.',
      ],
      [
        '3. No-Show Policy',
        'If a guest fails to appear at the confirmed pickup location at the scheduled time without prior notification, the booking is classified as a no-show. In this event, 100% of the tour fee is non-refundable because vehicle seats, park tickets, and meals have already been committed.',
      ],
      [
        '4. Deposit Bookings',
        'For bookings secured with a deposit: if cancelled within the free window, the deposit is refunded in full. If cancelled after the free window, the deposit is retained as the cancellation fee, and the remaining cash balance on arrival is voided with no further debt.',
      ],
      [
        '5. Rescheduling & Guest Count Changes',
        'Date changes and participant adjustments are free of charge if requested at least 24 hours in advance, subject to operator availability. Any price difference between dates or seasons will be adjusted accordingly.',
      ],
      [
        '6. Operator or Weather Cancellations',
        'In the rare event that a tour is cancelled by the operator or authorities (such as Red Sea coast guard closure for small craft): guests receive an immediate 100% refund, or complimentary transfer to an alternative date or activity.',
      ],
      [
        '7. Refund Processing Times',
        'Refunds are processed to the original payment method. International credit/debit cards typically reflect in 5 to 10 business days depending on your bank. Local Egyptian cards via Paymob / Fawry typically reflect within 3 to 5 business days.',
      ],
      [
        '8. How to Request a Cancellation or Refund',
        'To cancel or modify, message our concierge team on WhatsApp or submit a request via our Support page with your 6-character booking reference code.',
      ],
    ]
  ),

  page(
    'privacy',
    'Privacy Policy',
    'Privacy & Personal Data Protection',
    'TALAGO is committed to protecting the privacy, confidentiality, and security of all travellers and website visitors.',
    [
      [
        '1. Personal Information We Collect',
        'We collect only data necessary to fulfill your bookings and communications: guest full name, email address, WhatsApp/mobile telephone number, hotel / room accommodation details for pickup, language preference, and booking history.',
      ],
      [
        '2. Payment Data Security (PCI-DSS Compliance)',
        'We do NOT store or process your credit/debit card numbers or security CVV codes on our servers. All digital transactions are securely tokenized and handled directly by certified payment gateways (Paymob / Fawry) complying with PCI-DSS Level 1 standards.',
      ],
      [
        '3. How We Use Your Information',
        'Your data is used strictly to issue booking vouchers, coordinate hotel pickups, send departure updates via WhatsApp or email, provide concierge support, and comply with Egyptian tourism and tax regulations.',
      ],
      [
        '4. Information Sharing with Local Operators',
        'To ensure safe dispatch, we share necessary operational details (guest name, pickup hotel, group size, and dietary/accessibility notes) with the specific local licensed operator assigned to your tour. We never sell, rent, or trade your personal data to marketing third parties.',
      ],
      [
        '5. WhatsApp & Communication Consent',
        'By providing your phone number during checkout, you consent to receive critical booking updates, driver ETA alerts, and digital vouchers via WhatsApp or SMS. You may opt out of promotional messages at any time by replying STOP or contacting support.',
      ],
      [
        '6. Data Retention & Traveler Rights',
        'You have the right to request access to, correction of, or deletion of your personal data stored on TALAGO, subject to regulatory tax audit retention rules. To exercise your rights, email: tala.tour@outlook.com.',
      ],
    ]
  ),

  page(
    'cookies',
    'Cookie Policy',
    'Cookie Policy & Browsing Preferences',
    'This Cookie Policy explains how TALAGO uses cookies and browser storage technologies to provide a smooth, personalized experience.',
    [
      [
        '1. What Are Cookies?',
        'Cookies and local storage are small text files stored on your browser when you visit websites. They help the platform remember your currency preference, selected language, and active booking cart.',
      ],
      [
        '2. Essential Cookies',
        'These cookies are strictly necessary for the website to function. They keep your shopping cart intact across pages, maintain secure checkout sessions, and remember your selected language (e.g. English, German, Russian).',
      ],
      [
        '3. Preference & Analytics Cookies',
        'We use lightweight performance cookies to understand which tours and destinations are most popular, identify slow pages, and improve navigation. No personal identifying information is sold to advertising networks.',
      ],
      [
        '4. Managing Your Cookie Preferences',
        'You can choose to disable or block cookies through your browser settings (Chrome, Safari, Firefox, Edge). Please note that disabling essential cookies may impact checkout functionality and language persistence.',
      ],
    ]
  ),

  page(
    'payments-and-pricing',
    'Payment & Pricing',
    'Payment Methods, Pricing & Transparency',
    'At TALAGO, transparency is our core principle. Learn about how prices are calculated, currency conversion, taxes, and accepted payment options.',
    [
      [
        '1. Multi-Currency Display & Transparent Rates',
        'Tours on TALAGO are denominated in USD or EGP as primary reference currencies and dynamically displayed in EUR, GBP, PLN, CHF, and other major currencies using current exchange rates. The final charge amount in your selected checkout currency is displayed clearly before you submit payment.',
      ],
      [
        '2. Deposit & Pay-on-Arrival Options',
        'Many experiences allow you to book with a modest online deposit (e.g. 15% to 30%), paying the remaining balance in cash (EUR, USD, GBP, or EGP) directly to your guide or driver on the day of departure. This gives you financial flexibility and peace of mind.',
      ],
      [
        '3. Pickup Zone Surcharges',
        'Standard hotel pickup within the main resort area (e.g. central Hurghada or central Sharm) is typically included. For outlying resorts (such as El Gouna, Makadi Bay, Sahl Hasheesh, Soma Bay, or Safaga), reasonable transfer surcharges set by operators are clearly shown during checkout before payment.',
      ],
      [
        '4. National Park & Environmental Fees',
        'Certain protected natural reserves (such as Ras Mohammed National Park or Giftun Island Marine Park) require government conservation entrance fees. Where applicable, our listings clearly specify whether park fees are included or payable in cash at the marina gate.',
      ],
      [
        '5. Accepted Payment Methods',
        'We accept major international credit and debit cards (Visa, Mastercard), local Egyptian debit/Meeza cards, and digital wallets through our licensed payment partner Paymob. All online payments are protected with 3D-Secure authentication.',
      ],
    ]
  ),

  page(
    'faq',
    'FAQ',
    'Frequently Asked Questions',
    'Find clear answers to common questions about booking, hotel pickups, cancellations, payments, and tour safety.',
    [
      [
        'How do hotel pickups work?',
        'For tours with hotel pickup included, the operator arranges an air-conditioned vehicle to pick you up directly from your hotel lobby or main gate. Exact pickup time is confirmed the evening before departure via WhatsApp or email.',
        'FAQ',
      ],
      [
        'Do I need to print my ticket or voucher?',
        'No printing is necessary! TALAGO is 100% digital. Simply show your smartphone voucher or mobile boarding pass to your guide or driver upon pickup.',
        'FAQ',
      ],
      [
        'Can I cancel or reschedule if my plans change?',
        'Yes. Most tours feature free cancellation up to 24 hours before departure with a full refund. You can also reschedule dates free of charge subject to availability by contacting concierge support.',
        'FAQ',
      ],
      [
        'What happens if the tour is cancelled due to bad weather?',
        'If the Egyptian coast guard closes sea navigation or weather renders desert safaris unsafe, you will be notified immediately. You can choose a full 100% refund or reschedule to another day without penalty.',
        'FAQ',
      ],
      [
        'Is it safe to pay online with credit card?',
        'Yes. All payments on TALAGO are processed through Paymob, Egypt’s leading PCI-DSS Level 1 certified payment gateway, utilizing 3D-Secure 2.0 bank authentication.',
        'FAQ',
      ],
      [
        'Can I book for a large group or arrange a private tour?',
        'Yes! Many of our listings have private tour options. For custom itineraries, private yacht charters, or group events, message our travel concierge on live chat or WhatsApp.',
        'FAQ',
      ],
      [
        'What should I bring on desert and boat excursions?',
        'Each tour listing has an explicit What to Bring section. Standard essentials include sunscreen, sunglasses, comfortable footwear, beach towels for boat trips, and passport / ID copies.',
        'FAQ',
      ],
    ]
  ),

  page(
    'safety-policies',
    'Safety Policies',
    'Safety & Operational Standards',
    'Your safety and wellbeing are paramount. Here are the safety protocols and equipment standards mandated across the TALAGO marketplace.',
    [
      [
        '1. Maritime & Snorkeling Safety Standards',
        'All boat trips operate under official Red Sea Coast Guard permits. Vessels are equipped with life jackets for all passengers (including child sizes), life rafts, emergency VHF radio, and first aid kits. Snorkeling and diving excursions are guided by certified dive masters.',
      ],
      [
        '2. Desert Safari & ATV Safety',
        'Before any quad bike or buggy ride, guides conduct a mandatory safety briefing and helmet fitting, followed by a controlled test drive. Guests must follow the convoy line and guide instructions at all times.',
      ],
      [
        '3. Health, Age & Mobility Advisory',
        'Certain activities are not recommended for pregnant women, individuals with back/neck conditions, or guests with severe cardiac issues. Age minimums are strictly enforced for solo ATV drivers (typically 16+).',
      ],
      [
        '4. Passenger Insurance Coverage',
        'Marketplace operators carry licensed passenger liability insurance covering transit vehicles and marine craft in accordance with Egyptian Ministry of Tourism regulations.',
      ],
    ]
  ),

  page(
    'concierge-help',
    'Concierge Help',
    'Concierge & Custom Trip Planning',
    'Looking for personalized recommendations, private yacht charters, or special celebrations? Our local Egyptian concierge team is here to assist.',
    [
      [
        'Personalized Excursion Recommendations',
        'Whether you are a solo traveler seeking certified diving, a couple looking for a private sunset cruise, or a family seeking child-friendly desert safaris, our concierge can curate the ideal itinerary.',
      ],
      [
        'Private Group Bookings & Events',
        'Planning a birthday, anniversary, corporate retreat, or wedding excursion? We coordinate customized yacht charters, private desert dinners, and dedicated transport.',
      ],
      [
        'How to Reach the Concierge',
        'Reach out via our Support page, live chat, or WhatsApp for quick, multilingual assistance.',
      ],
    ]
  ),

  page(
    'partner-terms',
    'Partner Terms',
    'Operator Marketplace Agreement (Draft)',
    '[DRAFT FOR OPERATOR ONBOARDING - SUBJECT TO LEGAL COUNSEL] Terms and standards governing excursion operators, fleet owners, and activity providers listed on the TALAGO marketplace.',
    [
      [
        '1. Operator Onboarding & Licensing Requirements',
        'To be listed on TALAGO, tour providers must hold valid commercial registrations, appropriate Ministry of Tourism or local authority operating licenses, and maintain passenger liability insurance for all vessels, vehicles, and equipment.',
      ],
      [
        '2. Quality & Fulfillment Commitments',
        'Operators agree to deliver tours matching the advertised itineraries, inclusions, durations, and safety equipment. In the event of an operational failure, the operator must notify TALAGO immediately.',
      ],
      [
        '3. Commission & Settlement Payouts',
        'TALAGO collects customer payments or deposits securely online and remits operator payouts according to agreed settlement schedules (weekly/bi-weekly) minus agreed marketplace commission.',
      ],
      [
        '4. Safety Compliance & Marine Protection',
        'Operators must adhere strictly to environmental regulations, including Red Sea marine protectorate rules (no reef touching, no single-use plastics) and desert safari safety guidelines.',
      ],
      [
        '5. Legal Disclaimer & Pending Approvals',
        '[Pending Owner Input: Standard commercial contract terms, commission percentages, dispute resolution clauses, and official legal entity sign-off].',
      ],
    ]
  ),
];

function normalise(pages: unknown): ManagedContentPage[] {
  if (!Array.isArray(pages)) return DEFAULT_CONTENT_PAGES;

  const mapBySlug = new Map<string, ManagedContentPage>();
  for (const def of DEFAULT_CONTENT_PAGES) {
    mapBySlug.set(def.slug, { ...def });
  }

  for (const raw of pages) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    const slug = typeof item.slug === 'string' ? item.slug.trim() : '';
    if (!slug) continue;

    const fallback = mapBySlug.get(slug) || {
      slug,
      label: typeof item.label === 'string' ? item.label : slug,
      visible: true,
      translations: { en: { title: '', intro: '', blocks: [] } },
    };

    const rawTranslations = (item.translations && typeof item.translations === 'object')
      ? item.translations as Record<string, unknown>
      : {};

    const cleanBlockList = (blocks: unknown[]): ContentBlock[] => {
      return blocks.map((b, idx) => {
        const blk = (b && typeof b === 'object') ? b as Record<string, unknown> : {};
        return {
          id: typeof blk.id === 'string' && blk.id ? blk.id : `${slug}-${Date.now()}-${idx}`,
          heading: typeof blk.heading === 'string' ? blk.heading : '',
          body: typeof blk.body === 'string' ? blk.body : '',
          visible: blk.visible !== false,
          kind: blk.kind === 'FAQ' ? 'FAQ' : 'TEXT',
        };
      });
    };

    const cleanTranslations: Partial<Record<LanguageCode, LocalizedContentPage>> = {};

    // 1. English (primary)
    const rawEn = (rawTranslations.en && typeof rawTranslations.en === 'object')
      ? rawTranslations.en as Record<string, unknown>
      : null;

    const enTitle = typeof rawEn?.title === 'string' ? rawEn.title : (typeof item.title === 'string' ? item.title : fallback.translations.en?.title || '');
    const enIntro = typeof rawEn?.intro === 'string' ? rawEn.intro : (typeof item.intro === 'string' ? item.intro : fallback.translations.en?.intro || '');
    const enBlocksRaw = Array.isArray(rawEn?.blocks) ? rawEn.blocks : (Array.isArray(item.blocks) ? item.blocks : fallback.translations.en?.blocks || []);

    cleanTranslations.en = {
      title: enTitle,
      intro: enIntro,
      blocks: cleanBlockList(enBlocksRaw),
    };

    // 2. Other languages — only store if provided, do NOT inject English clones
    for (const lang of LANGUAGES) {
      if (lang === 'en') continue;
      const rawLang = (rawTranslations[lang] && typeof rawTranslations[lang] === 'object')
        ? rawTranslations[lang] as Record<string, unknown>
        : null;

      if (!rawLang) continue;

      cleanTranslations[lang] = {
        title: typeof rawLang.title === 'string' ? rawLang.title : '',
        intro: typeof rawLang.intro === 'string' ? rawLang.intro : '',
        blocks: Array.isArray(rawLang.blocks) ? cleanBlockList(rawLang.blocks) : [],
      };
    }

    mapBySlug.set(slug, {
      slug,
      label: typeof item.label === 'string' && item.label ? item.label : fallback.label,
      visible: item.visible !== false,
      translations: cleanTranslations,
    });
  }

  return Array.from(mapBySlug.values());
}

export async function getManagedContentPages(): Promise<ManagedContentPage[]> {
  const record = await prisma.systemSetting.findUnique({ where: { key: 'content_pages' } });
  return record ? normalise(parseSettingValue(record.value, DEFAULT_CONTENT_PAGES)) : DEFAULT_CONTENT_PAGES;
}

export async function getManagedContentPage(
  slug: string,
  language: LanguageCode = resolveServerLanguage(),
): Promise<ManagedContentPage & LocalizedContentPage> {
  const pages = await getManagedContentPages();
  const page = pages.find((item) => item.slug === slug) || DEFAULT_CONTENT_PAGES[0];
  const english = page.translations.en || { title: page.label, intro: '', blocks: [] };

  if (language === 'en') {
    return { ...page, ...english };
  }

  const localized = page.translations[language];
  if (!localized) {
    // Untranslated language cleanly falls back to English
    return { ...page, ...english };
  }

  return {
    ...page,
    title: localized.title?.trim() ? localized.title : english.title,
    intro: localized.intro?.trim() ? localized.intro : english.intro,
    blocks: localized.blocks && localized.blocks.length > 0 ? localized.blocks : english.blocks,
  };
}

export async function saveManagedContentPages(pages: ManagedContentPage[]) {
  return prisma.systemSetting.upsert({
    where: { key: 'content_pages' },
    create: { key: 'content_pages', value: serializeSettingValue(pages) },
    update: { value: serializeSettingValue(pages) },
  });
}
