import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fsPromises from 'fs/promises';
import pathModule from 'path';

export const dynamic = 'force-dynamic';

export interface MediaItemDto {
  id: string;
  name: string;
  url: string;
  bucket: string;
  path: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
  tourId?: string | null;
}

const TOUR_BUCKET = 'talago-tour-media';
const GENERAL_BUCKET = 'talago-media';

function safeStorageFolder(value: string | null, fallback: string): string {
  const candidate = (value || fallback).trim().replace(/^\/+|\/+$/g, '');
  if (!candidate || candidate.split('/').some((segment) => !/^[a-zA-Z0-9_-]+$/.test(segment))) {
    return fallback;
  }
  return candidate;
}

/**
 * Recursively fetches all items from a Supabase storage bucket folder
 * across multiple 100-item pages so no older files ever disappear. Pagination
 * is applied only to the response, never to storage discovery.
 */
async function listAllBucketFiles(supabaseAdmin: any, bucket: string, prefix: string = ''): Promise<any[]> {
  const allFiles: any[] = [];
  const batchSize = 100;
  let currentOffset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(prefix, {
        limit: batchSize,
        offset: currentOffset,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error || !Array.isArray(data) || data.length === 0) {
      break;
    }

    allFiles.push(...data);

    if (data.length < batchSize) {
      hasMore = false;
    } else {
      currentOffset += batchSize;
    }

  }

  return allFiles;
}

