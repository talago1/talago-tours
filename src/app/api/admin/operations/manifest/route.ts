export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { buildManifest } from '@/utils/manifestQueryBuilder';
import type { ManifestResponse } from '@/types/manifest';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date || !DATE_REGEX.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid date parameter. Expected format: YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const result = await buildManifest({ date });

    const response: ManifestResponse = {
      success: true,
      date,
      totalBookings: result.totalBookings,
      totalPassengers: result.totalPassengers,
      groups: result.groups,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Manifest error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load manifest' },
      { status: 500 }
    );
  }
}
