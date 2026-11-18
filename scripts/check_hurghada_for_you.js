async function main() {
  const categories = [
    'https://hurghadaforyou.com/categories/promenades-en-mer/',
    'https://hurghadaforyou.com/categories/voyages-historiques/',
    'https://hurghadaforyou.com/categories/voyages-safari/',
    'https://hurghadaforyou.com/categories/balade-cheval-chameau/',
    'https://hurghadaforyou.com/categories/dauphins/',
    'https://hurghadaforyou.com/categories/sports-nautiques/',
    'https://hurghadaforyou.com/categories/aqua-park/',
    'https://hurghadaforyou.com/categories/spa/',
    'https://hurghadaforyou.com/categories/visites-de-la-ville/'
  ];
  
  const allTourLinks = new Set();
  
  for (const catUrl of categories) {
    try {
      const res = await fetch(catUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) {
        console.log(`Failed ${catUrl}: ${res.status}`);
        continue;
      }
      const html = await res.text();
      // Match links to individual tour pages
      const links = html.match(/href=["'](https:\/\/hurghadaforyou\.com\/[a-z0-9\-_]+\/?)["']/gi) || [];
      const relativeLinks = html.match(/href=["'](\/[a-z0-9\-_]+\/?)["']/gi) || [];
      const combined = [...links, ...relativeLinks].map(l => l.replace(/^href=["']|["']$/g, ''));
      
      const tourLinks = combined.filter(l => 
        !l.includes('/categories/') && 
        !l.includes('/fr/') && 
        !l.includes('/en/') && 
        !l.includes('/assets/') && 
        l !== '/' &&
        l.length > 2
      );
      
      console.log(`${catUrl} -> found ${tourLinks.length} candidate tour links`);
      tourLinks.forEach(t => allTourLinks.add(t));
    } catch (e) {
      console.log(`Error ${catUrl}:`, e.message);
    }
  }
  
  console.log(`\nTotal unique tour URLs on Hurghada For You: ${allTourLinks.size}`);
  Array.from(allTourLinks).slice(0, 20).forEach(l => console.log('  ', l));
}

main().catch(console.error);
