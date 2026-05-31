# Data Model: Dynamic Milestone Timeline Itinerary Builder & Display

## Entities

### Tour (extended)

The Tour model gets a new optional JSON field for itinerary data.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `String` (CUID) | `@id @default(cuid())` | Existing |
| `title` | `String` | Required | Existing |
| `description` | `String` | Required | Existing |
| `images` | `String[]` | Optional | Existing |
| `itinerary` | `Json` | Optional | New — array of milestone objects (see structure below) |
| `createdAt` | `DateTime` | `@default(now())` | Existing |
| `updatedAt` | `DateTime` | `@updatedAt` | Existing |

### ItineraryMilestone

A single milestone is not a separate database model — it is an element within the Tour's `itinerary` JSON array.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `string` (UUID) | Required, unique per array | Client-generated for stable keying |
| `timeTag` | `string` | Required, non-empty | Free text: "09:00 AM" or "Duration: 2 hrs" |
| `iconToken` | `enum` | Required, valid value | `boat`, `safari`, `swim`, `food`, `hotel`, or `generic` |
| `title` | `LocalizedMilestoneTitle` | Required | Object with 6 language keys |

### LocalizedMilestoneTitle

```typescript
interface LocalizedMilestoneTitle {
  en: string;
  de: string;
  ru: string;
  fr: string;
  it: string;
  tr: string;
}
```

Rules:
- `title.en` is REQUIRED (non-empty string) — enforced on save
- All other language titles are OPTIONAL (can be empty strings)
- The `timeTag` is free-text with no format restriction
- `iconToken` must match exactly one of the predefined tokens

### Icon Tokens

| Token | Meaning |
|-------|---------|
| `boat` | Boat/water activity |
| `safari` | Safari/desert activity |
| `swim` | Swimming/snorkeling |
| `food` | Dining/meal |
| `hotel` | Hotel/accommodation |
| `generic` | General/other activity |

## Validation Rules

### Client-side (before save)
1. Each milestone has a unique `id`
2. `timeTag` is non-empty
3. `iconToken` is a valid token
4. `title.en` is non-empty

### Server-side (on save)
1. Re-validate all client-side rules
2. `itinerary` is a valid JSON array
3. Each milestone matches the `ItineraryMilestone` schema
4. `id` values are unique across all milestones

## Database Diagram

```text
Tour
  ┌──────────────────┐
  │ id (PK)          │
  │ title            │
  │ description      │
  │ images[]         │
  │ itinerary        │  ← Json field (nullable)
  │                  │     [ { id, timeTag, iconToken, title: { en, de, ... } }, ... ]
  │ createdAt        │
  │ updatedAt        │
  └──────────────────┘
```
