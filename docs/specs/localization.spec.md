# Specification: 8-Language Comprehensive Storefront Localization

## 1. Existing Behavior and Actual Problem
- Talago supports 8 languages: English (`en`), German (`de`), Spanish (`es`), French (`fr`), Italian (`it`), Polish (`pl`), Russian (`ru`), Ukrainian (`uk`).
- Ukrainian (`uk`) had missing translation dictionaries and fell back to raw keys or English placeholders.
- Destination names, category badges, and booking modal steps occasionally leaked hardcoded English strings in non-English locales.

## 2. Desired Behavior
- **Complete Parity Across All 8 Locales**:
  - Every UI element, navbar link, booking modal step, filter badge, error message, and legal page translated into natural, authentic phrasing.
  - Ukrainian (`uk`) dictionary brought to 100% complete parity with English and German.
- **Dynamic Content Localization**:
  - Tour titles, highlights, itineraries, and inclusions read from `tour.translations[locale]` with clean fallbacks.
  - Destination names translated via canonical map `src/utils/destinationTranslations.ts`.
  - Category taxonomy translated dynamically via `dict.categories`.
- **Zero Raw English Leakage**:
  - No untranslated English strings visible when browsing in `de`, `es`, `fr`, `it`, `pl`, `ru`, or `uk`.
- **URL & Storage Synchronization**:
  - Switching language updates `LanguageContext`, stores preference in cookie `NEXT_LOCALE`, and updates `html lang` attribute.

## 3. Source-of-Truth Data and Module Ownership
- **Locales Directory**: `src/locales/{en,de,es,fr,it,pl,ru,uk}.ts`.
- **Language Context**: `src/context/LanguageContext.tsx`.
- **Server Language Resolution**: `src/lib/i18n.server.ts`.
- **Destination Translations**: `src/utils/destinationTranslations.ts`.

## 4. User Journeys & Acceptance Criteria
1. Traveler selects Ukrainian (`uk`) in navbar selector -> all page headers, filters, booking buttons, and account tabs render in authentic Ukrainian.
2. Traveler switches to German (`de`) -> categories in header and catalog update immediately to German names without page reload.
3. Refreshing the browser maintains the selected language.

## 5. Required Tests
- `e2e/auth-booking-notifications.spec.ts`: Language switcher correctly updates canonical categories into German.
- Playwright check verifying no missing translation keys in any of the 8 locales.
