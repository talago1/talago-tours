const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// List of island names that should NEVER be merged into a different island
const DISTINCT_ISLANDS = ['orange', 'mahmya', 'eden', 'bianca', 'paradise', 'utopia', 'magawish', 'tiran', 'white'];

async function testClassA() {
  const raw = JSON.parse(fs.readFileSync('scripts/data/match_results.json', 'utf8'));
  const results = raw.results || raw;
  const aRecords = results.filter(r => r.classification === 'A');

  console.log(`Auditing ${aRecords.length} Class A matches:`);

  const genuineMatches = [];
  const reclassifyToC = [];

  for (const r of aRecords) {
    const srcName = r.sourceName.toLowerCase();
    const matchedSlug = r.matchedTourSlug;

    // Check island mismatch
    let islandConflict = false;
    if (matchedSlug.includes('hula-hula-paradise-island')) {
      // only paradise island or hula hula is genuine
      if (srcName.includes('orange') || srcName.includes('mahmya') || srcName.includes('eden') || srcName.includes('bianca') || srcName.includes('utopia') || srcName.includes('magawish') || srcName.includes('ozirea')) {
        islandConflict = true;
      }
    }
    if (matchedSlug.includes('tiran') && (srcName.includes('mahmya') || srcName.includes('bianca') || srcName.includes('eden') || srcName.includes('hula hula') || srcName.includes('catamaran') || srcName.includes('quseir'))) {
      islandConflict = true;
    }
    if (matchedSlug.includes('dolphin-house-white-island-speedboat') && (srcName.includes('private speed boat to dolphin house') || srcName.includes('catamaran'))) {
      islandConflict = true; // different boat experience
    }

    if (islandConflict) {
      reclassifyToC.push(r);
    } else {
      genuineMatches.push(r);
    }
  }

  console.log(`\nGenuine Class A matches (${genuineMatches.length}):`);
  genuineMatches.forEach(r => console.log(` - [${r.source}] "${r.sourceName}" -> ${r.matchedTourSlug}`));

  console.log(`\nItems that are distinct products and should be Class C (${reclassifyToC.length}):`);
  reclassifyToC.forEach(r => console.log(` - [${r.source}] "${r.sourceName}" (was wrongly matched to ${r.matchedTourSlug})`));

  await p.$disconnect();
}

testClassA().catch(console.error);
