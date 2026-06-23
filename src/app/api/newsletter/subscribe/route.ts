import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const existing = await prisma.newsletterSubscription.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      if (!existing.isActive) {
        await prisma.newsletterSubscription.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
      }
      return NextResponse.json({ message: 'Subscribed successfully' });
    }

    await prisma.newsletterSubscription.create({
      data: { email: email.toLowerCase().trim() },
    });

    return NextResponse.json({ message: 'Subscribed successfully' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
