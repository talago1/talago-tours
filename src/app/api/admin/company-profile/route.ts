import { NextRequest, NextResponse } from 'next/server';
import {
  getCompanyProfile,
  saveCompanyProfile,
  calculateProfileCompleteness,
} from '@/lib/companyProfile';
import { isAdminRequest } from '@/utils/adminAuth';

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profile = await getCompanyProfile();
    const completeness = calculateProfileCompleteness(profile);

    return NextResponse.json({
      profile,
      completeness,
    });
  } catch (error: any) {
    console.error('[company-profile] Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updated = await saveCompanyProfile(body);
    const completeness = calculateProfileCompleteness(updated);

    return NextResponse.json({
      success: true,
      profile: updated,
      completeness,
    });
  } catch (error: any) {
    console.error('[company-profile] Error saving profile:', error);
    return NextResponse.json(
      { error: 'Failed to save company profile' },
      { status: 500 }
    );
  }
}
