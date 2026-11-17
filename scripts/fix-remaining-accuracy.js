// Fix remaining content accuracy issues
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function readFile(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function writeFile(relPath, content) {
  fs.writeFileSync(path.join(root, relPath), content, 'utf8');
  console.log(`✅ Updated: ${relPath}`);
}

function replace(content, from, to, label) {
  if (!content.includes(from)) {
    console.warn(`  ⚠️  Pattern not found: ${label}`);
    return content;
  }
  console.log(`  → ${label}`);
  return content.split(from).join(to);
}

// ─── 1. CancellationContent.tsx — fix hardcoded "24 hours" JSX ───────────────
{
  const file = 'src/app/(public)/cancellation/CancellationContent.tsx';
  let c = readFile(file);

  c = replace(
    c,
    'You may cancel your booking free of charge up to <strong className="text-[#FFD700]">24 hours</strong> before the scheduled departure time. Cancellations within this window receive a full refund to the original payment method.',
    'You may cancel your booking free of charge up to your tour\'s <strong className="text-[#FFD700]">free cancellation deadline</strong> (typically 24–48 hours before departure, as stated on your booking confirmation). Cancellations within this window receive a full refund to the original payment method.',
    'sec1 — replace hardcoded 24h with per-tour deadline'
  );

  c = replace(
    c,
    'Cancellations made less than 24 hours before departure are subject to a <strong className="text-[#FFD700]">50% cancellation fee</strong>. The remaining 50% will be refunded or credited toward a future booking at your discretion.',
    'Cancellations made within the late cancellation window (inside the tour\'s free cancellation deadline) are subject to a <strong className="text-[#FFD700]">cancellation fee as specified in the tour\'s individual policy</strong>. Any refundable portion will be returned to the original payment method or credited toward a future booking.',
    'sec2 — replace hardcoded 24h late window'
  );

  c = replace(
    c,
    'Date or guest count modifications are free up to 24 hours before departure, subject to availability. Price differences may apply.',
    'Date or guest count modifications are free up to the tour\'s free cancellation deadline, subject to availability. Price differences may apply.',
    'sec5 — replace hardcoded 24h modification window'
  );

  writeFile(file, c);
}

// ─── 2. Testimonials.tsx — change "Verified Booking" label to "Verified Guest" ─
{
  const file = 'src/components/landing/Testimonials.tsx';
  let c = readFile(file);

  // The badge shows dict.testimonials.verified for TALAGO-source reviews.
  // We need to change the label to avoid implying booking linkage verification.
  // Add a bookingVerified prop to LandingReview interface and use it conditionally.
  // Simpler safe fix: change the badge to show "Verified Guest" always (remove the
  // dict.testimonials.verified which says "Verified Booking" and use a neutral label).

  c = replace(
    c,
    '                    {testimonial.source && testimonial.source !== \'TALAGO\'\r\n                      ? `${testimonial.source}`\r\n                      : dict.testimonials.verified}',
    '                    {testimonial.source && testimonial.source !== \'TALAGO\'\r\n                      ? `${testimonial.source}`\r\n                      : dict.testimonials.verifiedGuest ?? \'Verified Guest\'}',
    'Testimonials badge — use verifiedGuest instead of verifiedBooking'
  );

  writeFile(file, c);
}

// ─── 3. Non-English locales — soften insuranceDesc and certifiedCaptainsDesc ──
const localeChanges = {
  'src/locales/de.ts': {
    certifiedCaptainsDesc: {
      from: "    certifiedCaptainsDesc: 'Alle Kapitäne besitzen international anerkannte Lizenzen mit mindestens 10 Jahren Erfahrung im Roten Meer.',",
      to:   "    certifiedCaptainsDesc: 'Alle Kapitäne sind professionell lizenziert und mit den lokalen Gewässern vertraut.',",
    },
    insuranceDesc: {
      from: "    insuranceDesc: 'Alle TALAGO-Operationen sind durch eine umfassende Haftpflicht- und Passagierversicherung abgedeckt.',",
      to:   "    insuranceDesc: 'Der Versicherungsschutz richtet sich nach dem jeweiligen Ausflug und Betreiber. Details werden bei der Buchungsbestätigung mitgeteilt.',",
    },
  },
  'src/locales/es.ts': {
    certifiedCaptainsDesc: {
      from: "    certifiedCaptainsDesc: 'Todos los capitanes tienen licencias internacionales.',",
      to:   "    certifiedCaptainsDesc: 'Todos los capitanes están debidamente autorizados y familiarizados con las aguas locales.',",
    },
    insuranceDesc: {
      from: "    insuranceDesc: 'Todas las operaciones cubiertas por seguro de responsabilidad civil.',",
      to:   "    insuranceDesc: 'La cobertura de seguro varía según el recorrido y el operador. Los detalles se confirman en el momento de la reserva.',",
    },
  },
  'src/locales/fr.ts': {
    certifiedCaptainsDesc: {
      from: "    certifiedCaptainsDesc: 'Tous les capitaines sont titulaires de licences internationalement reconnues.',",
      to:   "    certifiedCaptainsDesc: 'Tous les capitaines sont dûment autorisés et familiarisés avec les eaux locales.',",
    },
    insuranceDesc: {
      from: "    insuranceDesc: 'Toutes les opérations sont couvertes par une assurance responsabilité civile complète.',",
      to:   "    insuranceDesc: 'La couverture d\\'assurance varie selon le circuit et l\\'opérateur. Les détails sont confirmés lors de la réservation.',",
    },
  },
  'src/locales/it.ts': {
    certifiedCaptainsDesc: {
      from: "    certifiedCaptainsDesc: 'Tutti i capitani hanno licenze internazionali.',",
      to:   "    certifiedCaptainsDesc: 'Tutti i capitani sono regolarmente autorizzati e conoscono le acque locali.',",
    },
    insuranceDesc: {
      from: "    insuranceDesc: 'Tutte le operazioni coperte da assicurazione di responsabilità civile.',",
      to:   "    insuranceDesc: 'La copertura assicurativa varia per giro e operatore. I dettagli sono confermati al momento della prenotazione.',",
    },
  },
  'src/locales/pl.ts': {
    certifiedCaptainsDesc: {
      from: "    certifiedCaptainsDesc: 'Wszyscy kapitanowie posiadają międzynarodowe licencje.',",
      to:   "    certifiedCaptainsDesc: 'Wszyscy kapitanowie posiadają odpowiednie licencje i znają lokalne wody.',",
    },
    insuranceDesc: {
      from: "    insuranceDesc: 'Wszystkie operacje objęte ubezpieczeniem OC.',",
      to:   "    insuranceDesc: 'Zakres ubezpieczenia zależy od wycieczki i operatora. Szczegóły podawane są w potwierdzeniu rezerwacji.',",
    },
  },
  'src/locales/ru.ts': {
    certifiedCaptainsDesc: {
      from: "    certifiedCaptainsDesc: 'Все капитаны имеют международные лицензии.',",
      to:   "    certifiedCaptainsDesc: 'Все капитаны имеют необходимые лицензии и хорошо знают местные воды.',",
    },
    insuranceDesc: {
      from: "    insuranceDesc: 'Все операции покрыты страховкой ответственности.',",
      to:   "    insuranceDesc: 'Страховое покрытие зависит от тура и оператора. Подробности подтверждаются при бронировании.',",
    },
  },
  'src/locales/uk.ts': {
    certifiedCaptainsDesc: {
      from: "    certifiedCaptainsDesc: 'Усі капітани мають міжнародні ліцензії та досвід навігації Червоним морем понад 10 років. Пустельні гіди навчені екстремальному водінню та наданню першої допомоги.',",
      to:   "    certifiedCaptainsDesc: 'Усі капітани мають відповідні ліцензії та добре знають місцеві води.',",
    },
    insuranceDesc: {
      from: "    insuranceDesc: 'Уся діяльність TALAGO застрахована. Кожен гість захищений полісом від моменту посадки в трансфер до повернення в готель.',",
      to:   "    insuranceDesc: 'Страхове покриття залежить від туру та оператора. Деталі підтверджуються при оформленні бронювання.',",
    },
  },
};

for (const [file, changes] of Object.entries(localeChanges)) {
  let c = readFile(file);
  for (const [key, { from, to }] of Object.entries(changes)) {
    c = replace(c, from, to, `${file}: ${key}`);
  }
  writeFile(file, c);
}

console.log('\n✅ All remaining accuracy fixes applied.');
