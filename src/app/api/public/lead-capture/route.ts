import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone } = await request.json();

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 },
      );
    }

    // Upsert CustomerProfile: silently create or update
    const profile = await prisma.customerProfile.upsert({
      where: { email },
      create: {
        email,
        name,
        phone,
        isShadow: true,
      },
      update: {
        name,
        phone,
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
