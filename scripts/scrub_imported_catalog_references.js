/* Removes Egypt Gate hyperlinks from imported customer-facing text. */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function loadDotEnv() {
  for (const line of fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}
function scrub(value) {
  if (typeof value === 'string') return value.replace(/https?:\/\/[^\s]*(?:egyptgate\.net)[^\s]*/gi, '').replace(/\s{2,}/g, ' ').trim();
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, scrub(item)]));
  return value;
}
async function main() {
  loadDotEnv();
  const tours = await prisma.tour.findMany({ where: { slug: { startsWith: 'egypt-gate-' } }, select: { id: true, translations: true, itinerary: true, internalNotes: true, cardExcerpt: true, whatToBring: true, pickupDescription: true, cancellationPolicy: true } });
  let updated = 0;
  for (const tour of tours) {
    const next = { translations: scrub(tour.translations), itinerary: scrub(tour.itinerary), internalNotes: scrub(tour.internalNotes), cardExcerpt: scrub(tour.cardExcerpt), whatToBring: scrub(tour.whatToBring), pickupDescription: scrub(tour.pickupDescription), cancellationPolicy: scrub(tour.cancellationPolicy) };
    if (JSON.stringify(next) !== JSON.stringify({ translations: tour.translations, itinerary: tour.itinerary, internalNotes: tour.internalNotes, cardExcerpt: tour.cardExcerpt, whatToBring: tour.whatToBring, pickupDescription: tour.pickupDescription, cancellationPolicy: tour.cancellationPolicy })) {
      await prisma.tour.update({ where: { id: tour.id }, data: next }); updated += 1;
    }
  }
  console.log(JSON.stringify({ scanned: tours.length, updated }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
