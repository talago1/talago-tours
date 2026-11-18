async function main() {
  console.log('--- CHECKING ALBATROS WP-JSON ENDPOINTS ---');
  const endpoints = [
    'https://albatrosfortours.com/wp-json/wp/v2/product?per_page=5',
    'https://albatrosfortours.com/wp-json/wc/v3/products',
    'https://albatrosfortours.com/wp-json/wc/store/v1/products',
    'https://albatrosfortours.com/wp-json/wp/v2/posts?per_page=5',
    'https://albatrosfortours.com/tours/'
  ];
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      console.log(ep, '-> status:', res.status, 'content-type:', res.headers.get('content-type'));
      if (res.ok) {
        const text = await res.text();
        console.log('  Length:', text.length, 'sample:', text.slice(0, 150));
      }
    } catch (e) {
      console.log(ep, '-> ERR:', e.message);
    }
  }
}
main();
