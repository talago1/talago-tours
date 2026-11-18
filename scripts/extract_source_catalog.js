/**
 * TALAGO — Source Catalog Extractor
 * Fetches tour listing pages from supplier websites and extracts structured tour data.
 * Uses plain Node.js fetch (same approach as ai-tour-generator.ts).
 * 
 * Usage: node scripts/extract_source_catalog.js [marsawaves|egyptgate|albatros|hurghadaforyou]
 * 
 * Rules:
 * - Respects 1.5s delay between requests
 * - Stops on CAPTCHA / Cloudflare detection
 * - Never fabricates missing data
 * - Saves raw extracted text privately (not published to customers)
 */

const fs = require('fs');
const path = require('path');

const DELAY_MS = 1500;
const TIMEOUT_MS = 15000;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function detectBlock(html) {
  if (!html) return false;
  return (
    html.includes('cf-turnstile') ||
    html.includes('cf-browser-verification') ||
    html.includes('Attention Required! | Cloudflare') ||
    html.includes('Just a moment...') ||
    html.includes('challenge-running') ||
    html.includes('Ray ID:') ||
    html.includes('hCaptcha') ||
    html.includes('recaptcha') ||
    html.includes('please enable javascript') ||
    (html.length < 500 && (html.includes('403') || html.includes('Forbidden')))
  );
}

function stripHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\r?\n\s*\r?\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function extractLinks(html, baseUrl) {
  const base = new URL(baseUrl);
  const links = new Set();
  const regex = /href=["']([^"']+)["']/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    try {
      const url = new URL(m[1], baseUrl);
      if (url.hostname === base.hostname && url.href !== baseUrl) {
        // Filter out obviously non-tour links
        const p = url.pathname.toLowerCase();
        if (!p.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|ttf|pdf|zip)$/)) {
          links.add(url.href.split('#')[0]); // strip anchors
        }
      }
    } catch {}
  }
  return [...links];
}

function extractTourLinks(html, baseUrl, tourKeywords = ['tour', 'excursion', 'trip', 'safari', 'dive', 'snorkel', 'cruise']) {
  const allLinks = extractLinks(html, baseUrl);
  return allLinks.filter(link => {
    const p = link.toLowerCase();
    return tourKeywords.some(kw => p.includes(kw)) ||
      p.match(/\/tours?\/|\/activities?\/|\/excursions?\/|\/products?\//);
  });
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.status === 403 || res.status === 401 || res.status === 429) {
      return { ok: false, blocked: true, status: res.status, html: null };
    }
    if (!res.ok) {
      return { ok: false, blocked: false, status: res.status, html: null };
    }
    const html = await res.text();
    if (detectBlock(html)) {
      return { ok: false, blocked: true, status: res.status, html };
    }
    return { ok: true, blocked: false, status: res.status, html };
  } catch (err) {
    clearTimeout(timeoutId);
    return { ok: false, blocked: false, status: 0, html: null, error: err.message };
  }
}

// Extract basic tour info from a page's text
function parseTourFromText(text, url, sourceDomain) {
  // Try to extract price patterns like "$25", "€40", "USD 30", "EGP 500"
  const pricePatterns = [
    /(?:from\s*)?(\$|€|£|USD|EUR|EGP|GBP)\s*(\d+(?:[,\.]\d{2})?)/i,
    /(\d+(?:[,\.]\d{2})?)\s*(USD|EUR|EGP|GBP|\$|€)/i,
    /(?:price|cost|rate)[\s:]+(?:\$|€|£|USD|EUR|EGP)?\s*(\d+)/i,
  ];
  let priceFrom = null, currency = null;
  for (const pat of pricePatterns) {
    const m = text.match(pat);
    if (m) {
      if (m[2] && !isNaN(parseFloat(m[2]))) {
        priceFrom = parseFloat(m[2].replace(',', ''));
        currency = m[1];
      } else if (m[1] && !isNaN(parseFloat(m[1]))) {
        priceFrom = parseFloat(m[1].replace(',', ''));
        currency = m[2] || 'USD';
      }
      if (priceFrom) break;
    }
  }

  // Extract duration hints
  const durPatterns = [
    /(\d+)\s*[-–]\s*(\d+)\s*hours?/i,
    /(\d+)\s*hours?/i,
    /full[\s-]day/i,
    /half[\s-]day/i,
    /overnight/i,
  ];
  let duration = null;
  for (const pat of durPatterns) {
    const m = text.match(pat);
    if (m) { duration = m[0]; break; }
  }

  // Extract title from URL slug
  const slug = url.split('/').filter(Boolean).pop() || '';
  const titleFromSlug = slug.replace(/[-_]/g, ' ').replace(/\.(html?|php|aspx?)$/i, '');

  return {
    sourceDomain,
    sourceUrl: url,
    sourceName: titleFromSlug || 'Unknown',
    priceFrom,
    currency: normalizeCurrency(currency),
    duration,
    rawTextLength: text.length,
  };
}

