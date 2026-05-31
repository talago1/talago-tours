# Data Model: Universal Tour Builder

## Entities

### Tour

The primary entity representing a bookable experience.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `String` (CUID) | `@id @default(cuid())` | Auto-generated |
| `slug` | `String` | `@unique` | URL-safe: lowercase letters, numbers, hyphens |
| `type` | `TourType` enum | Required | `SHARED` or `PRIVATE` |
| `basePriceUSD` | `Float` | Required, > 0 | Base price in USD |
| `durationHours` | `Int` | Required, > 0 | Tour duration |
| `maxCapacity` | `Int` | Required, > 0 | Max participants |
| `zoneId` | `String` | Required | FK to Zone |
| `translations` | `Json` | Required | Structured 6-language content block |
| `images` | `String[]` | Optional | URLs to uploaded media |
| `createdAt` | `DateTime` | `@default(now())` | Auto-set |
| `updatedAt` | `DateTime` | `@updatedAt` | Auto-set |

### Zone

A predefined geographic zone/area for tours.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `String` (CUID) | `@id @default(cuid())` | Auto-generated |
| `name` | `String` | `@unique` | Display name (e.g., "Hurghada", "El Gouna") |
| `createdAt` | `DateTime` | `@default(now())` | Auto-set |

### TourType Enum

```prisma
enum TourType {
  SHARED
  PRIVATE
}
```

### Translations JSON Structure

The `translations` Json field stores a record keyed by language code:

```typescript
type LanguageCode = 'en' | 'de' | 'ru' | 'fr' | 'it' | 'tr';

interface TranslationEntry {
  title: string;
  description: string;
  cancellationPolicies: string[];
}

type Translations = Record<LanguageCode, TranslationEntry>;
```

Validation rules (per spec):
- `en.title` and `en.description` are REQUIRED (non-empty) — enforced server-side
- All other language fields are OPTIONAL (can be empty strings or empty arrays)
- `cancellationPolicies` is an array of free-text strings, 0 to many rows

## Relationships

```
Tour *──1 Zone
```

- A Tour belongs to exactly one Zone (zoneId is required)
- A Zone can have many Tours (cascade behavior: RESTRICT on delete)

## State Transitions

No state machine. Tours are created (active) and updated in-place. No draft/published states for initial version.

## Database Diagram

```text
Zone
  ┌──────────┐
  │ id (PK)  │──┐
  │ name     │  │
  │ createdAt│  │
  └──────────┘  │
               │
Tour            │
  ┌──────────┐  │
  │ id (PK)  │  │
  │ slug (UQ)│  │
  │ type     │  │
  │ basePrice│  │
  │ duration │  │
  │ capacity │  │
  │ zoneId   │──┘  (FK → Zone.id)
  │ transla- │       Json field
  │ tions    │
  │ images[] │
  │ createdAt│
  │ updatedAt│
  └──────────┘
```
