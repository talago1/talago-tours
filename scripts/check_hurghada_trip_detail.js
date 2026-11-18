async function main() {
  const res = await fetch('https://hurghadaforyou.com/en/trips/super-safari');
  const html = await res.text();
  console.log('HTML len:', html.length);
  const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1];
  console.log('Title:', title);
  
  // Extract JSON-LD or schema
  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
  console.log('JSON-LD count:', jsonLd.length);
  if (jsonLd.length) console.log('JSON-LD:', jsonLd[0].slice(0, 400));
  
  // Look for price
  const priceMatches = html.match(/(\d+[\.,]?\d*)\s*(?:€|\$|EUR|USD|£|EGP)/gi) || [];
  console.log('Prices found:', [...new Set(priceMatches)]);
}
main().catch(console.error);
