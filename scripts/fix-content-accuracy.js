// Content accuracy fix script
const fs = require('fs');
const path = require('path');

function patch(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = 0;
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed++;
    } else {
      console.warn(`  [WARN] Not found in ${path.basename(filePath)}: ${from.slice(0, 60)}...`);
    }
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  Patched ${path.basename(filePath)}: ${changed}/${replacements.length} replacements`);
}

// ─────────────────────────────────────────────────────────
// 1. en.ts — fix all unverified/universal public claims
// ─────────────────────────────────────────────────────────
patch('src/locales/en.ts', [
  // Hero metric: "Since 2016" — unverified founding year claim
  ["      ratingValue: 'Since 2016',", "      ratingValue: 'Local Operator',"],

  // Hero trust badge: "Free Cancellation" → more accurate
  ["      freeCancellation: 'Free Cancellation',", "      freeCancellation: 'Flexible Cancellation',"],

  // Bento: "All-Inclusive Premium Dining" → scoped per-tour
  [
    "        title: 'All-Inclusive Premium Dining',",
    "        title: 'Premium Dining & Catering',"
  ],
  [
    "        description: 'Fine seafood, fresh juices, crafted beach lunches, and desert oasis catering served with polished timing.'",
    "        description: 'Many tours include premium catering — fresh seafood at sea or Bedouin oasis dinners in the desert. Specific meal inclusions are listed on each tour page.'"
  ],

  // Bento captains: "hand-selected" → operational
  [
    "        description: 'Every TALAGO departure is operated by hand-selected marine captains, desert convoy leaders, and multilingual hosts trained in premium hospitality, route safety, and discreet guest care.'",
    "        description: 'TALAGO departures are operated by experienced marine captains, desert convoy leaders, and multilingual hosts committed to safety, local expertise, and guest comfort.'"
  ],

  // Bento flexibility: "zero hidden fees" → softened (can't guarantee universally)
  [
    "        description: 'Instant cancellations, zero hidden fees, date changes with concierge support, and seamless modifications for private groups and families.'",
    "        description: 'Flexible cancellations, date changes with concierge support, and transparent pricing with no surprise charges. See each tour for its specific cancellation terms.'"
  ],

  // Safety page: unverified captain count and credentials
  [
    "    certifiedCaptainsDesc: 'All marine captains hold internationally recognized licenses with a minimum of 10 years of Red Sea navigation experience. Desert guides are certified in advanced off-road navigation and first response.',\r\n    metricCaptains: '25+',",
    "    certifiedCaptainsDesc: 'Our marine captains hold professional navigation licences with extensive Red Sea experience. Desert guides are trained in off-road navigation and first response.',\r\n    metricCaptains: '20+',"
  ],

  // Safety: satellite phones — specific equipment claim
  [
    "    safetyGearDesc: 'Every vessel is equipped with life jackets for all passengers, emergency beacons, satellite phones, and comprehensive first-aid medical kits. Desert vehicles carry GPS trackers, sand ladders, and emergency supplies.',",
    "    safetyGearDesc: 'Every vessel carries life jackets for all passengers, emergency beacons, and first-aid medical kits. Desert vehicles carry GPS trackers, sand ladders, and emergency supplies.',"
  ],

  // Safety: "certified wilderness first responders" — specific unverified cert
  [
    "    emergencyResponseDesc: 'All trips maintain direct communication with local emergency services. Our marine routes include rapid evacuation plans, and desert convoys carry certified wilderness first responders.',\r\n    metricResponse: '< 15 min',\r\n    metricResponseLabel: 'Average Emergency Response',",
    "    emergencyResponseDesc: 'All trips maintain direct communication with local emergency services. Our marine routes include rapid evacuation plans, and desert convoys carry first-aid certified support crew.',\r\n    metricResponse: 'Priority',\r\n    metricResponseLabel: 'Emergency Response Protocol',"
  ],

  // Safety: "$5M coverage per passenger" — unverified figure
  [
    "    insurance: 'Comprehensive Insurance',\r\n    insuranceDesc: 'All TALAGO operations are covered by comprehensive public liability and passenger insurance. Every guest is fully insured from the moment of pickup to drop-off.',\r\n    metricInsurance: '$5M',\r\n    metricInsuranceLabel: 'Coverage Per Passenger',",
    "    insurance: 'Activity Insurance',\r\n    insuranceDesc: 'TALAGO operations include activity and passenger insurance arrangements. Specific coverage applies per tour and operator — full details are confirmed in your booking.',\r\n    metricInsurance: 'Covered',\r\n    metricInsuranceLabel: 'Activity Insurance Per Tour',"
  ],

  // Flexible Protection: "24 hours" conflicts with booking-terms "48 hours"
  [
    "    heroTitle: 'Cancel Up to 24 Hours in Advance for a Full Refund',",
    "    heroTitle: 'Cancel in Advance for a Full Refund',"
  ],
  [
    "    protectionCard1Desc: 'Cancel up to 24 hours before your scheduled departure and receive 100% of your payment back. No questions asked, no processing fees.',",
    "    protectionCard1Desc: 'Cancel before your tour\\'s free cancellation deadline and receive 100% of your payment back. The exact window varies per tour — check the cancellation terms on each tour page.',"
  ],

  // Tour details: "Free Cancellation" and "cancel up to 24h" universal claim
  [
    "    secureBooking: 'Secure booking — Free cancellation',",
    "    secureBooking: 'Secure booking — Flexible cancellation',"
  ],
  [
    "    freeCancellation: 'Free Cancellation',\r\n    cancelUpTo: 'Cancel up to 24 hours in advance for a full refund. No questions asked — because plans change.',",
    "    freeCancellation: 'Cancellation Policy',\r\n    cancelUpTo: 'Each tour has its own cancellation terms. The free cancellation window is shown on your tour page and confirmed at checkout.',"
  ],

  // FAQ: "rescue divers, satellite tracking" — specific unverified for all trips
  [
    "      a: 'Safety is our absolute baseline. All marine trips carry professional rescue divers, satellite tracking, and full medical arrays. Desert convoys are tracked live with first-aid certified support crew.'",
    "      a: 'Safety is our absolute baseline. Marine trips operate with trained crew, life jackets for all passengers, and emergency communication equipment. Desert convoys carry GPS tracking and first-aid certified support crew. Specific safety arrangements are listed on each tour page.'"
  ],

  // FAQ: "luxury SUVs" and "Bedouin oasis dinner" as universal safari promise
  [
    "      a: 'All TALAGO Safari packages include premium quad bikes, full safety gear, professional lead convoy, private Bedouin oasis dinner with barbecue, fresh juices, and round-trip transfers in luxury SUVs.'",
    "      a: 'Standard TALAGO Safari packages typically include quad bikes, safety gear, a professional convoy lead, Bedouin oasis dinner, and round-trip transfers. Exact inclusions vary — please check the inclusions list on your specific tour page.'"
  ],

  // Copyright: add year
  [
    "    copyright: '\u00a9 TALAGO. All rights reserved.',",
    "    copyright: '\u00a9 2026 TALAGO. All rights reserved.',"
  ],

  // About: "highest operational safety standards" — matches updated safety page
  [
    "    description: 'TALAGO maintains the highest operational safety standards across all marine and desert experiences. Every journey is backed by certified professionals, premium equipment, and emergency protocols.',",
    "    description: 'TALAGO maintains high operational safety standards across all marine and desert experiences. Every journey is backed by trained professionals, safety equipment, and emergency protocols.',"
  ],
]);

// ─────────────────────────────────────────────────────────
// 2. Other locale files — sync the same critical metrics
//    (safety page metrics only — FAQSection is hardcoded English)
// ─────────────────────────────────────────────────────────
const otherLocales = ['de', 'es', 'fr', 'it', 'pl', 'ru', 'uk'];

for (const lang of otherLocales) {
  const filePath = `src/locales/${lang}.ts`;
  if (!fs.existsSync(filePath)) continue;

  patch(filePath, [
    // Insurance: remove $5M metric
    ["    metricInsurance: '$5M',", "    metricInsurance: 'Covered',"],
    // Update insurance description to avoid absolute guarantee
    // (each locale has its own wording — only flag the $5M)
  ]);
}

console.log('\nAll content accuracy fixes applied.');
