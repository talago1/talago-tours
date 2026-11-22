# Categories & Localization Architecture — Talago Tours

## 1. Supported Locales

Talago Tours natively supports 8 languages with hand-written dictionaries:
1. `en` — English (Default)
2. `de` — German
3. `ru` — Russian
4. `uk` — Ukrainian
5. `fr` — French
6. `it` — Italian
7. `pl` — Polish
8. `es` — Spanish

Dictionaries live in `src/locales/{locale}.ts`. Every dictionary strictly conforms to `typeof en`.

---

## 2. Canonical Destination Taxonomy

Destination names and descriptions are standardized in `src/utils/destinationTranslations.ts` and mirrored in the database:

| Destination Slug | Canonical En Name | Ukrainian (`uk`) | Russian (`ru`) | German (`de`) |
|---|---|---|---|---|
| `hurghada` | Hurghada | Хургада | Хургада | Hurghada |
| `sharm-el-sheikh` | Sharm El Sheikh | Шарм-ель-Шейх | Шарм-эль-Шейх | Scharm El-Scheich |
| `marsa-alam` | Marsa Alam | Марса-Алам | Марса-Алам | Marsa Alam |
| `cairo` | Cairo | Каїр | Каир | Kairo |
| `luxor` | Luxor | Луксор | Луксор | Luxor |
| `egypt` | Egypt | Єгипет | Египет | Ägypten |
| `red-sea` | Red Sea | Червоне море | Красное море | Rotes Meer |

### Helper Function: `getLocalizedDestinationName`
Located in `src/utils/destinationTranslations.ts`. Safely resolves destination names in any active locale with instant fallback.

---

## 3. Canonical Experience Categories

Activity categories are defined in `src/utils/destinationTranslations.ts` and `src/components/landing/ExploreByInterest.tsx`:

- **Snorkeling & Coral Reefs** (`snorkeling`): Marine excursions, reefs, and semi-submarines.
- **Desert Safari & Quads** (`safari`): Quads, buggies, camels, Bedouin dinner.
- **Boat & Yacht Cruises** (`sea`): Private yachts, catamarans, island trips.
- **Cultural & Historical Tours** (`cultural`): Pyramids, Luxor temples, museum day trips.
- **Full-Day Excursions** (`day-trips`): Comprehensive multi-attraction day tours.
- **Scuba Diving** (`diving`): Certified and introductory Red Sea diving.
- **Private Charters & VIP** (`private`): Bespoke private boat and van charters.
- **Spa & Wellness** (`spa`): Turkish baths, Moroccan hammams, and massages.
- **Shows & Entertainment** (`entertainment`): Dolphin shows, aquariums, nightlife.

### Category Localization Rule
Never render raw database strings directly to the user. Always pass category identifiers through `getLocalizedCategoryName(category, language, dict)`.
