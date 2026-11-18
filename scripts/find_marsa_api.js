async function main() {
  const res = await fetch('https://marsawaves.com/');
  const html = await res.text();
  const chunks = html.match(/chunk-[A-Z0-9]+\.js/g) || [];
  console.log('Found chunks:', chunks.length);
  
  for (const c of chunks) {
    const r = await fetch('https://marsawaves.com/' + c);
    const txt = await r.text();
    // Search for keywords
    const matches = txt.match(/https?:\/\/[a-zA-Z0-9.-]+(?::[0-9]+)?(?:\/[a-zA-Z0-9_.\-\/]*)?/g) || [];
    const valid = matches.filter(m => !m.includes('w3.org') && !m.includes('schema.org') && !m.includes('google') && !m.includes('gstatic'));
    if (valid.length > 0) {
      console.log(`Chunk ${c}:`, [...new Set(valid)]);
    }
  }
}
main().catch(console.error);
