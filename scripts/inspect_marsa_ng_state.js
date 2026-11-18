async function main() {
  const r = await fetch('https://marsawaves.com/en/tours/hurghada/snorkeling/hurghada-dolphin-house-full-day-boat-trip');
  const html = await r.text();
  const match = html.match(/<script id="ng-state" type="application\/json">([\s\S]*?)<\/script>/i);
  if (!match) {
    console.log('No ng-state found');
    return;
  }
  const state = JSON.parse(match[1]);
  console.log('Keys in ng-state:', Object.keys(state));
  for (const k of Object.keys(state)) {
    const val = state[k];
    console.log(`Key: ${k}, has 'b':`, !!val.b);
    if (val.b && val.b.data) {
      console.log('val.b.data keys:', Object.keys(val.b.data));
      console.log('Sample data:');
      console.log('  title/name:', val.b.data.title || val.b.data.name);
      console.log('  price:', val.b.data.price || val.b.data.final_price || val.b.data.from_price);
      console.log('  duration:', val.b.data.duration);
      console.log('  included:', val.b.data.included?.length);
      console.log('  excluded:', val.b.data.excluded?.length);
      console.log('  itinerary:', val.b.data.itinerary?.length || typeof val.b.data.itinerary);
      console.log('  city/destination:', val.b.data.city || val.b.data.destination);
    }
  }
}
main().catch(console.error);
