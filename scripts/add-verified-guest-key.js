const fs = require('fs');
const files = [
  'src/locales/en.ts','src/locales/de.ts','src/locales/es.ts','src/locales/fr.ts',
  'src/locales/it.ts','src/locales/pl.ts','src/locales/ru.ts','src/locales/uk.ts'
];
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  const old = "    verified: 'Verified Booking'\r\n  },";
  const nw  = "    verified: 'Verified Booking',\r\n    verifiedGuest: 'Verified Guest'\r\n  },";
  if (c.includes(old)) {
    c = c.split(old).join(nw);
    fs.writeFileSync(f, c);
    console.log('✅ Updated testimonials.verifiedGuest in', f);
  } else {
    console.log('⚠️  Pattern not found in', f);
  }
});
