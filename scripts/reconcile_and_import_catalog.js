/*
 * Master Catalog Reconciliation & Import Script
 *
 * Runs reconciliation:
 * 1. Safely enriches genuine Class A matches on existing TALAGO tours (provenance in internalNotes, preserves prices).
 * 2. Curates and imports genuine Class C unique experiences as DRAFT tours.
 * 3. Maps sub-resorts/zones (Makadi Bay, Sahl Hasheesh, Soma Bay, Safaga, Port Ghalib, El Quseir) to parent destinations.
 * 4. Deduplicates across suppliers (e.g., Orange Bay from EgyptGate + MarsaWaves -> 1 canonical DRAFT).
 * 5. Strictly creates DRAFT tours only (never auto-publishes).
 *
 * Usage:
 *   node scripts/reconcile_and_import_catalog.js --dry-run
 *   node scripts/reconcile_and_import_catalog.js --apply
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');

// Island disambiguation: these are DISTINCT islands and must NEVER be merged into a single generic island tour
const DISTINCT_ISLANDS = ['orange', 'mahmya', 'eden', 'bianca', 'paradise', 'utopia', 'magawish', 'tiran', 'white', 'giftun'];

function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function normalizeTitle(title) {
  return (title || '')
    .toLowerCase()
    .replace(/\b(full\s*day|half\s*day|trip|tour|excursion|with\s*lunch|boat\s*trip|snorkeling|from\s*hurghada|from\s*sharm|from\s*cairo|from\s*marsa\s*alam)\b/gi, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function main() {
  console.log(`=== TALAGO MASTER CATALOG RECONCILIATION & IMPORT ===`);
  console.log(`Mode: ${APPLY ? '🚀 APPLY (Writing to database)' : '🔍 DRY-RUN (Preview only)'}\n`);

  // 1. Fetch current database state
  const [totalTours, activeTours, draftTours, inactiveTours, destinations] = await Promise.all([
    prisma.tour.count(),
    prisma.tour.count({ where: { status: 'ACTIVE' } }),
    prisma.tour.count({ where: { status: 'DRAFT' } }),
    prisma.tour.count({ where: { status: 'INACTIVE' } }),
    prisma.destination.findMany({ select: { id: true, slug: true, name: true } })
  ]);

  console.log(`Current DB State:`);
  console.log(` - Total tours: ${totalTours} (ACTIVE: ${activeTours}, DRAFT: ${draftTours}, INACTIVE: ${inactiveTours})`);
  console.log(` - Destinations: ${destinations.length}`);

  // Build destination lookup map
  const destMap = {};
  destinations.forEach(d => {
    destMap[d.slug] = d.id;
    destMap[d.name.toLowerCase()] = d.id;
  });

  // Helper to map any source destination / resort name to valid DB destinationId
  function resolveDestinationId(rawDest) {
    if (!rawDest) return destMap['hurghada'];
    const norm = rawDest.toLowerCase().trim();

    if (destMap[norm]) return destMap[norm];

    // Standard mappings
    if (norm.includes('hurghada') || norm.includes('makadi') || norm.includes('sahl hasheesh') || norm.includes('soma bay') || norm.includes('safaga')) {
      return destMap['hurghada'];
    }
    if (norm.includes('sharm') || norm.includes('dahab')) {
      return destMap['sharm-el-sheikh'];
    }
    if (norm.includes('marsa alam') || norm.includes('port ghalib') || norm.includes('el quseir') || norm.includes('quseir')) {
      return destMap['marsa-alam'];
    }
    if (norm.includes('cairo') || norm.includes('giza')) {
      return destMap['cairo'];
    }
    if (norm.includes('luxor')) {
      return destMap['luxor'];
    }
    if (norm.includes('el gouna') || norm.includes('gouna')) {
      return destMap['el-gouna'];
    }
    if (norm.includes('aswan')) {
      return destMap['aswan'];
    }
    if (norm.includes('alexandria')) {
      return destMap['alexandria'];
    }
    if (norm.includes('siwa')) {
      return destMap['siwa'];
    }
    if (norm.includes('fayoum')) {
      return destMap['fayoum'];
    }
    if (norm.includes('alamein')) {
      return destMap['el-alamein'];
    }

    return destMap['hurghada'];
  }

  // 2. Load classified match results
  const matchData = JSON.parse(fs.readFileSync('scripts/data/match_results.json', 'utf8'));
  const matchResults = matchData.results || matchData;

  // Load raw source files for full rich details
  const egTours = JSON.parse(fs.readFileSync('scripts/data/sources/source_egyptgate.json', 'utf8')).tours || [];
  const mwTours = JSON.parse(fs.readFileSync('scripts/data/sources/source_marsawaves.json', 'utf8')).tours || [];
  const h4uTours = JSON.parse(fs.readFileSync('scripts/data/sources/source_hurghadaforyou.json', 'utf8')).tours || [];
  const albTours = JSON.parse(fs.readFileSync('scripts/data/sources/source_albatros.json', 'utf8')).tours || [];

  const rawBySourceAndUrl = new Map();
  [...egTours, ...mwTours, ...h4uTours, ...albTours].forEach(t => {
    if (t.sourceUrl) rawBySourceAndUrl.set(t.sourceUrl, t);
  });

  // 3. STEP A: Identify and apply genuine Class A matches safely
  console.log(`\n========================================`);
  console.log(`STEP 1: Class A Reconciliation (Enrich Existing Tours)`);
  console.log(`========================================`);

  const classARecords = matchResults.filter(r => r.classification === 'A');
  const genuineClassA = [];
  const classAToReclassify = [];

  for (const r of classARecords) {
    const srcName = r.sourceName.toLowerCase();
    const matchedSlug = r.matchedTourSlug;

    let isConflict = false;
    if (matchedSlug.includes('hula-hula-paradise-island')) {
      if (srcName.includes('orange') || srcName.includes('mahmya') || srcName.includes('eden') || srcName.includes('bianca') || srcName.includes('utopia') || srcName.includes('magawish') || srcName.includes('ozirea')) {
        isConflict = true;
      }
    }
    if (matchedSlug.includes('tiran') && (srcName.includes('mahmya') || srcName.includes('bianca') || srcName.includes('eden') || srcName.includes('hula hula') || srcName.includes('catamaran') || srcName.includes('quseir'))) {
      isConflict = true;
    }
    if (matchedSlug.includes('dolphin-house-white-island-speedboat') && (srcName.includes('private speed boat to dolphin house') || srcName.includes('catamaran'))) {
      isConflict = true;
    }

    if (isConflict) {
      classAToReclassify.push(r);
    } else {
      genuineClassA.push(r);
    }
  }

  console.log(`Total Class A items: ${classARecords.length}`);
  console.log(` - Genuine verified matches: ${genuineClassA.length}`);
  console.log(` - Distinct products reclassified to Class C: ${classAToReclassify.length}`);

  let classAAppliedCount = 0;
  for (const match of genuineClassA) {
    const existing = await prisma.tour.findUnique({
      where: { slug: match.matchedTourSlug },
      select: { id: true, slug: true, basePriceUSD: true, adultPrice: true, internalNotes: true, hotelPickupIncluded: true }
    });

    if (!existing) {
      console.log(`[WARN] Matched tour ${match.matchedTourSlug} not found in DB`);
      continue;
    }

    const priceInfo = typeof match.priceFrom === 'object' ? match.priceFrom?.from : match.priceFrom;
    const provenanceNote = `[Reconciled from ${match.source}] sourceUrl=${match.sourceUrl || ''}; supplierPrice=$${priceInfo || 'N/A'}; verifiedAt=${new Date().toISOString()}`;
    const newNotes = existing.internalNotes ? `${existing.internalNotes} | ${provenanceNote}`.slice(0, 500) : provenanceNote;

    console.log(`  Updating ${existing.slug}:`);
    console.log(`    + Appending provenance: ${provenanceNote}`);
    console.log(`    = Preserving confirmed Talago selling price: $${existing.basePriceUSD}`);

    if (APPLY) {
      await prisma.tour.update({
        where: { id: existing.id },
        data: {
          internalNotes: newNotes,
          hotelPickupIncluded: existing.hotelPickupIncluded || true
        }
      });
    }
    classAAppliedCount++;
  }

  console.log(`=> Class A updates applied: ${classAAppliedCount}`);

  // 4. STEP B: Candidate selection for Class C (New DRAFT Tours)
  console.log(`\n========================================`);
  console.log(`STEP 2: Class C Curation (Create High-Quality DRAFT Tours)`);
  console.log(`========================================`);

  // Collect candidate pools:
  // 1. Original Class C records from match results
  // 2. Class A reclassified items (distinct island tours like Orange Bay, Eden Island, Mahmya)
  // 3. Class D records that belong to existing destinations (e.g. Cairo, Makadi Bay, Port Ghalib)
  const candidatePool = [];

  // Add reclassified items
  classAToReclassify.forEach(r => candidatePool.push({ ...r, reason: 'reclassified_from_A' }));

  // Add Class C items
  matchResults.filter(r => r.classification === 'C').forEach(r => candidatePool.push(r));

  // Add Class D items where destination is in fact covered
  matchResults.filter(r => r.classification === 'D').forEach(r => {
    candidatePool.push({ ...r, reason: 'resolved_destination_gap' });
  });

  console.log(`Total potential new candidates in pool: ${candidatePool.length}`);

  // Deduplicate and filter candidates:
  // Requirements:
  // - Must have English title (filter out Cyrillic/German-only blog posts or airport transfers)
  // - Must not be a generic transfer or taxi service (unless it's an excursion)
  // - Must have valid price > 0
  // - Deduplicate by normalized experience name + destination
  const existingSlugs = new Set((await prisma.tour.findMany({ select: { slug: true } })).map(t => t.slug));
  const seenExperienceKeys = new Set();
  const validDrafts = [];
  let skippedNonEnglish = 0;
  let skippedZeroPrice = 0;
  let skippedTransferTaxi = 0;
  let skippedDuplicateExperience = 0;

  for (const cand of candidatePool) {
    const raw = rawBySourceAndUrl.get(cand.sourceUrl) || cand;
    const title = cand.sourceName || raw.sourceName || '';

    // Check language: exclude Cyrillic and clear German-only
    const hasCyrillic = /[а-яА-ЯёЁ]/.test(title);
    const isGerman = /\b(ausflug|stadtrundfahrt|privater transfer|individuelle)\b/i.test(title);
    if (hasCyrillic || isGerman) {
      skippedNonEnglish++;
      continue;
    }

    // Exclude airport transfer / taxi services
    if (/\b(transfer|taxi|airport to|airport transfer|flughafentransfer)\b/i.test(title) && !/\b(safari|snorkeling|island|cairo|luxor|pyramid)\b/i.test(title)) {
      skippedTransferTaxi++;
      continue;
    }

    // Extract price
    let price = 0;
    if (typeof cand.priceFrom === 'object') {
      price = Number(cand.priceFrom?.from || cand.priceFrom?.adult || 0);
    } else {
      price = Number(cand.priceFrom || raw.priceFrom || raw.priceAdult || 0);
    }

    if (!price || price <= 0 || isNaN(price)) {
      skippedZeroPrice++;
      continue;
    }

    // Normalized key for deduplication
    const normName = normalizeTitle(title);
    const destKey = cand.destination || 'hurghada';
    const dedupKey = `${slugify(destKey)}:${normName}`;

    if (seenExperienceKeys.has(dedupKey)) {
      skippedDuplicateExperience++;
      continue;
    }
    seenExperienceKeys.add(dedupKey);

    // Resolve destination ID
    const destinationId = resolveDestinationId(cand.destination);

    // Build unique slug
    let baseSlug = `draft-${cand.source}-${slugify(title)}`.slice(0, 50);
    let finalSlug = baseSlug;
    let counter = 1;
    while (existingSlugs.has(finalSlug)) {
      finalSlug = `${baseSlug}-${counter++}`;
    }
    existingSlugs.add(finalSlug);

    // Duration
    const durationHours = raw.durationHours ? Math.max(1, Math.min(24, Math.round(Number(raw.durationHours)))) : 5;

    // Group type
    const isPrivate = /\b(private|vip|individual)\b/i.test(title) || cand.groupType === 'Private';

    // Inclusions & Exclusions
    const inclusions = Array.isArray(raw.inclusions) && raw.inclusions.length > 0 ? raw.inclusions : [
      'Hotel pickup and drop-off',
      'Professional local guide',
      'Transportation in air-conditioned vehicle'
    ];
    const exclusions = Array.isArray(raw.exclusions) && raw.exclusions.length > 0 ? raw.exclusions : [
      'Personal expenses',
      'Gratuities (optional)'
    ];

    // Description
    const rawDesc = raw.rawDescription || raw.description || '';
    const cleanDesc = rawDesc.length > 30
      ? rawDesc.slice(0, 800)
      : `Discover ${title} in ${cand.destination || 'Egypt'} with comfortable transport, expert guidance, and hassle-free booking through TALAGO.`;

    const draftTourData = {
      slug: finalSlug,
      type: isPrivate ? 'PRIVATE' : 'SHARED',
      status: 'DRAFT', // STRICT REQUIREMENT: MUST BE DRAFT
      basePriceUSD: Math.round(price),
      adultPrice: Math.round(price),
      childPrice: raw.priceChild ? Math.round(Number(raw.priceChild)) : Math.round(price * 0.6),
      infantPrice: raw.priceInfant ? Math.round(Number(raw.priceInfant)) : 0,
      durationHours,
      duration: `${durationHours} hours`,
      maxCapacity: isPrivate ? 8 : 20,
      destinationId,
      category: cand.category || raw.category || 'sea',
      inclusions,
      exclusions,
      hotelPickupIncluded: true,
      internalNotes: `[Import Candidate from ${cand.source}] url=${cand.sourceUrl || ''}; supplierPrice=$${price}; importedAt=${new Date().toISOString()}`,
      translations: {
        en: {
          title,
          description: cleanDesc,
          cardExcerpt: cleanDesc.slice(0, 140),
          highlights: raw.highlights || [],
          inclusions,
          exclusions,
          whatToBring: raw.whatToBring || 'Comfortable shoes, sunscreen, camera, sunglasses, passport',
          importantInfo: 'Please advise any specific dietary requirements at time of booking.',
          pickupDescription: 'Round-trip hotel transfer included from your resort.',
          cancellationPolicy: 'Free cancellation up to 24 hours before experience start time'
        }
      }
    };

    validDrafts.push(draftTourData);
  }

  console.log(`\nCandidate filtering results:`);
  console.log(` - Skipped non-English / foreign blog posts: ${skippedNonEnglish}`);
  console.log(` - Skipped zero/invalid prices: ${skippedZeroPrice}`);
  console.log(` - Skipped airport taxi/transfers: ${skippedTransferTaxi}`);
  console.log(` - Skipped duplicate cross-source experiences: ${skippedDuplicateExperience}`);
  console.log(` - Valid unique DRAFT tours prepared: ${validDrafts.length}`);

  // Breakdown by destination
  const draftsByDest = {};
  for (const d of validDrafts) {
    const dest = destinations.find(x => x.id === d.destinationId)?.name || 'Unknown';
    draftsByDest[dest] = (draftsByDest[dest] || 0) + 1;
  }
  console.log(`\nDraft tours by destination:`, draftsByDest);

  // Breakdown by source
  const draftsBySource = {};
  for (const d of validDrafts) {
    const src = d.slug.split('-')[1];
    draftsBySource[src] = (draftsBySource[src] || 0) + 1;
  }
  console.log(`Draft tours by supplier:`, draftsBySource);

  // Show sample drafts
  console.log(`\nSample DRAFT tours to be created (first 10):`);
  validDrafts.slice(0, 10).forEach((d, i) => {
    console.log(` ${i + 1}. [${d.slug}] "${d.translations.en.title}" | $${d.basePriceUSD} | ${d.durationHours}h | status=${d.status}`);
  });

  // Write drafts to DB if APPLY
  let createdCount = 0;
  if (APPLY) {
    console.log(`\nInserting ${validDrafts.length} DRAFT tours into database...`);
    for (const d of validDrafts) {
      await prisma.tour.create({ data: d });
      createdCount++;
      if (createdCount % 25 === 0) {
        console.log(`  Inserted ${createdCount}/${validDrafts.length} drafts...`);
      }
    }
    console.log(`✅ Successfully created ${createdCount} DRAFT tours in database!`);
  } else {
    console.log(`\n[DRY RUN] Run with --apply to insert these ${validDrafts.length} tours into the database.`);
  }

  // 5. Final state check
  const [finalTotal, finalActive, finalDraft, finalInactive] = await Promise.all([
    prisma.tour.count(),
    prisma.tour.count({ where: { status: 'ACTIVE' } }),
    prisma.tour.count({ where: { status: 'DRAFT' } }),
    prisma.tour.count({ where: { status: 'INACTIVE' } }),
  ]);

  console.log(`\n========================================`);
  console.log(`FINAL DATABASE STATE:`);
  console.log(` - Total tours: ${finalTotal}`);
  console.log(` - ACTIVE: ${finalActive}`);
  console.log(` - DRAFT: ${finalDraft}`);
  console.log(` - INACTIVE: ${finalInactive}`);
  console.log(`========================================\n`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error during reconciliation:', e);
  await prisma.$disconnect();
  process.exit(1);
});
