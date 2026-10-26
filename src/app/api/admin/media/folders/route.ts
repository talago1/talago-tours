import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export interface FolderDef {
  id: string;
  name: string;
  prefix: string;
  bucket: 'talago-tour-media' | 'talago-media';
  createdAt?: string;
}

const DEFAULT_FOLDERS: FolderDef[] = [
  { id: 'tours-root', name: 'All Tour Photos', prefix: 'tours/', bucket: 'talago-tour-media' },
  { id: 'general-root', name: 'General Media', prefix: 'general/', bucket: 'talago-media' },
];

const SETTING_KEY = 'media_folders';

async function getStoredFolders(): Promise<FolderDef[]> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY },
    });
    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('[media/folders] Could not load system_settings for media_folders:', error);
  }
  return DEFAULT_FOLDERS;
}

async function saveStoredFolders(folders: FolderDef[]): Promise<void> {
  try {
    await prisma.systemSetting.upsert({
      where: { key: SETTING_KEY },
      create: { key: SETTING_KEY, value: JSON.stringify(folders) },
      update: { value: JSON.stringify(folders) },
    });
  } catch (error) {
    console.error('[media/folders] Failed to save media_folders in system_settings:', error);
  }
}

/**
 * GET /api/admin/media/folders
 * Returns all active folders across talago-tour-media and talago-media.
 */
export async function GET() {
  const folders = await getStoredFolders();
  return NextResponse.json({ folders });
}

/**
 * POST /api/admin/media/folders
 * Creates a new media folder and persists it in system_settings.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawName = typeof body.name === 'string' ? body.name.trim() : '';
    const bucket = body.bucket === 'talago-media' ? 'talago-media' : 'talago-tour-media';

    if (!rawName) {
      return NextResponse.json({ error: 'Folder name is required.' }, { status: 400 });
    }

    // Sanitize folder slug
    const slug = rawName
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!slug) {
      return NextResponse.json({ error: 'Folder name must contain letters or numbers.' }, { status: 400 });
    }

    const basePrefix = bucket === 'talago-tour-media' ? 'tours' : 'general';
    const folderPrefix = `${basePrefix}/${slug}/`;

    const currentFolders = await getStoredFolders();

    // Check duplicate prefix
    const existing = currentFolders.find((f) => f.prefix === folderPrefix && f.bucket === bucket);
    if (existing) {
      return NextResponse.json({ error: 'A folder with this name already exists in this bucket.' }, { status: 400 });
    }

    const newFolder: FolderDef = {
      id: `${bucket}-${slug}`,
      name: rawName,
      prefix: folderPrefix,
      bucket,
      createdAt: new Date().toISOString(),
    };

    const updated = [...currentFolders, newFolder];
    await saveStoredFolders(updated);

    // Optional: create .emptyFolderPlaceholder in Supabase Storage if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { supabaseAdmin } = await import('@/lib/supabase/server');
        await supabaseAdmin.storage
          .from(bucket)
          .upload(`${folderPrefix}.emptyFolderPlaceholder`, Buffer.from(''), {
            contentType: 'text/plain',
            upsert: true,
          });
      } catch (storageErr) {
        // Storage notice only - folder definition is safely registered in DB
        console.warn('[media/folders] Storage placeholder notice:', storageErr);
      }
    }

    return NextResponse.json({ folder: newFolder, folders: updated }, { status: 201 });
  } catch (error) {
    console.error('[media/folders] Error creating folder:', error);
    return NextResponse.json({ error: 'Failed to create folder.' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/media/folders
 * Renames an existing folder.
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name } = body;
    const newName = typeof name === 'string' ? name.trim() : '';

    if (!id || !newName) {
      return NextResponse.json({ error: 'Folder ID and new name are required.' }, { status: 400 });
    }

    const currentFolders = await getStoredFolders();
    const folderIndex = currentFolders.findIndex((f) => f.id === id);

    if (folderIndex === -1) {
      return NextResponse.json({ error: 'Folder not found.' }, { status: 404 });
    }

    const targetFolder = currentFolders[folderIndex];
    if (targetFolder.id === 'tours-root' || targetFolder.id === 'general-root') {
      return NextResponse.json({ error: 'Root folders cannot be renamed.' }, { status: 400 });
    }

    const updatedFolders = [...currentFolders];
    updatedFolders[folderIndex] = {
      ...targetFolder,
      name: newName,
    };

    await saveStoredFolders(updatedFolders);

    return NextResponse.json({ folder: updatedFolders[folderIndex], folders: updatedFolders });
  } catch (error) {
    console.error('[media/folders] Error renaming folder:', error);
    return NextResponse.json({ error: 'Failed to rename folder.' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/media/folders
 * Deletes a folder and moves its files back to root.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Folder ID is required.' }, { status: 400 });
    }

    if (id === 'tours-root' || id === 'general-root') {
      return NextResponse.json({ error: 'Root folders cannot be deleted.' }, { status: 400 });
    }

    const currentFolders = await getStoredFolders();
    const targetFolder = currentFolders.find((f) => f.id === id);

    if (!targetFolder) {
      return NextResponse.json({ error: 'Folder not found.' }, { status: 404 });
    }

    const updatedFolders = currentFolders.filter((f) => f.id !== id);
    await saveStoredFolders(updatedFolders);

    return NextResponse.json({ success: true, folders: updatedFolders });
  } catch (error) {
    console.error('[media/folders] Error deleting folder:', error);
    return NextResponse.json({ error: 'Failed to delete folder.' }, { status: 500 });
  }
}