/**
 * GET /api/admin/media
 * Supports:
 * - tourId: Filter by tourId (queries database MediaAsset table)
 * - bucket: 'all' | 'talago-tour-media' | 'talago-media'
 * - search: filename search substring
 * - limit / offset: pagination
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tourId = searchParams.get('tourId');
  const bucketParam = searchParams.get('bucket') || 'all';
  const requestedFolder = searchParams.get('folder');
  const searchQuery = (searchParams.get('search') || '').toLowerCase().trim();
  const limit = Math.min(Number(searchParams.get('limit') || 200), 500);
  const offset = Number(searchParams.get('offset') || 0);

  // If specific tourId requested and no bucket override, return MediaAsset records for compatibility
  if (tourId && bucketParam === 'all') {
    const assets = await prisma.mediaAsset.findMany({
      where: { tourId },
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json(assets);
  }

  const items: MediaItemDto[] = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Query Supabase Storage if configured
  if (supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase/server');

      // 1. Tour Bucket
      if (bucketParam === 'all' || bucketParam === TOUR_BUCKET) {
        const candidateFolder = requestedFolder?.startsWith('tours') ? requestedFolder : (bucketParam === TOUR_BUCKET ? requestedFolder : null);
        const tourFolder = safeStorageFolder(candidateFolder, 'tours');
        // List every file in the selected catalog folder without a 100-file ceiling.
        const tourFiles = await listAllBucketFiles(supabaseAdmin, TOUR_BUCKET, tourFolder);
        for (const f of tourFiles) {
          if (f.name === '.emptyFolderPlaceholder') continue;
          const fullPath = `${tourFolder}/${f.name}`;
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${TOUR_BUCKET}/${fullPath}`;
          items.push({
            id: `${TOUR_BUCKET}/${fullPath}`,
            name: f.name,
            url: publicUrl,
            bucket: TOUR_BUCKET,
            path: fullPath,
            sizeBytes: f.metadata?.size ?? 0,
            mimeType: f.metadata?.mimetype ?? 'image/jpeg',
            createdAt: f.created_at ?? new Date().toISOString(),
          });
        }

        // Preserve older assets that were uploaded before catalog folders existed.
        if (bucketParam === 'all' && !requestedFolder) {
          const rootTourFiles = await listAllBucketFiles(supabaseAdmin, TOUR_BUCKET, '');
          for (const f of rootTourFiles) {
            if (f.name === '.emptyFolderPlaceholder' || f.name === 'tours' || !f.id) continue;
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/${TOUR_BUCKET}/${f.name}`;
            items.push({
              id: `${TOUR_BUCKET}/${f.name}`,
              name: f.name,
              url: publicUrl,
              bucket: TOUR_BUCKET,
              path: f.name,
              sizeBytes: f.metadata?.size ?? 0,
              mimeType: f.metadata?.mimetype ?? 'image/jpeg',
              createdAt: f.created_at ?? new Date().toISOString(),
            });
          }
        }

      }

      // 2. General Bucket
      if (bucketParam === 'all' || bucketParam === GENERAL_BUCKET) {
        const candidateGeneral = requestedFolder?.startsWith('general') ? requestedFolder : (bucketParam === GENERAL_BUCKET ? requestedFolder : null);
        const generalFolder = safeStorageFolder(candidateGeneral, 'general');
        const genFiles = await listAllBucketFiles(supabaseAdmin, GENERAL_BUCKET, generalFolder);
        for (const f of genFiles) {
          if (f.name === '.emptyFolderPlaceholder') continue;
          const fullPath = `${generalFolder}/${f.name}`;
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${GENERAL_BUCKET}/${fullPath}`;
          items.push({
            id: `${GENERAL_BUCKET}/${fullPath}`,
            name: f.name,
            url: publicUrl,
            bucket: GENERAL_BUCKET,
            path: fullPath,
            sizeBytes: f.metadata?.size ?? 0,
            mimeType: f.metadata?.mimetype ?? 'image/jpeg',
            createdAt: f.created_at ?? new Date().toISOString(),
          });
        }

        if (bucketParam === 'all' && !requestedFolder) {
          const rootGeneralFiles = await listAllBucketFiles(supabaseAdmin, GENERAL_BUCKET, '');
          for (const f of rootGeneralFiles) {
            if (f.name === '.emptyFolderPlaceholder' || f.name === 'general' || !f.id) continue;
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/${GENERAL_BUCKET}/${f.name}`;
            items.push({
              id: `${GENERAL_BUCKET}/${f.name}`,
              name: f.name,
              url: publicUrl,
              bucket: GENERAL_BUCKET,
              path: f.name,
              sizeBytes: f.metadata?.size ?? 0,
              mimeType: f.metadata?.mimetype ?? 'image/jpeg',
              createdAt: f.created_at ?? new Date().toISOString(),
            });
          }
        }
      }
    } catch (sbErr) {
      console.warn('[media] Supabase storage listing warning:', sbErr);
    }
  }

  // 3. Local disk fallback: public/uploads
  try {
    const uploadDir = pathModule.join(process.cwd(), 'public', 'uploads');
    const localFiles = await fsPromises.readdir(uploadDir).catch(() => []);
    for (const file of localFiles) {
      if (file.startsWith('.')) continue;
      const stats = await fsPromises.stat(pathModule.join(uploadDir, file)).catch(() => null);
      if (stats && stats.isFile()) {
        const ext = file.split('.').pop()?.toLowerCase();
        const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        items.push({
          id: `local/${file}`,
          name: file,
          url: `/uploads/${file}`,
          bucket: 'local-uploads',
          path: file,
          sizeBytes: stats.size,
          mimeType: mime,
          createdAt: stats.birthtime.toISOString(),
        });
      }
    }
  } catch {
    // Non-fatal
  }

  // Apply search filtering
  let filtered = items;
  if (searchQuery) {
    filtered = filtered.filter((item) =>
      item.name.toLowerCase().includes(searchQuery) ||
      item.path.toLowerCase().includes(searchQuery)
    );
  }

  // Sort by newest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const paginated = filtered.slice(offset, offset + limit);

  return NextResponse.json({
    items: paginated,
    total: filtered.length,
    offset,
    limit,
  });
}

/**
 * DELETE /api/admin/media
 * Deletes an asset by bucket + path, or by id
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { bucket, path, id } = body;

    if (!bucket && !path && !id) {
      return NextResponse.json({ error: 'bucket and path or id required' }, { status: 400 });
    }

    // Supabase deletion
    if (bucket && path && bucket !== 'local-uploads') {
      const { supabaseAdmin } = await import('@/lib/supabase/server');
      await supabaseAdmin.storage.from(bucket).remove([path]);
    }

    // Local disk deletion
    if (bucket === 'local-uploads' && path) {
      const filePath = pathModule.join(process.cwd(), 'public', 'uploads', pathModule.basename(path));
      await fsPromises.unlink(filePath).catch(() => null);
    }

    // Database deletion if matching id
    if (id) {
      await prisma.mediaAsset.deleteMany({
        where: {
          OR: [{ id }, { filePath: path }],
        },
      }).catch(() => null);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[media] Delete error:', err);
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}
