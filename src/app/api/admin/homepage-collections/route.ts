import { NextRequest, NextResponse } from 'next/server';
import {
  getHomepageCollections,
  saveHomepageCollections,
  getHomepageSections,
  saveHomepageSections,
} from '@/lib/homepageCollections';
import { HomepageCollectionConfig, HomepageSectionConfig } from '@/types/homepage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [collections, sections] = await Promise.all([
      getHomepageCollections(),
      getHomepageSections(),
    ]);
    return NextResponse.json({ success: true, collections, sections });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Updating sections order / visibility
    if (Array.isArray(body.sections)) {
      await saveHomepageSections(body.sections as HomepageSectionConfig[]);
      return NextResponse.json({ success: true, sections: body.sections });
    }

    // If whole collections array provided
    if (Array.isArray(body.collections)) {
      await saveHomepageCollections(body.collections as HomepageCollectionConfig[]);
      return NextResponse.json({ success: true, collections: body.collections });
    }

    const current = await getHomepageCollections();
    const updatedItem = body as HomepageCollectionConfig;
    if (!updatedItem.id) {
      return NextResponse.json({ success: false, error: 'Collection ID is required' }, { status: 400 });
    }

    const idx = current.findIndex((c) => c.id === updatedItem.id);
    let nextList = [...current];
    if (idx >= 0) {
      nextList[idx] = { ...nextList[idx], ...updatedItem };
    } else {
      nextList.push({ ...updatedItem, order: current.length });
    }

    await saveHomepageCollections(nextList);
    return NextResponse.json({ success: true, collections: nextList });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
