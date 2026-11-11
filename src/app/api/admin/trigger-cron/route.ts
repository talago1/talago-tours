/**
 * /api/admin/trigger-cron
 *
 * Admin-only proxy that triggers the daily cron from the UI without
 * exposing ADMIN_API_TOKEN to the browser.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Forward the call to the daily-cron endpoint using the server-side token
  const adminToken = process.env.ADMIN_API_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: 'ADMIN_API_TOKEN not configured' }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const cronUrl = `${baseUrl}/api/notifications/daily-cron`;

  try {
    const res = await fetch(cronUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: json?.error ?? `Cron endpoint returned ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
