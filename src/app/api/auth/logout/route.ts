import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/server/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}

export async function GET() {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
