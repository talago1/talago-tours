import { prisma } from '@/lib/prisma';
import { parseSettingValue, serializeSettingValue } from '@/lib/systemSettings';
import { LANGUAGES, type LanguageCode } from '@/lib/i18n';
import { resolveServerLanguage } from '@/lib/i18n.server';

export type ContentBlock = { id: string; heading: string; body: string; visible: boolean; kind: 'TEXT' | 'FAQ' };
export type LocalizedContentPage = { title: string; intro: string; blocks: ContentBlock[] };
export type ManagedContentPage = { slug: string; label: string; visible: boolean; translations: Partial<Record<LanguageCode, LocalizedContentPage>> };

const page = (slug: string, label: string, title: string, intro: string, blocks: Array<[string, string, ('TEXT' | 'FAQ')?]>): ManagedContentPage => ({
  slug, label, visible: true,
  translations: {
    en: {
      title,
      intro,
      blocks: blocks.map(([heading, body, kind], index) => ({ id: `${slug}-${index + 1}`, heading, body, kind: kind || 'TEXT', visible: true })),
    },
  },
});

export const DEFAULT_CONTENT_PAGES: ManagedContentPage[] = [
  page('about', 'About TALAGO', 'A marketplace for better travel days', 'TALAGO connects travellers with vetted experiences, independent operators, and flexible ways to book in one place.', [
    ['What TALAGO does', 'We compare and curate activities across destinations so travellers can book the right experience for their time, group, and budget.'],
    ['How experiences are selected', 'Listings are reviewed for clear inclusions, practical pickup information, guest requirements, and transparent payment and cancellation terms.'],
    ['A marketplace, not a single operator', 'Experiences can be delivered by different local partners. TALAGO manages discovery, booking support, and customer communication across the marketplace.'],
  ]),
  page('faq', 'Frequently asked questions', 'Questions before you book?', 'Find clear answers about payments, operators, pickup arrangements, changes, and support across the TALAGO marketplace.', [
    ['Who runs the experience?', 'Each listing identifies its experience details and is fulfilled by a vetted local operator or supplier in the destination.', 'FAQ'],
    ['When do I choose a pickup area?', 'Pickup zones and any applicable transfer fees are shown during booking. They are set per destination and can vary by experience.', 'FAQ'],
    ['How do I get support?', 'Open the live chat on the site, or use the Support page. Our team can help before and after a booking.', 'FAQ'],
  ]),
  page('concierge-help', 'Concierge and planning', 'Plan the right experience', 'Tell our marketplace support team what you want to do, where you are staying, and who is travelling. We will help narrow down the options.', [
    ['For travellers', 'Get help comparing experiences, understanding inclusions, arranging a suitable pickup option, or finding activities for your group.'],
    ['For special requests', 'Use live chat for private groups, accessibility needs, celebrations, multi-experience days, or questions before you book.'],
  ]),
  page('booking-terms', 'Booking terms', 'Booking terms for the TALAGO marketplace', 'These terms explain how bookings work when TALAGO connects a traveller with an experience provider.', [
    ['Marketplace role', 'TALAGO operates the booking marketplace and customer support layer. The listed experience is delivered by the named or assigned local provider.'],
    ['Your booking', 'Review the selected date, guest count, pickup zone, price, inclusions, cancellation terms, and payment method before confirming.'],
  ]),
  page('privacy', 'Privacy policy', 'Privacy and data use', 'We use only the details needed to provide marketplace support, manage bookings, and communicate requested updates.', [
    ['Information we use', 'This may include contact details, booking details, selected pickup zone, and messages you send through site support.'],
    ['Marketplace partners', 'Relevant booking details are shared with the operator fulfilling your confirmed experience, only as needed to deliver it.'],
  ]),
  page('cancellation', 'Cancellation policy', 'Changes and cancellations', 'Cancellation terms are shown on every experience because terms can vary by operator, date, and product type.', [
    ['Before booking', 'Read the cancellation information on the listing and checkout before confirming payment.'],
    ['Need help?', 'Use live chat or Support with your booking reference. Our team will explain the applicable terms and next steps.'],
  ]),
  page('safety-policies', 'Safety policies', 'Safety across the marketplace', 'TALAGO expects marketplace operators to provide accurate activity information and follow applicable local safety requirements.', [
    ['Before you book', 'Review activity requirements, fitness level, age restrictions, what to bring, and accessibility information on the listing.'],
    ['During an experience', 'Follow the provider’s guide and safety briefing. Contact marketplace support if you need help with a confirmed booking.'],
  ]),
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
