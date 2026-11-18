const fs = require('fs');

async function inspectHtml(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    const html = await res.text();
    
    // Find all links
    const linkRegex = /href=["']([^"']+)["']/gi;
    const links = new Set();
    let m;
    while ((m = linkRegex.exec(html)) !== null) {
      const href = m[1].trim();
      if (!href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('javascript:')) {
        links.add(href);
      }
    }
    
    console.log(`\n=== ${url} (Total links found: ${links.size}) ===`);
    const linkArr = Array.from(links);
    console.log('Sample links (first 25):');
    linkArr.slice(0, 25).forEach(l => console.log('  ', l));
    
    // Also check for any script tags referencing json/api or wordpress/next/nuxt
    const generator = html.match(/<meta[^>]*name=["']generator["'][^>]*content=["']([^"']+)["']/i);
    if (generator) console.log('Generator:', generator[1]);
    
    // Check if it's wordpress
    const isWp = html.includes('wp-content') || html.includes('wp-json');
    console.log('WordPress detected:', isWp);
    
    return { url, links: linkArr, isWp };
  } catch (err) {
    console.error(`Error inspecting ${url}:`, err.message);
  }
}

async function main() {
  await inspectHtml('https://marsawaves.com/');
  await inspectHtml('https://www.egyptgate.net/');
  await inspectHtml('https://egyptgatetours.com/');
  await inspectHtml('https://albatrosfortours.com/');
  await inspectHtml('https://hurghadaforyou.com/');
}

main();
