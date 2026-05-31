# Research: Operations Calendar & Daily Tour Manifest (Feature 011)

## Decision Log

### 1. Manifest Data Fetch Strategy
- **Decision**: Server-side grouping by tourId in the API endpoint
- **Rationale**: Reduces client processing overhead. The API fetches bookings for the date with eager-loaded tour relations, then groups by tourId before sending to the client. Client receives pre-structured groups.
- **Alternatives considered**: Client-side grouping (higher JS overhead for 200+ bookings), raw SQL aggregation (less type-safe with Prisma)

### 2. Sort Order for Manifest Rows
- **Decision**: Sort by pickup zone order / pickup time on the server
- **Rationale**: Zone-level pickup time configuration naturally optimizes driver routing. Server-side sorting (via `orderBy` in Prisma) is deterministic and consistent. Client receives rows in the optimal logistics order.
- **Alternatives considered**: Client-side sorting (lag during re-sort, inconsistent defaults)

### 3. Date Strip State Management
- **Decision**: URL search params (`?date=YYYY-MM-DD`) as single source of truth
- **Rationale**: Enables shareable/manually bookmarkable manifest links. Next.js `useSearchParams` + `useRouter` for reactive updates without page reload. No global state store needed.
- **Alternatives considered**: React context (not shareable), localStorage (not shareable)

### 4. Client-Side Filtering vs Server-Side
- **Decision**: Client-side JavaScript text matching (native `filter`/`includes`)
- **Rationale**: For 200+ bookings, client-side filtering is instant (<200ms). Eliminates extra API calls on every keystroke. Simpler architecture.
- **Alternatives considered**: Server-side search query param (network latency per keystroke, unnecessary load on DB)

### 5. Print Strategy
- **Decision**: Tailwind `print:` utility modifiers exclusively
- **Rationale**: Zero custom CSSprint rules — consistent with project convention. `print:shadow-none`, `print:text-black`, `print:break-before` handled via Tailwind. A4-friendly column widths.
- **Alternatives considered**: Custom print CSS (adds bloat), third-party print library (banned by constitution)

### 6. Room Number Field
- **Decision**: Add optional `roomNumber` string field to Booking model
- **Rationale**: Required for manifest column display. Nullable to avoid breaking existing bookings. Filled by operator during manifest prep or booking creation.
- **Alternatives considered**: Separate table (overengineered for optional field), not storing at all (breaks FR-006)

### 7. Calendar Departure Badge Data Source
- **Decision**: Dedicated lightweight query counting CONFIRMED+COMPLETED bookings per date in a date range
- **Rationale**: Calendar view needs to know which days have departures before the user clicks. A count query grouped by `travelDate` is fast and minimal.
- **Alternatives considered**: Loading all manifests upfront (excessive), no badge indicators (worse UX)

## Best Practices

### Prisma Date-Indexed Query Pattern
```typescript
const bookings = await prisma.booking.findMany({
  where: {
    travelDate: {
      gte: startOfDay(date),
      lt: startOfDay(addDays(date, 1)),
    },
    status: { in: ['CONFIRMED', 'COMPLETED'] },
  },
  include: { tour: true },
  orderBy: [{ zoneId: 'asc' }, { customerName: 'asc' }],
});
```

### Server-Side Grouping Pattern
```typescript
const grouped = bookings.reduce<Map<string, ManifestGroup>>((acc, b) => {
  const tourId = b.tourId;
  if (!acc.has(tourId)) {
    acc.set(tourId, {
      tourId,
      tourTitle: b.tour.title,
      totalPassengers: 0,
      manifestItems: [],
    });
  }
  const group = acc.get(tourId)!;
  group.totalPassengers += b.guestCount;
  group.manifestItems.push(mapToManifestItem(b));
  return acc;
}, new Map());
```

### URL Date Sync Pattern
```typescript
const searchParams = useSearchParams();
const router = useRouter();
const selectedDate = searchParams.get('date') || formatToday();

function onDateSelect(date: string) {
  const params = new URLSearchParams(searchParams.toString());
  params.set('date', date);
  router.replace(`?${params.toString()}`, { scroll: false });
}
```

### Print-Friendly Layout Pattern
```tsx
<div className="print:shadow-none print:text-black">
  <table className="print:text-xs print:break-inside-avoid">
    {/* manifest rows */}
  </table>
</div>
```
