import { NextResponse } from 'next/server';
import {
  getCompanyProfile,
  sanitizePublicCompanyProfile,
} from '@/lib/companyProfile';

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  try {
    const profile = await getCompanyProfile();
    const publicProfile = sanitizePublicCompanyProfile(profile);

    return NextResponse.json(publicProfile);
  } catch (error: any) {
    console.error('[public/company-profile] Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public company profile' },
      { status: 500 }
    );
  }
}
