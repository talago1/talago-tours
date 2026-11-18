async function main() {
  const r = await fetch('https://marsawaves.com/en/tours/hurghada/snorkeling/hurghada-dolphin-house-full-day-boat-trip');
  const html = await r.text();
  const match = html.match(/<script id="ng-state" type="application\/json">([\s\S]*?)<\/script>/i);
  const state = JSON.parse(match[1]);
  for (const k of Object.keys(state)) {
    const data = state[k]?.b?.data;
    if (data && data.title && data.title !== 'Talk to our travel experts') {
      console.log('Valid tour key:', k, 'Title:', data.title, 'Price:', data.booking_options?.[0]?.price);
    }
  }
}
main();
