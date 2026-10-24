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
  return DEFAULT_CONTENT_PAGES.map((fallback) => {
    const item = pages.find((value): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && (value as { slug?: unknown }).slug === fallback.slug));
    if (!item) return fallback;

    const legacyEnglish = {
      title: typeof item.title === 'string' ? item.title : fallback.translations.en?.title || '',
      intro: typeof item.intro === 'string' ? item.intro : fallback.translations.en?.intro || '',
      blocks: Array.isArray(item.blocks) ? item.blocks as ContentBlock[] : fallback.translations.en?.blocks || [],
    };
    const rawTranslations = item.translations && typeof item.translations === 'object' ? item.translations as Record<string, unknown> : {};
    const translations: Partial<Record<LanguageCode, LocalizedContentPage>> = { ...fallback.translations, en: legacyEnglish };
    for (const language of LANGUAGES) {
      const candidate = rawTranslations[language];
      if (!candidate || typeof candidate !== 'object') continue;
      const localized = candidate as Partial<LocalizedContentPage>;
      translations[language] = {
        title: typeof localized.title === 'string' ? localized.title : legacyEnglish.title,
        intro: typeof localized.intro === 'string' ? localized.intro : legacyEnglish.intro,
        blocks: Array.isArray(localized.blocks) ? localized.blocks as ContentBlock[] : legacyEnglish.blocks,
      };
    }
    return { slug: fallback.slug, label: fallback.label, visible: item.visible !== false, translations };
  });
}

export async function getManagedContentPages(): Promise<ManagedContentPage[]> {
  const record = await prisma.systemSetting.findUnique({ where: { key: 'content_pages' } });
  return record ? normalise(parseSettingValue(record.value, DEFAULT_CONTENT_PAGES)) : DEFAULT_CONTENT_PAGES;
}

export async function getManagedContentPage(slug: string, language: LanguageCode = resolveServerLanguage()): Promise<ManagedContentPage & LocalizedContentPage> {
  const pages = await getManagedContentPages();
  const page = pages.find((item) => item.slug === slug) || DEFAULT_CONTENT_PAGES[0];
  const english = page.translations.en || { title: page.label, intro: '', blocks: [] };
  return { ...page, ...(page.translations[language] || english) };
}

export async function saveManagedContentPages(pages: ManagedContentPage[]) {
  return prisma.systemSetting.upsert({
    where: { key: 'content_pages' },
    create: { key: 'content_pages', value: serializeSettingValue(pages) },
    update: { value: serializeSettingValue(pages) },
  });
}
