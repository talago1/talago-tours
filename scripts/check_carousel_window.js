/**
 * Sanity check for the CarouselImages `mounted` window logic.
 * Kept as a plain script because the repo has no test runner configured.
 */
function mountedWindow(index, total) {
  if (total <= 1) return new Set([0]);
  return new Set([
    index,
    (index - 1 + total) % total,
    (index + 1) % total,
  ]);
}

const cases = [
  { images: 1, expect: 1 },
  { images: 2, expect: 2 },
  { images: 3, expect: 3 },
  { images: 4, expect: 3 },
  { images: 45, expect: 3 },
];

let failed = 0;
for (const c of cases) {
  let maxMounted = 0;
  for (let i = 0; i < c.images; i++) {
    const m = mountedWindow(i, c.images);
    if (!m.has(i)) { console.log(`FAIL: index ${i} not mounted`); failed++; }
    for (const v of m) {
      if (v < 0 || v >= c.images) { console.log(`FAIL: out-of-range ${v} of ${c.images}`); failed++; }
    }
    if (new Set(m).size !== m.size) { console.log(`FAIL: duplicates in ${[...m]}`); failed++; }
    maxMounted = Math.max(maxMounted, m.size);
  }
  const ok = maxMounted === c.expect ? 'ok  ' : 'FAIL';
  if (maxMounted !== c.expect) failed++;
  console.log(`${ok} ${c.images} images -> max ${maxMounted} mounted (expected ${c.expect})`);
}
console.log(failed === 0 ? '\nall carousel cases passed' : `\n${failed} failure(s)`);
process.exitCode = failed === 0 ? 0 : 1;
