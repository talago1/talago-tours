async function main() {
  const r = await fetch('https://marsawaves.com/en/tours/hurghada/snorkeling/hurghada-dolphin-house-full-day-boat-trip');
  const html = await r.text();
  console.log('HTML length:', html.length);
  const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1];
  console.log('Title:', title);
  
  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
  console.log('JSON-LD scripts found:', jsonLd.length);
  jsonLd.forEach(j => console.log('JSON-LD snippet:', j.slice(0, 300)));
  
  // Also check if there is an SSR payload or state
  const stateMatch = html.match(/<script id="[^"]*"[^>]*>([\s\S]*?)<\/script>/gi) || [];
  console.log('Other scripts with IDs:', stateMatch.map(s => s.slice(0, 100)));
}
main().catch(console.error);
