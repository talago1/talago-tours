const fs = require('fs');

async function testMarsaWavesApi() {
  console.log('\n--- MARSA WAVES API DISCOVERY ---');
  // Fetch main HTML and inspect chunk files for API URLs
  const res = await fetch('https://marsawaves.com/', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  const chunkMatches = html.match(/chunk-[A-Z0-9]+\.js/g) || [];
  console.log('Chunks:', chunkMatches);
  
  for (const chunk of chunkMatches.slice(0, 5)) {
    const chunkRes = await fetch(`https://marsawaves.com/${chunk}`);
    const code = await chunkRes.text();
    // Look for api URLs or endpoints like /api/, https://api., tours, excursions
    const apiMatches = code.match(/https?:\/\/[a-zA-Z0-9.-]+\/api\/[a-zA-Z0-9_\-\/]+/g) || [];
    const endpoints = code.match(/["'](\/(api|v1|tours|excursions)[a-zA-Z0-9_\-\/]*)["']/g) || [];
    if (apiMatches.length > 0 || endpoints.length > 0) {
      console.log(`In ${chunk}:`);
      if (apiMatches.length) console.log('  API URLs:', [...new Set(apiMatches)].slice(0, 10));
      if (endpoints.length) console.log('  Endpoints:', [...new Set(endpoints)].slice(0, 10));
    }
  }
}

async function testEgyptGateComparison() {
  console.log('\n--- EGYPT GATE COMPARISON ---');
  // Compare egyptgate.net vs egyptgatetours.com
  const [resNet, resCom] = await Promise.all([
    fetch('https://www.egyptgate.net/en', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
    fetch('https://egyptgatetours.com/', { headers: { 'User-Agent': 'Mozilla/5.0' } })
  ]);
  const textNet = await resNet.text();
  const textCom = await resCom.text();
  
  console.log('egyptgate.net:');
  console.log('  Title:', (textNet.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1]);
  console.log('  Phone/Contact:', textNet.match(/\+?20[0-9\s-]{8,15}/g) || textNet.match(/mailto:[^\s"'>]+/g));
  
  console.log('egyptgatetours.com:');
  console.log('  Title:', (textCom.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1]);
  console.log('  Phone/Contact:', textCom.match(/\+?20[0-9\s-]{8,15}/g) || textCom.match(/mailto:[^\s"'>]+/g));
}

async function testAlbatros() {
  console.log('\n--- ALBATROS DISCOVERY ---');
  // Check WP JSON
  const res = await fetch('https://albatrosfortours.com/wp-json/wp/v2/posts?per_page=5', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  console.log('albatros wp/v2/posts status:', res.status);
  
  const resTypes = await fetch('https://albatrosfortours.com/wp-json/wp/v2/types', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  if (resTypes.ok) {
    const types = await resTypes.json();
    console.log('Custom post types on Albatros:', Object.keys(types));
  }
  
  // Check sitemap
  const smRes = await fetch('https://albatrosfortours.com/sitemap_index.xml');
  console.log('albatros sitemap_index status:', smRes.status);
  if (smRes.ok) {
    const smText = await smRes.text();
    const locs = smText.match(/<loc>([^<]+)<\/loc>/g);
    console.log('Sitemaps:', locs);
  }
}

async function testHurghadaForYou() {
  console.log('\n--- HURGHADA FOR YOU DISCOVERY ---');
  const res = await fetch('https://hurghadaforyou.com/fr/nos-excursions', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  console.log('nos-excursions status:', res.status);
  const text = await res.text();
  const tourLinks = text.match(/href=["'](\/(?:fr|en)?\/(?:excursion|tours?|activites?)[^"']+)["']/gi) || [];
  console.log('Found tour links on nos-excursions:', tourLinks.slice(0, 10));
}

async function run() {
  await testMarsaWavesApi();
  await testEgyptGateComparison();
  await testAlbatros();
  await testHurghadaForYou();
}

run();
