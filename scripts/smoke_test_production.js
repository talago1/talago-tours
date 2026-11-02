const https = require('https');

const BASE_URL = 'https://talago-tours.vercel.app';

function checkEndpoint(path, options = {}) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const req = https.request(
      url,
      {
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          resolve({
            path,
            statusCode: res.statusCode,
            bodyLength: body.length,
            title: (body.match(/<title>(.*?)<\/title>/i) || [])[1] || null,
          });
        });
      }
    );
    req.on('error', (err) => {
      resolve({ path, error: err.message });
    });
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function smokeTest() {
  console.log(`=== RUNNING PRODUCTION SMOKE TEST ON ${BASE_URL} ===\n`);

  const endpoints = [
    '/',
    '/tours',
    '/destinations',
    '/auth',
    '/my-bookings',
    '/api/public/settings/contact',
    '/api/public/tours/search?q=cairo'
  ];

  for (const ep of endpoints) {
    const res = await checkEndpoint(ep);
    console.log(`[HTTP ${res.statusCode}] ${ep} (Length: ${res.bodyLength} bytes)${res.title ? ' — ' + res.title : ''}`);
  }

  // Lookup validation smoke test
  const lookupRes = await checkEndpoint('/api/public/my-bookings/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference: 'TLG-INVALID', phone: '+123456789' })
  });
  console.log(`[HTTP ${lookupRes.statusCode}] /api/public/my-bookings/lookup (Validation expected: 404/400)`);

  console.log('\n=== SMOKE TEST COMPLETE ===');
}

smokeTest();

