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

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_FILES_PER_REQUEST = 20;

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

function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const sanitizedBase = originalName
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 40);
  return `${timestamp}-${sanitizedBase}-${randomSuffix}.${extension}`;
}

async function uploadSingleFile(file: File): Promise<UploadedFileResult> {
  const uniqueFilename = generateUniqueFilename(file.name);
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  
  // Ensure the directory exists
  await fs.mkdir(uploadDir, { recursive: true });
  
  const filePath = path.join(uploadDir, uniqueFilename);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
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

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        errors.push({
          filename: file.name,
          error: `Unsupported type: ${file.type}. Allowed: JPEG, PNG, WebP, AVIF`,
        });
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push({
          filename: file.name,
          error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`,
        });
        continue;
      }

      try {
        const result = await uploadSingleFile(file);
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
