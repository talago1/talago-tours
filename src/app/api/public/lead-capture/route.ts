import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

// 10 lead captures per IP per 10 minutes
const LIMIT = 10;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'lead-capture'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const { name, email, phone } = await request.json();

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 },
      );
    }

    // Sanitize and truncate inputs
    const safeName = String(name).trim().slice(0, 200);
    const safePhone = String(phone).trim().slice(0, 30);

    // Upsert CustomerProfile: silently create or update
    const profile = await prisma.customerProfile.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        name: safeName,
        phone: safePhone,
        isShadow: true,
      },
      update: {
        name: safeName,
        phone: safePhone,
        isShadow: true,
      },
    });

    return NextResponse.json({
      success: true,
      profileId: profile.id,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to capture lead' },
      { status: 500 },
    );
  }
}
