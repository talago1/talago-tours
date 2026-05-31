# Quickstart: Dynamic Milestone Timeline Itinerary Builder & Display

## Prerequisites

- Node.js 18+, Next.js 14+ (App Router)
- PostgreSQL database with Prisma schema migrated
- Tour model must support `itinerary` Json field (add via Prisma migration)
- Install `lucide-react`: `npm install lucide-react`

## Files to Create

### 1. Prisma Schema Update (`prisma/schema.prisma`)

Add `itinerary Json?` field to the Tour model.

### 2. Type Definitions (`src/types/itinerary.ts`)

TypeScript interfaces: `ItineraryMilestone`, `LocalizedMilestoneTitle`, `IconToken`. Also the icon mapper utility mapping token strings to Lucide components.

### 3. Validation Utilities (`src/utils/itineraryValidator.ts`)

Validation functions: `validateMilestone`, `validateItinerary` — checks time tag, English title, unique IDs.

### 4. Admin Builder (`src/components/admin/ItineraryBuilder.tsx`)

Dynamic array input builder with add, reorder, delete milestone controls. Hooks into language tab system for multi-language title inputs.

### 5. Public Timeline (`src/components/tours/TourTimeline.tsx`)

Chronological vertical timeline displaying milestone nodes with icon bubbles, time tags, and titles. Zero CLS guaranteed via fixed dimensions.

## Data Flow

```text
Admin builder:
  Add milestone → new row with time/icon/title fields
  Edit in language tab → switches title input language key
  Reorder/delete → array state mutations
  Save tour → itinerary embedded in tour payload
  API validates → persisted in Tour.itinerary JSON

Public timeline:
  Tour page loads → itineray fetched (server-side)
  Milestones mapped to timeline nodes
  Titles shown in viewer's language (→ en fallback)
```

## Key Design Decisions

- Itinerary embedded in Tour as JSON array — no standalone save
- Icon tokens mapped to Lucide components via static mapper object
- Fixed dimensions for timeline nodes (zero CLS)
- English title required, all other languages optional
- Single-day itinerary only
