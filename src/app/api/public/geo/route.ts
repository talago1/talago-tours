import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DESTINATION_COORDINATES = {
  hurghada: { name: 'Hurghada', lat: 27.2579, lng: 33.8116 },
  'sharm-el-sheikh': { name: 'Sharm El Sheikh', lat: 27.9158, lng: 34.3299 },
  'marsa-alam': { name: 'Marsa Alam', lat: 25.0676, lng: 34.8790 },
};

// Calculate Haversine distance in kilometers
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const city = request.headers.get('x-vercel-ip-city')?.toLowerCase() || '';
    const country = request.headers.get('x-vercel-ip-country')?.toUpperCase() || '';
    const latStr = request.headers.get('x-vercel-ip-latitude');
    const lngStr = request.headers.get('x-vercel-ip-longitude');

    // 1. Direct city match check
    if (city.includes('hurghada') || city.includes('gouna') || city.includes('safaga') || city.includes('makadi')) {
      return NextResponse.json({
        destination: 'hurghada',
        destinationName: 'Hurghada',
        city,
        country,
        method: 'city_match',
      });
    }

    if (city.includes('sharm') || city.includes('dahab') || city.includes('sinai')) {
      return NextResponse.json({
        destination: 'sharm-el-sheikh',
        destinationName: 'Sharm El Sheikh',
        city,
        country,
        method: 'city_match',
      });
    }

    if (city.includes('marsa') || city.includes('alam') || city.includes('quseir') || city.includes('hamata')) {
      return NextResponse.json({
        destination: 'marsa-alam',
        destinationName: 'Marsa Alam',
        city,
        country,
        method: 'city_match',
      });
    }

    // 2. Latitude / Longitude distance check (if within 200km of any destination)
    if (latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);

      if (!isNaN(lat) && !isNaN(lng)) {
        let closestDest: string | null = null;
        let closestName: string | null = null;
        let minDistance = 250; // max 250km threshold

        for (const [slug, coords] of Object.entries(DESTINATION_COORDINATES)) {
          const dist = getDistanceKm(lat, lng, coords.lat, coords.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closestDest = slug;
            closestName = coords.name;
          }
        }

        if (closestDest) {
          return NextResponse.json({
            destination: closestDest,
            destinationName: closestName,
            distanceKm: Math.round(minDistance),
            city,
            country,
            method: 'coordinates_proximity',
          });
        }
      }
    }

    // 3. Fallback for users outside destination proximity
    return NextResponse.json({
      destination: null,
      city: city || null,
      country: country || null,
      method: 'global_default',
    });
  } catch (error) {
    return NextResponse.json({ destination: null, method: 'fallback_error' });
  }
}
