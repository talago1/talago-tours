import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DESTINATION_COORDINATES: Record<string, { name: string; lat: number; lng: number }> = {
  hurghada: { name: 'Hurghada', lat: 27.2579, lng: 33.8116 },
  'sharm-el-sheikh': { name: 'Sharm El Sheikh', lat: 27.9158, lng: 34.3299 },
  'marsa-alam': { name: 'Marsa Alam', lat: 25.0676, lng: 34.8790 },
  'el-gouna': { name: 'El Gouna', lat: 27.3918, lng: 33.6799 },
  'makadi-bay': { name: 'Makadi Bay', lat: 26.9985, lng: 33.7804 },
  'sahl-hasheesh': { name: 'Sahl Hasheesh', lat: 27.0706, lng: 33.8401 },
  'soma-bay': { name: 'Soma Bay', lat: 26.8522, lng: 33.9438 },
  safaga: { name: 'Safaga', lat: 26.7337, lng: 33.9366 },
  luxor: { name: 'Luxor', lat: 25.6872, lng: 32.6396 },
  aswan: { name: 'Aswan', lat: 24.0889, lng: 32.8998 },
  cairo: { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
  alexandria: { name: 'Alexandria', lat: 31.2001, lng: 29.9187 },
  fayoum: { name: 'Fayoum', lat: 29.3084, lng: 30.8428 },
  siwa: { name: 'Siwa', lat: 29.2031, lng: 25.5195 },
  'el-alamein': { name: 'El Alamein', lat: 30.8418, lng: 28.9550 },
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

    // 1. Direct city match check — expanded to all Egypt destinations
    if (city.includes('hurghada')) {
      return NextResponse.json({ destination: 'hurghada', destinationName: 'Hurghada', city, country, method: 'city_match' });
    }
    if (city.includes('gouna')) {
      return NextResponse.json({ destination: 'el-gouna', destinationName: 'El Gouna', city, country, method: 'city_match' });
    }
    if (city.includes('makadi')) {
      return NextResponse.json({ destination: 'makadi-bay', destinationName: 'Makadi Bay', city, country, method: 'city_match' });
    }
    if (city.includes('sahl') || city.includes('hasheesh')) {
      return NextResponse.json({ destination: 'sahl-hasheesh', destinationName: 'Sahl Hasheesh', city, country, method: 'city_match' });
    }
    if (city.includes('soma')) {
      return NextResponse.json({ destination: 'soma-bay', destinationName: 'Soma Bay', city, country, method: 'city_match' });
    }
    if (city.includes('safaga')) {
      return NextResponse.json({ destination: 'safaga', destinationName: 'Safaga', city, country, method: 'city_match' });
    }
    if (city.includes('sharm') || city.includes('dahab') || city.includes('sinai')) {
      return NextResponse.json({ destination: 'sharm-el-sheikh', destinationName: 'Sharm El Sheikh', city, country, method: 'city_match' });
    }
    if (city.includes('marsa') || city.includes('alam') || city.includes('quseir') || city.includes('hamata')) {
      return NextResponse.json({ destination: 'marsa-alam', destinationName: 'Marsa Alam', city, country, method: 'city_match' });
    }
    if (city.includes('luxor') || city.includes('karnak') || city.includes('thebes')) {
      return NextResponse.json({ destination: 'luxor', destinationName: 'Luxor', city, country, method: 'city_match' });
    }
    if (city.includes('aswan') || city.includes('assuan') || city.includes('nubia')) {
      return NextResponse.json({ destination: 'aswan', destinationName: 'Aswan', city, country, method: 'city_match' });
    }
    if (city.includes('cairo') || city.includes('giza') || city.includes('heliopolis') || city.includes('maadi')) {
      return NextResponse.json({ destination: 'cairo', destinationName: 'Cairo', city, country, method: 'city_match' });
    }
    if (city.includes('alexandria') || city.includes('alex') || city.includes('borg el arab')) {
      return NextResponse.json({ destination: 'alexandria', destinationName: 'Alexandria', city, country, method: 'city_match' });
    }
    if (city.includes('fayoum') || city.includes('faiyum')) {
      return NextResponse.json({ destination: 'fayoum', destinationName: 'Fayoum', city, country, method: 'city_match' });
    }
    if (city.includes('siwa')) {
      return NextResponse.json({ destination: 'siwa', destinationName: 'Siwa', city, country, method: 'city_match' });
    }
    if (city.includes('alamein') || city.includes('el alamein')) {
      return NextResponse.json({ destination: 'el-alamein', destinationName: 'El Alamein', city, country, method: 'city_match' });
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
