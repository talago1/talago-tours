async function main() {
  const r = await fetch('https://marsawaves.com/en/tours/hurghada/snorkeling/hurghada-dolphin-house-full-day-boat-trip');
  const html = await r.text();
  const match = html.match(/<script id="ng-state" type="application\/json">([\s\S]*?)<\/script>/i);
  const state = JSON.parse(match[1]);
  const tour = state['1832892802'].b.data;
  console.log('booking_options:', JSON.stringify(tour.booking_options, null, 2));
  console.log('available_options:', JSON.stringify(tour.available_options, null, 2));
  console.log('from_price / price fields:');
  for (const k of Object.keys(tour)) {
    if (k.includes('price') || k.includes('cost') || k.includes('rate') || k.includes('adult')) {
      console.log(`  ${k}:`, tour[k]);
    }
  }
}
main();
