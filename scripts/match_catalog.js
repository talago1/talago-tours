/**
 * TALAGO Catalog Matcher — Phase 2
 * 
 * Loads existing TALAGO tours from DB + source JSON files from scripts/data/sources/
 * For each source tour, scores similarity against existing TALAGO tours.
 * 
 * Classification:
 *   A — Strong match (≥80%): same destination + same core activity + similar duration
 *   B — Likely match (60–79%): same destination + activity overlap, needs review
 *   C — New unique tour: not found in existing catalog
 *   D — Destination gap: destination not currently in TALAGO
 *   E — Duplicate (already imported from this source)
 *   F — Excluded: insufficient data, test-only, or admin-flagged
 * 
 * Usage: node scripts/match_catalog.js [--source marsawaves|egyptgate|albatros|hurghadaforyou|all]
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// ── Normalize helpers ──────────────────────────────────────────────────────

function normalizeText(str = '') {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOPWORDS = new Set([
  'from', 'to', 'in', 'at', 'by', 'for', 'with', 'the', 'a', 'an',
  'and', 'or', 'of', 'on', 'up', 'day', 'trip', 'tour', 'excursion',
  'full', 'half', 'private', 'shared', 'group', 'experience', 'hurghada',
  'sharm', 'sheikh', 'marsa', 'alam', 'cairo', 'luxor', 'aswan', 'gouna',
  'el', 'red', 'sea', 'egypt', 'egyptian',
]);

function extractKeywords(str = '') {
  return normalizeText(str)
    .split(' ')
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

function jaccardSimilarity(setA, setB) {
  if (setA.length === 0 && setB.length === 0) return 0;
  const a = new Set(setA);
  const b = new Set(setB);
  const intersection = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  return intersection.size / union.size;
}

const ACTIVITY_ALIASES = {
  snorkeling: ['snorkeling', 'snorkel', 'snorkelling'],
  diving: ['diving', 'dive', 'scuba', 'diver'],
  safari: ['safari', 'quad', 'atv', 'jeep', 'bedouin', 'desert'],
  boat: ['boat', 'cruise', 'sailing', 'catamaran', 'speedboat', 'felucca', 'glass'],
  cultural: ['pyramid', 'museum', 'luxor', 'karnak', 'temple', 'pharaoh', 'ancient'],
  dolphin: ['dolphin', 'dolphins'],
  submarine: ['submarine', 'batiskaf', 'semi-submarine'],
  island: ['island', 'giftun', 'orange', 'paradise', 'hula'],
  reef: ['reef', 'coral'],
};

function extractActivities(str = '') {
  const norm = normalizeText(str);
  const found = new Set();
  for (const [activity, aliases] of Object.entries(ACTIVITY_ALIASES)) {
    if (aliases.some(alias => norm.includes(alias))) {
      found.add(activity);
    }
  }
  return [...found];
}

function normalizeDurationHours(durationStr = '') {
  const str = durationStr.toLowerCase();
  // "full day" ≈ 8-10h
  if (str.includes('full day') || str.includes('full-day')) return 9;
  if (str.includes('half day') || str.includes('half-day')) return 4;
  // "X hours" or "X-Y hours"
  const hoursMatch = str.match(/(\d+)(?:\s*[-–]\s*(\d+))?\s*h/);
  if (hoursMatch) {
    const low = parseInt(hoursMatch[1]);
    const high = hoursMatch[2] ? parseInt(hoursMatch[2]) : low;
    return (low + high) / 2;
  }
  return null;
}

// ── Scoring ────────────────────────────────────────────────────────────────

function scoreTourMatch(sourceTour, talagoTour) {
  let score = 0;
  const reasons = [];

  // 1. Same destination (required for A/B)
  const sourceDestNorm = normalizeText(sourceTour.destination || '');
  const talagoDestNorm = normalizeText(talagoTour._destSlug || '');
  const destMatch = talagoDestNorm.includes(sourceDestNorm.split(' ')[0]) ||
    sourceDestNorm.includes(talagoDestNorm.split('-')[0]);
  
  if (destMatch) {
    score += 30;
    reasons.push('destination match');
  } else {
    // Different destination — can still be variant (e.g., Cairo day trip from Hurghada vs from Marsa Alam)
  }

  // 2. Activity overlap
  const sourceActivities = extractActivities((sourceTour.sourceName || '') + ' ' + (sourceTour.category || '') + ' ' + (sourceTour.rawNotes || ''));
  const talagoActivities = extractActivities((talagoTour._title || '') + ' ' + (talagoTour.category || ''));
  const activityOverlap = sourceActivities.filter(a => talagoActivities.includes(a));
  if (activityOverlap.length > 0) {
    score += Math.min(30, activityOverlap.length * 15);
    reasons.push(`activity overlap: ${activityOverlap.join(', ')}`);
  }

  // 3. Name keyword similarity
  const sourceKw = extractKeywords(sourceTour.sourceName || '');
  const talagoKw = extractKeywords(talagoTour._title || '');
  const nameSimilarity = jaccardSimilarity(sourceKw, talagoKw);
  if (nameSimilarity > 0) {
    score += Math.round(nameSimilarity * 25);
    reasons.push(`name similarity: ${(nameSimilarity * 100).toFixed(0)}%`);
  }

  // 4. Duration proximity
  const sourceDur = normalizeDurationHours(sourceTour.duration || '');
  const talagoDur = talagoTour.durationHours;
  if (sourceDur != null && talagoDur != null) {
    const diff = Math.abs(sourceDur - talagoDur);
    if (diff <= 1) {
      score += 15;
      reasons.push('duration match');
    } else if (diff <= 3) {
      score += 7;
      reasons.push('duration close');
    }
  }

  return { score: Math.min(100, score), reasons };
}

function classify(score, destMatch) {
  if (!destMatch) {
    if (score >= 50) return 'B'; // possible variant (e.g. same tour from different base)
    return 'D'; // different destination — could be new destination gap
  }
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  return 'C';
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const sourceArg = args.find(a => a.startsWith('--source='))?.split('=')[1] || 'all';

  // Load existing TALAGO tours
  const talagoTours = await prisma.tour.findMany({
    where: { status: { not: 'INACTIVE' } },
    select: {
      id: true, slug: true, status: true,
      translations: true, category: true,
      durationHours: true, basePriceUSD: true, adultPrice: true,
      destination: { select: { slug: true, name: true } },
      _count: { select: { bookings: true } },
    }
  });

  // Enrich TALAGO tours with normalized fields
  const enrichedTalago = talagoTours.map(t => {
    const trans = t.translations;
    const title = trans?.en?.title || t.slug;
    return {
      ...t,
      _title: title,
      _destSlug: t.destination?.slug || '',
    };
  });

  console.log(`Loaded ${enrichedTalago.length} active/published TALAGO tours`);

  // Find source files
  const sourcesDir = path.join(__dirname, 'data', 'sources');
  const sourceFiles = fs.existsSync(sourcesDir)
    ? fs.readdirSync(sourcesDir).filter(f => f.endsWith('.json'))
    : [];

  if (sourceFiles.length === 0) {
    console.log('No source files found in scripts/data/sources/');
    console.log('Expected files like: source_marsawaves.json, source_egyptgate.json, etc.');
    await prisma.$disconnect();
    return;
  }

  const allResults = [];
  let totalSourceTours = 0;

  for (const file of sourceFiles) {
    const sourceName = file.replace('source_', '').replace('.json', '');
    if (sourceArg !== 'all' && sourceName !== sourceArg) continue;

    const data = JSON.parse(fs.readFileSync(path.join(sourcesDir, file), 'utf8'));
    const tours = data.tours || [];
    totalSourceTours += tours.length;

    console.log(`\n=== Processing ${sourceName} (${tours.length} tours) ===`);

    for (const sourceTour of tours) {
      let bestMatch = null;
      let bestScore = 0;

      for (const talagoTour of enrichedTalago) {
        const { score, reasons } = scoreTourMatch(sourceTour, talagoTour);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { tour: talagoTour, score, reasons };
        }
      }

      const sourceDestNorm = normalizeText(sourceTour.destination || '');
      const destMatch = bestMatch
        ? (normalizeText(bestMatch.tour._destSlug).includes(sourceDestNorm.split(' ')[0]) ||
          sourceDestNorm.includes(normalizeText(bestMatch.tour._destSlug).split('-')[0]))
        : false;

      const classification = bestMatch
        ? classify(bestScore, destMatch)
        : (sourceTour.destination ? 'D' : 'F');

      allResults.push({
        source: sourceName,
        sourceUrl: sourceTour.sourceUrl,
        sourceName: sourceTour.sourceName,
        destination: sourceTour.destination,
        category: sourceTour.category,
        duration: sourceTour.duration,
        priceFrom: sourceTour.priceFrom,
        currency: sourceTour.currency,
        classification,
        confidence: bestScore,
        matchedTourSlug: bestMatch?.tour.slug || null,
        matchedTourTitle: bestMatch?.tour._title || null,
        matchReasons: bestMatch?.reasons || [],
        suggestedAction: getSuggestedAction(classification, bestScore),
      });

      const symbol = { A: '✅', B: '🔶', C: '🆕', D: '📍', E: '♻️', F: '⚠️' }[classification];
      console.log(
        `  ${symbol} [${classification}:${bestScore}%] "${sourceTour.sourceName}" → ` +
        (bestMatch ? `"${bestMatch.tour._title}" (${bestMatch.tour.destination?.name})` : 'NO MATCH')
      );
    }
  }

  // Save results
  const outputPath = path.join(__dirname, 'data', 'match_results.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalSourceTours,
    totalTalagoTours: enrichedTalago.length,
    summary: {
      A: allResults.filter(r => r.classification === 'A').length,
      B: allResults.filter(r => r.classification === 'B').length,
      C: allResults.filter(r => r.classification === 'C').length,
      D: allResults.filter(r => r.classification === 'D').length,
      E: allResults.filter(r => r.classification === 'E').length,
      F: allResults.filter(r => r.classification === 'F').length,
    },
    results: allResults,
  }, null, 2));

  console.log(`\n=== MATCH RESULTS ===`);
  console.log(`Total source tours: ${totalSourceTours}`);
  console.log(`A (strong match): ${allResults.filter(r => r.classification === 'A').length}`);
  console.log(`B (likely match): ${allResults.filter(r => r.classification === 'B').length}`);
  console.log(`C (new tour):     ${allResults.filter(r => r.classification === 'C').length}`);
  console.log(`D (dest gap):     ${allResults.filter(r => r.classification === 'D').length}`);
  console.log(`F (excluded):     ${allResults.filter(r => r.classification === 'F').length}`);
  console.log(`\nResults saved to ${outputPath}`);

  await prisma.$disconnect();
}

function getSuggestedAction(classification, score) {
  if (classification === 'A') return 'update-existing';
  if (classification === 'B') return 'review-and-merge';
  if (classification === 'C') return 'create-new';
  if (classification === 'D') return 'create-new-destination';
  if (classification === 'E') return 'skip-duplicate';
  return 'skip';
}

main().catch(e => { console.error(e.message); process.exit(1); });
