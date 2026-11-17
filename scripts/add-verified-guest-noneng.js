// Add verifiedGuest key to all non-English locale testimonials sections
const fs = require('fs');

const additions = {
  'src/locales/de.ts':  "    verified: 'Verifizierte Buchung'\r\n  },",
  'src/locales/es.ts':  null, // will detect
  'src/locales/fr.ts':  null,
  'src/locales/it.ts':  null,
  'src/locales/pl.ts':  null,
  'src/locales/ru.ts':  null,
  'src/locales/uk.ts':  null,
};

// Generic approach: find "verified: '...'" inside testimonials section and add verifiedGuest after it
const files = [
  'src/locales/de.ts','src/locales/es.ts','src/locales/fr.ts',
  'src/locales/it.ts','src/locales/pl.ts','src/locales/ru.ts','src/locales/uk.ts'
];

// Translations for each locale
const verifiedGuestTranslations = {
  'de.ts': 'Verifizierter Gast',
  'es.ts': 'Huésped Verificado',
  'fr.ts': 'Client Vérifié',
  'it.ts': 'Ospite Verificato',
  'pl.ts': 'Zweryfikowany Gość',
  'ru.ts': 'Подтверждённый Гость',
  'uk.ts': 'Підтверджений Гість',
};

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const basename = f.split('/').pop();
  const translation = verifiedGuestTranslations[basename];
  
  // Find the testimonials block and the closing of it
  // Pattern: "verified: 'SOMETHING'\r\n  },"  — the TS type is strict so we need to add verifiedGuest
  const lines = content.split('\r\n');
  let found = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("verified:") && i > 0) {
      // Check this is in the testimonials section by looking back
      let inTestimonials = false;
      for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
        if (lines[j].includes('testimonials:')) { inTestimonials = true; break; }
      }
      if (inTestimonials && !lines[i].includes('verifiedGuest')) {
        // Check next line is closing brace
        if (lines[i + 1] && lines[i + 1].trim() === '},') {
          lines[i] = lines[i] + ',';
          lines.splice(i + 1, 0, `    verifiedGuest: '${translation}'`);
          found = true;
          break;
        }
      }
    }
  }
  
  if (found) {
    fs.writeFileSync(f, lines.join('\r\n'));
    console.log(`✅ Added verifiedGuest to ${f}`);
  } else {
    console.log(`⚠️  Could not add verifiedGuest to ${f}`);
  }
});
