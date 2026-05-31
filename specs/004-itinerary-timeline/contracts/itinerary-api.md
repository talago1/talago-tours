# API Contract: Itinerary (Embedded in Tour)

## Endpoint

Itinerary data is **embedded** within the tour create/update payload — no standalone endpoint.

```
POST /api/admin/tours          (create tour with itinerary)
PUT  /api/admin/tours/:id      (update tour with itinerary)
```

## Request (itinerary portion of tour payload)

```typescript
{
  // ... other tour fields ...
  itinerary: Array<{
    id: string;                        // UUID, client-generated
    timeTag: string;                   // Free text, non-empty
    iconToken: 'boat' | 'safari' | 'swim' | 'food' | 'hotel' | 'generic';
    title: {
      en: string;
      de: string;
      ru: string;
      fr: string;
      it: string;
      tr: string;
    };
  }> | null;
}
```

### Example

```json
{
  "itinerary": [
    {
      "id": "a1b2c3d4-...",
      "timeTag": "08:30 AM",
      "iconToken": "boat",
      "title": {
        "en": "Red Sea snorkeling at Giftun Island",
        "de": "Schnorcheln im Roten Meer an der Giftun-Insel",
        "ru": "Снорклинг в Красном море на острове Гифтун",
        "fr": "Plongée en apnée dans la mer Rouge à l'île de Giftun",
        "it": "Snorkeling nel Mar Rosso all'isola di Giftun",
        "tr": "Giftun Adası'nda Kızıldeniz şnorkelli yüzme"
      }
    }
  ]
}
```

## Response

### 200/201 Success
```typescript
{
  tour: {
    id: string;
    // ... other tour fields ...
    itinerary: ItineraryMilestone[] | null;
  };
  message: string;
}
```

### 400 Bad Request — Validation Error
```typescript
{
  error: string;                   // e.g. "Milestone 2: English title is required"
  field?: string;                  // e.g. "itinerary[1].title.en"
}
```

## Server-side Validation Rules

1. If `itinerary` is null → no itinerary (allowed for draft tours)
2. If `itinerary` is an array, each element must satisfy:
   - `id` is a non-empty string, unique within the array
   - `timeTag` is a non-empty string
   - `iconToken` is one of: boat, safari, swim, food, hotel, generic
   - `title` is an object with exactly 6 keys: en, de, ru, fr, it, tr
   - `title.en` is a non-empty string
