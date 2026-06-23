import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const SUPPORTED_CURRENCIES = ['EGP', 'USD', 'EUR', 'GBP'] as const;

const CreateCampaignSchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(32, 'Code must be at most 32 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code must only contain letters, numbers, hyphens, or underscores'),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z
    .number()
    .positive('Discount value must be positive'),
  currency: z.enum(SUPPORTED_CURRENCIES),
  minBookingValue: z.number().min(0).default(0),
  maxUses: z.number().int().min(1, 'Max uses must be at least 1'),
  expiresAt: z.string().datetime({ message: 'expiresAt must be a valid ISO 8601 date-time string' }),
  isActive: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateCampaignSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message ?? 'Invalid input' },
        { status: 422 }
      );
    }

    const { code, discountType, discountValue, currency, minBookingValue, maxUses, expiresAt, isActive } =
      parsed.data;

    // Validate percentage range specifically
    if (discountType === 'PERCENTAGE' && discountValue > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 422 }
      );
    }

    // Expiry must be in the future
    if (new Date(expiresAt) <= new Date()) {
      return NextResponse.json(
        { error: 'Expiry date must be in the future' },
        { status: 422 }
      );
    }

    // Normalise code to uppercase before storage
    const normalizedCode = code.trim().toUpperCase();

    const promoCode = await prisma.promoCode.create({
      data: {
        code: normalizedCode,
        discountType,
        discountValue,
        currency,
        minBookingValue,
        maxUses,
        expiresAt: new Date(expiresAt),
        isActive,
      },
    });

    return NextResponse.json(
      {
        data: {
          ...promoCode,
          discountValue: Number(promoCode.discountValue),
          minBookingValue: Number(promoCode.minBookingValue),
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Prisma unique constraint violation (duplicate code)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'A promo code with this name already exists' },
        { status: 409 }
      );
    }

    console.error('[POST /api/admin/campaigns/create] error:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