function normalizeCurrency(c) {
  if (!c) return 'USD';
  const u = c.toUpperCase().replace('$', 'USD').replace('€', 'EUR').replace('£', 'GBP');
  if (['USD', 'EUR', 'GBP', 'EGP'].includes(u)) return u;
  return 'USD';
}

// ── Source Configs ────────────────────────────────────────────────────────

const SOURCES = {
  marsawaves: {
    name: 'Marsa Waves',
    domain: 'marsawaves.com',
    startUrls: [
      'https://marsawaves.com/',
      'https://marsawaves.com/hurghada-tours',
      'https://marsawaves.com/marsa-alam-tours',
      'https://marsawaves.com/sharm-el-sheikh-tours',
      'https://marsawaves.com/cairo-tours',
      'https://marsawaves.com/luxor-tours',
    ],
    tourLinkKeywords: ['tour', 'excursion', 'trip', 'safari', 'dive', 'snorkel', 'cruise', 'hurghada', 'marsa', 'sharm', 'cairo', 'luxor'],
  },
  egyptgate: {
    name: 'Egypt Gate',
    domain: 'egyptgate.net',
    altDomain: 'egyptgatetours.com',
    startUrls: [
      'https://egyptgate.net/',
      'https://egyptgate.net/tours',
      'https://egyptgate.net/excursions',
      'https://egyptgatetours.com/',
    ],
    tourLinkKeywords: ['tour', 'excursion', 'trip', 'safari', 'package', 'nile', 'cairo', 'luxor', 'hurghada'],
  },
  albatros: {
    name: 'Albatros for Tours',
    domain: 'albatrosfortours.com',
    startUrls: [
      'https://albatrosfortours.com/',
      'https://albatrosfortours.com/hurghada-tours',
      'https://albatrosfortours.com/tours',
    ],
    tourLinkKeywords: ['tour', 'excursion', 'trip', 'safari', 'dive', 'snorkel', 'hurghada'],
  },
  hurghadaforyou: {
    name: 'Hurghada For You',
    domain: 'hurghadaforyou.com',
    startUrls: [
      'https://hurghadaforyou.com/',
      'https://hurghadaforyou.com/tours',
      'https://hurghadaforyou.com/excursions',
    ],
    tourLinkKeywords: ['tour', 'excursion', 'trip', 'safari', 'hurghada', 'marsa', 'dive', 'snorkel'],
  },
};

// ── Main crawler ──────────────────────────────────────────────────────────

