import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const ALLOWED_BUCKETS = new Set(['talago-tour-media', 'talago-media']);

// Path traversal guard — rejects any segment that is empty or '..'
function isSafePrefix(prefix: string): boolean {
  if (!prefix || prefix.length > 256) return false;
  const segments = prefix.split('/');
  return segments.every((s) => s !== '..' && s !== '.' && !/[<>:"\\|?*\x00-\x1f]/.test(s));
}

async function getRegisteredPrefixes(): Promise<Set<string>> {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'media_folders' } });
    if (setting?.value) {
      const folders = JSON.parse(setting.value) as Array<{ bucket: string; prefix: string }>;
      return new Set(folders.map((f) => `${f.bucket}:${f.prefix.replace(/\/+$/, '') + '/'}`)  );
    }
  } catch {
    // Fall through to defaults
  }
  return new Set(['talago-tour-media:tours/', 'talago-media:general/']);
}

interface MoveItemPayload {
  bucket: string;
  path: string;
  name: string;
  id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: MoveItemPayload[] = Array.isArray(body.items) ? body.items : [];

    // Validate targetBucket
    const targetBucket = typeof body.targetBucket === 'string' ? body.targetBucket : '';
    if (!ALLOWED_BUCKETS.has(targetBucket)) {
      return NextResponse.json({ error: `Invalid targetBucket. Allowed: ${[...ALLOWED_BUCKETS].join(', ')}` }, { status: 400 });
    }

    // Validate and sanitize targetPrefix
    const rawTargetPrefix = typeof body.targetPrefix === 'string' ? body.targetPrefix : '';
    if (!isSafePrefix(rawTargetPrefix)) {
      return NextResponse.json({ error: 'Invalid targetPrefix: path traversal or illegal characters detected.' }, { status: 400 });
    }
    const targetPrefix = rawTargetPrefix.trim().replace(/^\/+/, '').replace(/\/+$/, '') + '/';

    // Validate targetPrefix is a registered folder
    const registeredPrefixes = await getRegisteredPrefixes();
    const prefixKey = `${targetBucket}:${targetPrefix}`;
    if (!registeredPrefixes.has(prefixKey)) {
      return NextResponse.json(
        { error: `Target destination '${targetPrefix}' is not a registered folder in bucket '${targetBucket}'.` },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'No items provided to move.' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase storage is not configured.' }, { status: 500 });
    }

    const { supabaseAdmin } = await import('@/lib/supabase/server');
    const errors: string[] = [];
    let movedCount = 0;

    for (const item of items) {
      try {
        const fileName = item.name || item.path.split('/').pop() || 'file';
        const sourcePath = item.path.replace(/^\/+/, '');
        const destinationPath = `${targetPrefix}${fileName}`;

        if (item.bucket === targetBucket && sourcePath === destinationPath) {
          // Already in target folder
          continue;
        }

        if (item.bucket === targetBucket) {
          // Fast native storage move within the same bucket
          const { error: moveError } = await supabaseAdmin.storage
            .from(targetBucket)
            .move(sourcePath, destinationPath);

          if (moveError) {
            // If destination already exists or move failed, attempt copy and delete
            const { error: copyError } = await supabaseAdmin.storage
              .from(targetBucket)
              .copy(sourcePath, destinationPath);
            if (copyError) {
              errors.push(`Failed to move ${item.name}: ${moveError.message}`);
              continue;
            }
            await supabaseAdmin.storage.from(targetBucket).remove([sourcePath]);
          }
        } else {
          // Cross-bucket move: stream buffer in server memory, upload to destination, remove from source
          const { data: blobData, error: downloadError } = await supabaseAdmin.storage
            .from(item.bucket)
            .download(sourcePath);

          if (downloadError || !blobData) {
            errors.push(`Could not read source asset ${item.name}: ${downloadError?.message}`);
            continue;
          }

          const buffer = Buffer.from(await blobData.arrayBuffer());
          const { error: uploadError } = await supabaseAdmin.storage
            .from(targetBucket)
            .upload(destinationPath, buffer, {
              contentType: blobData.type || 'image/jpeg',
              upsert: true,
            });

          if (uploadError) {
            errors.push(`Could not write to destination for ${item.name}: ${uploadError.message}`);
            continue;
          }

          await supabaseAdmin.storage.from(item.bucket).remove([sourcePath]);
        }

        // Update database MediaAsset record if associated
        try {
          await prisma.mediaAsset.updateMany({
            where: { filePath: sourcePath },
            data: { filePath: destinationPath },
          });
        } catch {
          // Non-blocking metadata sync
        }

        // TAL-M8: Cascade URL-rewrite on Tour records that referenced the moved asset.
        // Supabase public URLs follow: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
        if (supabaseUrl) {
          const oldPublicUrl = `${supabaseUrl}/storage/v1/object/public/${item.bucket}/${sourcePath}`;
          const newPublicUrl = `${supabaseUrl}/storage/v1/object/public/${targetBucket}/${destinationPath}`;

          try {
            // Rewrite coverImage references
            await prisma.tour.updateMany({
              where: { coverImage: oldPublicUrl },
              data: { coverImage: newPublicUrl },
            });

            // Rewrite galleryImages references (requires raw SQL because Prisma cannot
            // update individual array elements without replacing the whole array)
            await prisma.$executeRaw`
              UPDATE "Tour"
              SET "galleryImages" = array_replace("galleryImages", ${oldPublicUrl}, ${newPublicUrl})
              WHERE ${oldPublicUrl} = ANY("galleryImages")
            `;
          } catch (urlUpdateErr) {
            console.warn('[media/move] Tour URL rewrite failed for', item.name, urlUpdateErr);
            // Non-blocking: the storage move succeeded, URL rewrite is best-effort
          }
        }

        movedCount++;
      } catch (itemErr) {
        errors.push(`Error moving ${item.name}: ${itemErr instanceof Error ? itemErr.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      movedCount,
      totalRequested: items.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[media/move] Batch move error:', error);
    return NextResponse.json({ error: 'Internal server error while moving media.' }, { status: 500 });
  }
}
