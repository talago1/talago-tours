async function main() {
  const smRes = await fetch('https://hurghadaforyou.com/sitemap.xml');
  console.log('sitemap status:', smRes.status);
  if (smRes.ok) {
    const smText = await smRes.text();
    const locs = smText.match(/<loc>([^<]+)<\/loc>/g) || [];
    console.log('Total URLs in Hurghada For You sitemap:', locs.length);
    locs.forEach(l => console.log('  ', l.replace(/<\/?loc>/g, '')));
  } else {
    // Check catalogue
    const catRes = await fetch('https://hurghadaforyou.com/catalogue/');
    console.log('catalogue status:', catRes.status);
  }
}
main().catch(console.error);
