# Trip data audit

Audit date: 2026-10-24. Source: read-only query against the experimental Supabase database.

## Result

- 69 trips inspected.
- No exact duplicate English titles were found.
- Do not auto-merge or delete trips. Similar commercial offerings can have different pickup cities, durations, or operators.
- 61 trips need one or more optional content additions. The new editor and import template expose the required fields; no content was invented or published automatically.

## Highest-impact active records to complete

These active trips are missing an itinerary and/or route and should be reviewed first:

- `cairo-pyramids-of-giza-sphinx-museum-day-tour` - itinerary, route.
- `hurghada-mega-safari-quad-buggy-bedouin-dinner` - itinerary, route.
- `giftun-island-orange-bay-luxury-cruise` - itinerary, route.
- `ras-mohamed-white-island-luxury-yacht-sharm` - itinerary, route.
- `luxor-valley-of-the-kings-karnak-day-trip` - itinerary, route.

Some active records also need a gallery image or exclusions, notably `el-gouna-sunset-felucca`, `dolphin-house-white-island-speedboat`, and `hurghada-moto-safari-quad-bikes`.

## Review workflow

1. Open the trip in Admin > Tours.
2. Complete Route & Waypoints and Itinerary Timeline only with verified operator information.
3. Add inclusions, exclusions, gallery photos, and pickup details where applicable.
4. Review the public trip before making a status change.

The audit intentionally treats route waypoints as optional content. Their absence alone does not make a trip invalid or justify unpublishing it.
