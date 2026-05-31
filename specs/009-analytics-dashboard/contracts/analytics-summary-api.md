# API Contract: Analytics Summary

## GET /api/admin/analytics/summary

Admin-only endpoint returning aggregated dashboard metrics and channel attribution for a given timeframe.

### Authentication

Requires an active admin session. Returns 401 if unauthorized.

### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| startDate | string (ISO 8601) | Yes | Inclusive start of the analytics period |
| endDate | string (ISO 8601) | Yes | Inclusive end of the analytics period |

### Response 200 — Success

```json
{
  "grossRevenueUSD": 28450.00,
  "netMarginUSD": 18200.00,
  "passengerCount": 47,
  "topTourTitle": "Desert Safari & Quad Bike Adventure",
  "channelBreakdown": [
    { "channel": "VIATOR", "_count": 12, "totalRevenueUSD": 8400.00 },
    { "channel": "GETYOURGUIDE", "_count": 8, "totalRevenueUSD": 5600.00 },
    { "channel": "WHATSAPP", "_count": 15, "totalRevenueUSD": 10500.00 },
    { "channel": "HOTEL_DIRECT", "_count": 5, "totalRevenueUSD": 2400.00 },
    { "channel": "WEBSITE", "_count": 7, "totalRevenueUSD": 1550.00 }
  ]
}
```

Cache: `Cache-Control: public, max-age=0, s-maxage=900` (15-minute revalidation)

### Response 401 — Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### Response 400 — Missing Parameters

```json
{
  "error": "startDate and endDate query parameters are required"
}
```

### Error Codes Reference

| HTTP Status | Condition |
|-------------|-----------|
| 200 | Dashboard data returned successfully |
| 400 | Missing or invalid date parameters |
| 401 | Not authenticated or not admin role |
| 500 | Database query failure or configuration error |

## Server-Side Processing

```text
GET /api/admin/analytics/summary?startDate=2026-05-01&endDate=2026-05-30
  ├── Auth check (getServerSession)
  ├── Prisma.booking.aggregate: _sum(revenue), _sum(guests)
  ├── Prisma.booking.groupBy(channel): _count, _sum(revenue)
  ├── Prisma.booking.groupBy(tourId): _sum(revenue), sorted desc, take 1
  ├── Lookup top tour title
  ├── Compute net margin (deduct tour.costPerPerson × passengerCount)
  ├── Apply USD→EGP conversion
  └── Return ExecutiveDashboardStats JSON
```
