async function main() {
  const r = await fetch('https://marsawaves.com/main-VGUPP6HF.js');
  const code = await r.text();
  console.log('Main bundle length:', code.length);
  
  const urls = code.match(/https?:\/\/[^\s"'`<>]+/g) || [];
  const marsaUrls = urls.filter(u => u.includes('marsawaves'));
  console.log('Marsa URLs found:', [...new Set(marsaUrls)]);
  
  // Look for api endpoints
  const apiMatches = code.match(/["'](\/api\/[a-zA-Z0-9_\-\/]+)["']/g) || [];
  console.log('API routes:', [...new Set(apiMatches)].slice(0, 30));
}
main().catch(console.error);
