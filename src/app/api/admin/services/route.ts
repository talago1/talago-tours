import { NextRequest, NextResponse } from 'next/server';
import { getTourServicesCatalog, saveTourServicesCatalog } from '@/lib/tourServices';
import { TourServiceItem } from '@/types/services';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const services = await getTourServicesCatalog();
    return NextResponse.json({ success: true, services });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // If whole list provided
    if (Array.isArray(body.services)) {
      await saveTourServicesCatalog(body.services);
      return NextResponse.json({ success: true, services: body.services });
    }

    // Adding or updating a single service
    const { id, name, description, icon, isActive, badgeText, translations } = body;
    if (!id || !name) {
      return NextResponse.json({ success: false, error: 'Service ID and Name are required.' }, { status: 400 });
    }

    const current = await getTourServicesCatalog();
    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const existingIndex = current.findIndex((s) => s.id === cleanId);

    const updatedService: TourServiceItem = {
      id: cleanId,
      name: name.trim(),
      description: (description || '').trim(),
      icon: icon || 'ShieldCheck',
      isActive: isActive ?? true,
      badgeText: badgeText ? badgeText.trim() : undefined,
      order: existingIndex >= 0 ? current[existingIndex].order : current.length,
      translations: translations || {},
    };

    let nextList = [...current];
    if (existingIndex >= 0) {
      nextList[existingIndex] = updatedService;
    } else {
      nextList.push(updatedService);
    }

    await saveTourServicesCatalog(nextList);
    return NextResponse.json({ success: true, services: nextList });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Service ID is required.' }, { status: 400 });
    }

    const current = await getTourServicesCatalog();
    const nextList = current.filter((s) => s.id !== id);
    await saveTourServicesCatalog(nextList);

    return NextResponse.json({ success: true, services: nextList });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
