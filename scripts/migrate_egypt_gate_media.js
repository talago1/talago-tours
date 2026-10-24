/*
 * Copies authorized imported catalogue images into TALAGO-owned Supabase
 * Storage. It never embeds images in PostgreSQL: object storage is the
 * correct durable home for media; the Tour record stores the resulting URL.
 *
 * Defaults to dry-run. Use --apply. Both --offset and --limit operate on
 * imported tours, which makes a long migration resumable.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

const APPLY = process.argv.includes('--apply');
const offsetArg = process.argv.find((arg) => arg.startsWith('--offset='));
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const OFFSET = Math.max(0, Number(offsetArg?.split('=')[1]) || 0);
const LIMIT = Math.max(0, Number(limitArg?.split('=')[1]) || 0);
const BUCKET = 'talago-tour-media';
const prisma = new PrismaClient();

function loadDotEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[match[1]] = value;
  }
}

function localUrl(url) {
  return typeof url === 'string' && url.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`);
}

function extension(contentType, sourceUrl) {
  const fromType = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }[contentType?.split(';')[0]];
  if (fromType) return fromType;
  const match = sourceUrl.split('?')[0].match(/\.([a-zA-Z0-9]{2,5})$/);
  return match?.[1]?.toLowerCase() || 'jpg';
}

async function copyImage(supabase, tour, sourceUrl, index) {
  if (!sourceUrl || localUrl(sourceUrl)) return sourceUrl;
  const response = await fetch(sourceUrl, { headers: { 'User-Agent': 'TalagoCatalogMigration/1.0' }, signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`${response.status} ${sourceUrl}`);
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  if (!contentType.startsWith('image/')) throw new Error(`Not an image: ${contentType}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > 15 * 1024 * 1024) throw new Error(`Image exceeds 15MB: ${sourceUrl}`);
  const digest = crypto.createHash('sha256').update(sourceUrl).digest('hex').slice(0, 12);
  const filePath = `imports/egypt-gate/${tour.slug}/${String(index + 1).padStart(2, '0')}-${digest}.${extension(contentType, sourceUrl)}`;
  if (APPLY) {
    const { error } = await supabase.storage.from(BUCKET).upload(filePath, buffer, { contentType, upsert: true, cacheControl: '31536000' });
    if (error) throw new Error(error.message);
  }
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filePath}`;
}

async function copyImages(supabase, tour, urls) {
  const results = new Array(urls.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(16, urls.length) }, async () => {
    while (cursor < urls.length) {
      const index = cursor++;
      try { results[index] = { url: await copyImage(supabase, tour, urls[index], index) }; }
      catch (error) { results[index] = { error: error instanceof Error ? error.message : String(error) }; }
    }
  }));
  return results;
}

async function main() {
  loadDotEnv();
  if (!process.env.DATABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Database and Supabase storage credentials are required.');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const all = await prisma.tour.findMany({ where: { slug: { startsWith: 'egypt-gate-' } }, select: { id: true, slug: true, coverImage: true, thumbnailUrl: true, galleryImages: true }, orderBy: { slug: 'asc' } });
  const tours = LIMIT ? all.slice(OFFSET, OFFSET + LIMIT) : all.slice(OFFSET);
  const report = [];
  for (const tour of tours) {
    const originals = Array.from(new Set([tour.coverImage, tour.thumbnailUrl, ...(tour.galleryImages || [])].filter(Boolean)));
    console.log(`Copying ${originals.length} image(s) for ${tour.slug}...`);
    const results = await copyImages(supabase, tour, originals);
    const localImages = results.flatMap((result) => result.url ? [result.url] : []);
    const errors = results.flatMap((result) => result.error ? [result.error] : []);
    if (APPLY) {
      await prisma.tour.update({
        where: { id: tour.id },
        data: { coverImage: localImages[0] || null, thumbnailUrl: localImages[0] || null, galleryImages: localImages },
      });
    }
    report.push({ slug: tour.slug, sourceImages: originals.length, copiedImages: localImages.length, errors });
    console.log(`${tour.slug}: ${localImages.length}/${originals.length}`);
  }
  const summary = { mode: APPLY ? 'apply' : 'dry-run', offset: OFFSET, limit: LIMIT || null, totalImportedTours: all.length, selectedTours: tours.length, toursWithErrors: report.filter((item) => item.errors.length).length, imagesCopied: report.reduce((sum, item) => sum + item.copiedImages, 0), report };
  fs.writeFileSync(path.join(process.cwd(), 'scripts', 'data', 'egypt-gate-media-migration-report.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ ...summary, report: undefined }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