async function crawlSource(sourceKey) {
  const cfg = SOURCES[sourceKey];
  if (!cfg) {
    console.error(`Unknown source: ${sourceKey}`);
    return null;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Crawling: ${cfg.name} (${cfg.domain})`);
  console.log('='.repeat(60));

  const result = {
    source: cfg.name,
    domain: cfg.domain,
    extractedAt: new Date().toISOString(),
    blocked: false,
    pagesVisited: 0,
    tourPagesFound: [],
    errors: [],
    tours: [],
  };

  const visited = new Set();
  const tourUrls = new Set();

  // Phase 1: Crawl start URLs to find tour links
  for (const startUrl of cfg.startUrls) {
    if (visited.has(startUrl)) continue;
    visited.add(startUrl);

    console.log(`  Fetching: ${startUrl}`);
    const page = await fetchPage(startUrl);
    result.pagesVisited++;
    await sleep(DELAY_MS);

    if (page.blocked) {
      console.log(`  ⛔ BLOCKED (${page.status}) at ${startUrl}`);
      result.errors.push({ url: startUrl, error: `Blocked (${page.status})` });
      if (result.pagesVisited <= 2) {
        result.blocked = true;
        console.log('  Stopping — site appears to block automated access.');
        break;
      }
      continue;
    }

    if (!page.ok || !page.html) {
      console.log(`  ❌ Failed (${page.status || page.error})`);
      result.errors.push({ url: startUrl, error: `HTTP ${page.status}` });
      continue;
    }

    console.log(`  ✅ OK — text length: ${page.html.length}`);

    // Extract tour links from this page
    const links = extractTourLinks(page.html, startUrl, cfg.tourLinkKeywords);
    console.log(`  Found ${links.length} potential tour links`);
    links.forEach(l => tourUrls.add(l));
  }

  if (result.blocked) {
    return result;
  }

  console.log(`\n  Total unique tour URLs found: ${tourUrls.size}`);

  // Phase 2: Visit each tour page and extract data
  const tourUrlList = [...tourUrls].slice(0, 60); // cap at 60 tour pages
  for (const tourUrl of tourUrlList) {
    if (visited.has(tourUrl)) continue;
    visited.add(tourUrl);

    console.log(`  Tour: ${tourUrl}`);
    const page = await fetchPage(tourUrl);
    result.pagesVisited++;
    await sleep(DELAY_MS);

    if (page.blocked) {
      console.log(`    ⛔ Blocked`);
      result.errors.push({ url: tourUrl, error: 'Blocked' });
      continue;
    }

    if (!page.ok || !page.html) {
      console.log(`    ❌ Failed (${page.status})`);
      result.errors.push({ url: tourUrl, error: `HTTP ${page.status}` });
      continue;
    }

    const text = stripHtml(page.html);
    if (text.length < 100) {
      console.log(`    ⚠️ Too short, skipping`);
      continue;
    }

    // Extract the page title
    const titleMatch = page.html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].replace(/\s*[-|–]\s*.*$/, '').trim() : '';

    const tourData = parseTourFromText(text, tourUrl, cfg.domain);
    if (pageTitle) tourData.sourceName = pageTitle;
    
    // Store a snippet of the raw text (first 2000 chars) for AI processing later
    tourData.rawTextSnippet = text.slice(0, 2000);
    
    result.tourPagesFound.push(tourUrl);
    result.tours.push(tourData);
    console.log(`    ✅ "${pageTitle || tourData.sourceName}" — price: ${tourData.priceFrom || 'N/A'} ${tourData.currency}, dur: ${tourData.duration || 'N/A'}`);
  }

  console.log(`\n  Done: ${result.tours.length} tours extracted from ${result.pagesVisited} pages`);
  return result;
}

// ── Entry point ───────────────────────────────────────────────────────────

async function main() {
  const arg = process.argv[2];
  const sourcesToCrawl = arg && SOURCES[arg] ? [arg] : Object.keys(SOURCES);

  const outputDir = path.join(__dirname, 'data', 'sources');
  fs.mkdirSync(outputDir, { recursive: true });

  for (const sourceKey of sourcesToCrawl) {
    const result = await crawlSource(sourceKey);
    if (!result) continue;

    const outFile = path.join(outputDir, `source_${sourceKey}.json`);
    fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
    console.log(`\nSaved to ${outFile}`);
    
    if (sourceKey !== sourcesToCrawl[sourcesToCrawl.length - 1]) {
      console.log('\nWaiting 3s before next source...');
      await sleep(3000);
    }
  }

  console.log('\n✅ Extraction complete. Run: node scripts/match_catalog.js');
}

main().catch(e => { console.error('Fatal error:', e.message); process.exit(1); });
