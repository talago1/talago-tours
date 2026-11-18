const https = require('https');
const http = require('http');

const urls = [
  'https://marsawaves.com/',
  'https://egyptgate.net/',
  'https://egyptgatetours.com/',
  'https://albatrosfortours.com/',
  'https://hurghadaforyou.com/'
];

async function probe(url) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    clearTimeout(id);
    const text = await res.text();
    const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '(no title)';
    console.log(`[${res.status}] ${url} -> ${res.url} | len: ${text.length} | title: ${title.slice(0, 60)}`);
  } catch (err) {
    clearTimeout(id);
    console.log(`[ERR] ${url} -> ${err.name}: ${err.message}`);
  }
}

async function main() {
  for (const u of urls) {
    await probe(u);
  }
}

main();
