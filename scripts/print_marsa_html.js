async function main() {
  const r = await fetch('https://marsawaves.com/');
  const html = await r.text();
  console.log(html);
}
main();
