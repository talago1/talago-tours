import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { parseSettingValue, serializeSettingValue } from '@/lib/systemSettings';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const ALLOWED_EXTENSIONS: Record<string, ReadonlySet<string>> = {
  'image/jpeg': new Set(['jpg', 'jpeg']),
  'image/png': new Set(['png']),
  'image/webp': new Set(['webp']),
  'image/avif': new Set(['avif']),
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Content sniffing. The declared MIME type and the filename are both attacker
 * controlled, so the bytes themselves are what decide whether a file is a raster
 * image we are willing to store.
 */
function matchesSignature(buffer: Buffer, mimeType: string): boolean {
  switch (mimeType) {
    case 'image/jpeg':
      return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case 'image/png':
      return buffer.length > 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE);
    case 'image/webp':
      return (
        buffer.length > 12 &&
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
      );
    case 'image/avif':
      return (
        buffer.length > 12 &&
        buffer.subarray(4, 8).toString('ascii') === 'ftyp' &&
        (buffer.subarray(8, 12).toString('ascii') === 'avif' ||
          buffer.subarray(8, 12).toString('ascii') === 'avis')
      );
    default:
      return false;
  }
}

function extensionOf(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function canonicalExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'avif';
  }
}

/**
 * Returns a rejection reason, or null when the upload is a real raster image.
 * Three independent checks: the declared type must be allowlisted, the filename
 * extension must match it, and the bytes must carry that format's signature.
 */
function validateUpload(file: File, buffer: Buffer): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return `Unsupported type: ${file.type}. Allowed: JPEG, PNG, WebP, AVIF`;
  }

  const extension = extensionOf(file.name);
  if (!ALLOWED_EXTENSIONS[file.type].has(extension)) {
    return `Extension ".${extension}" does not match ${file.type}. Allowed: ${[...ALLOWED_EXTENSIONS[file.type]].join(', ')}`;
  }

  if (!matchesSignature(buffer, file.type)) {
    return `File contents are not a valid ${file.type} image`;
  }

  return null;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_FILES_PER_REQUEST = 20;
// Worst case a legitimate request can be, plus slack for multipart boundaries
// and part headers. Checked against Content-Length so an oversized body is
// rejected before it is buffered into memory by formData().
const MAX_REQUEST_BYTES = MAX_FILE_SIZE_BYTES * MAX_FILES_PER_REQUEST + 1024 * 1024;

interface UploadedFileResult {
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

interface UploadErrorItem {
  filename: string;
  error: string;
}

interface MultiUploadResponse {
  uploaded: UploadedFileResult[];
  errors: UploadErrorItem[];
  totalSuccess: number;
  totalErrors: number;
  settingsKey?: string | null;
}

/**
 * The stored extension is derived from the verified MIME type rather than from the
 * client's filename, so a spoofed name can never change how the file is served.
 */
function generateUniqueFilename(originalName: string, mimeType: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const sanitizedBase = originalName
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 40);
  return `${timestamp}-${sanitizedBase}-${randomSuffix}.${canonicalExtension(mimeType)}`;
}

async function uploadSingleFile(
  file: File,
  buffer: Buffer,
  targetBucket: string = 'talago-tour-media',
  targetFolder?: string,
): Promise<UploadedFileResult> {
  const uniqueFilename = generateUniqueFilename(file.name, file.type);
  const bucketName = targetBucket === 'talago-media' ? 'talago-media' : 'talago-tour-media';
  const fallbackFolder = bucketName === 'talago-tour-media' ? 'tours' : 'general';
  const requestedFolder = (targetFolder || fallbackFolder).trim().replace(/^\/+|\/+$/g, '');
  const folder = requestedFolder && requestedFolder.split('/').every((segment) => /^[a-zA-Z0-9_-]+$/.test(segment))
    ? requestedFolder
    : fallbackFolder;
  const prefix = `${folder}/`;
  const storagePath = `${prefix}${uniqueFilename}`;

  // 1. Try Supabase Storage if credentials are configured
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase/server');

      const { data, error } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(storagePath, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });

      if (!error && data) {
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${storagePath}`;
        return {
          url: publicUrl,
          filename: uniqueFilename,
          mimeType: file.type,
          sizeBytes: file.size,
        };
      }
      console.warn('Supabase storage upload returned error, falling back to local storage:', error?.message);
    } catch (sbErr) {
      console.warn('Supabase storage upload exception, falling back to local storage:', sbErr);
    }
  }

  // 2. Local disk fallback
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, uniqueFilename);
  await fs.writeFile(filePath, buffer);

  return {
    url: `/uploads/${uniqueFilename}`,
    filename: uniqueFilename,
    mimeType: file.type,
    sizeBytes: file.size,
  };
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<MultiUploadResponse | { error: string; code: string }>> {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Request must be multipart/form-data', code: 'INVALID_CONTENT_TYPE' },
        { status: 400 },
      );
    }

    const declaredLength = Number(request.headers.get('content-length') ?? '0');
    if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
      return NextResponse.json(
        {
          error: `Request too large (${(declaredLength / 1024 / 1024).toFixed(1)}MB). Max ${(MAX_REQUEST_BYTES / 1024 / 1024).toFixed(0)}MB.`,
          code: 'REQUEST_TOO_LARGE',
        },
        { status: 413 },
      );
    }

    const formData = await request.formData();
    const files: File[] = [];

    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.size > 0) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided. Send files under any form field.', code: 'MISSING_FILES' },
        { status: 400 },
      );
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Too many files. Maximum ${MAX_FILES_PER_REQUEST} per request.`, code: 'TOO_MANY_FILES' },
        { status: 400 },
      );
    }

    const uploaded: UploadedFileResult[] = [];
    const errors: UploadErrorItem[] = [];
    const settingsKey = formData.get('settingsKey');
    const targetBucket = (formData.get('bucket') as string) || 'talago-tour-media';
    const targetFolder = formData.get('folder') as string | null;

    for (const file of files) {
      // Size is checked before reading the body: arrayBuffer() buffers the whole
      // file in memory, and up to 20 files are accepted per request.
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push({
          filename: file.name,
          error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`,
        });
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const rejection = validateUpload(file, buffer);
      if (rejection) {
        errors.push({ filename: file.name, error: rejection });
        continue;
      }

      try {
        const result = await uploadSingleFile(file, buffer, targetBucket, targetFolder || undefined);
        uploaded.push(result);
      } catch (err) {
        errors.push({
          filename: file.name,
          error: err instanceof Error ? err.message : 'Upload failed',
        });
      }
    }

    if (uploaded.length > 0) {
      const key = typeof settingsKey === 'string' && settingsKey.trim()
        ? settingsKey.trim()
        : 'uploaded_assets';
      const existing = await prisma.systemSetting.findUnique({ where: { key } });
      const currentAssets = existing
        ? parseSettingValue<UploadedFileResult[]>(existing.value, [])
        : [];
      await prisma.systemSetting.upsert({
        where: { key },
        create: { key, value: serializeSettingValue([...currentAssets, ...uploaded]) },
        update: { value: serializeSettingValue([...currentAssets, ...uploaded]) },
      });
    }

    return NextResponse.json({
      uploaded,
      errors,
      totalSuccess: uploaded.length,
      totalErrors: errors.length,
      settingsKey: typeof settingsKey === 'string' ? settingsKey : null,
    });
  } catch (error) {
    console.error('Upload route error:', error);
    return NextResponse.json(
      { error: 'Internal server error during file upload', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
