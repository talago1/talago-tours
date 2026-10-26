/**
 * scripts/generate_retirement_dry_run_report.cjs
 *
 * Generates an authoritative dry-run retirement report for the tour catalog.
 * Strict safety rules:
 *   - Read-only analysis. ZERO database mutations.
 *   - Establishes provenance for every tour.
 *   - Proposes retirement of untrusted Egypt Gate imports so they no longer appear on the public website.
 *   - Preserves historical records, bookings, reviews, and genuine owner-approved Talago tours.
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Generating Catalog Retirement Dry-Run Report ---');

  const tours = await prisma.tour.findMany({
    include: {
      bookings: { select: { id: true, bookingReference: true, status: true, totalPriceUSD: true } },
      reviewEntries: { select: { id: true, rating: true, status: true } },
      destination: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { slug: 'asc' },
  });

  console.log(`Audited ${tours.length} total tours in database.`);

  const report = {
    generatedAt: new Date().toISOString(),
    totalTours: tours.length,
    breakdown: {
      untrustedEgyptGateImports: 0,
      egyptGateActiveToRetire: 0,
      egyptGateDraftToArchive: 0,
      curatedTalagoToursWithBookings: 0,
      curatedTalagoToursWithoutBookings: 0,
      alreadyArchivedTours: 0,
    },
    proposedRetirements: [],
    preservedCuratedTours: [],
  };

  for (const tour of tours) {
    const isEgyptGate = tour.slug.startsWith('egypt-gate-');
    const hasBookings = tour.bookings.length > 0;
    const hasReviews = tour.reviewEntries.length > 0;
    const translations = tour.translations || {};
    const title = translations?.en?.title || tour.title || tour.slug;

    if (isEgyptGate) {
      report.breakdown.untrustedEgyptGateImports++;
      if (tour.status === 'ACTIVE') {
        report.breakdown.egyptGateActiveToRetire++;
      } else if (tour.status === 'DRAFT') {
        report.breakdown.egyptGateDraftToArchive++;
      }

      report.proposedRetirements.push({
        id: tour.id,
        slug: tour.slug,
        title,
        currentStatus: tour.status,
        proposedStatus: 'ARCHIVED',
        destination: tour.destination?.name || 'Unknown',
        bookingCount: tour.bookings.length,
        reviewCount: tour.reviewEntries.length,
        reason: 'Untrusted Egypt Gate legacy import; incomplete, unverified, unapproved for public catalog. Must not appear on public website.',
      });
    } else {
      if (tour.status === 'ARCHIVED') {
        report.breakdown.alreadyArchivedTours++;
      } else if (hasBookings) {
        report.breakdown.curatedTalagoToursWithBookings++;
      } else {
        report.breakdown.curatedTalagoToursWithoutBookings++;
      }

      report.preservedCuratedTours.push({
        id: tour.id,
        slug: tour.slug,
        title,
        status: tour.status,
        destination: tour.destination?.name || 'Unknown',
        bookingCount: tour.bookings.length,
        reviewCount: tour.reviewEntries.length,
        action: 'PRESERVE_UNMODIFIED',
        provenance: 'Curated Talago Tour (Preserved)',
      });
    }
  }

  // Save JSON report
  const jsonPath = path.join(__dirname, '..', 'docs', 'engineering', 'CATALOG_RETIREMENT_DRY_RUN_REPORT.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  // Save Markdown report
  const mdPath = path.join(__dirname, '..', 'docs', 'engineering', 'CATALOG_RETIREMENT_DRY_RUN_REPORT.md');
  const mdContent = `# TALAGO TOURS — Catalog Retirement Dry-Run Report

Generated: ${report.generatedAt}

## 1. Executive Summary

- **Total Catalog Tours**: ${report.totalTours}
- **Untrusted Egypt Gate Imports Proposed for Retirement**: ${report.breakdown.untrustedEgyptGateImports}
  - **Currently ACTIVE (Will be removed from public storefront)**: ${report.breakdown.egyptGateActiveToRetire}
  - **Currently DRAFT (Will be set to ARCHIVED)**: ${report.breakdown.egyptGateDraftToArchive}
- **Curated Talago Tours Preserved**: ${report.preservedCuratedTours.length}
  - **With Historical Bookings (Preserved)**: ${report.breakdown.curatedTalagoToursWithBookings}
  - **Without Bookings (Genuine Talago tours preserved)**: ${report.breakdown.curatedTalagoToursWithoutBookings}
  - **Already Archived**: ${report.breakdown.alreadyArchivedTours}

> [!IMPORTANT]
> **Zero Database Deletions**: All ${report.breakdown.untrustedEgyptGateImports} proposed retirements use soft-archival (\`status = 'ARCHIVED'\`). No records, foreign keys, or media references will be deleted.

## 2. Proposed Egypt Gate Catalog Retirements (${report.proposedRetirements.length} tours)

| # | Tour Slug | Title | Destination | Current Status | Proposed Status | Bookings | Reason |
|---|---|---|---|---|---|---|---|
${report.proposedRetirements
  .map(
    (t, i) =>
      `| ${i + 1} | \`${t.slug}\` | ${t.title.replace(/\|/g, '-')} | ${t.destination} | **${t.currentStatus}** | \`${t.proposedStatus}\` | ${t.bookingCount} | ${t.reason} |`
  )
  .join('\n')}

## 3. Preserved Curated Talago Tours (${report.preservedCuratedTours.length} tours)

| # | Tour Slug | Title | Destination | Status | Bookings | Reviews | Action |
|---|---|---|---|---|---|---|---|
${report.preservedCuratedTours
  .map(
    (t, i) =>
      `| ${i + 1} | \`${t.slug}\` | ${t.title.replace(/\|/g, '-')} | ${t.destination} | **${t.status}** | ${t.bookingCount} | ${t.reviewCount} | ${t.action} |`
  )
  .join('\n')}
`;

  fs.writeFileSync(mdPath, mdContent);

  console.log(`\nDry-run report generated successfully!`);
  console.log(`- JSON: docs/engineering/CATALOG_RETIREMENT_DRY_RUN_REPORT.json`);
  console.log(`- Markdown: docs/engineering/CATALOG_RETIREMENT_DRY_RUN_REPORT.md`);
  console.log(`- Untrusted Egypt Gate tours proposed for retirement: ${report.proposedRetirements.length}`);
  console.log(`- Curated Talago tours preserved: ${report.preservedCuratedTours.length}\n`);
}

main()
  .catch((err) => {
    console.error('Report generation failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
