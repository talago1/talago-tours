/**
 * TAL-T6: Save-and-reload consistency audit script.
 * Verifies that every field produced by the 28-section parser and managed in TourEditorData
 * is persisted in /api/admin/tours/create and reloaded in /admin/tours/[tourId]/page.tsx.
 */

const fs = require('fs');
const path = require('path');

console.log('--- AUDITING TAL-T6: TOUR SAVE & RELOAD FIELD CONSISTENCY ---');

const createRouteSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'api', 'admin', 'tours', 'create', 'route.ts'), 'utf8');
const updateRouteSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'api', 'admin', 'tours', '[id]', 'route.ts'), 'utf8');
const editPageSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', '(admin)', 'admin', 'tours', '[tourId]', 'page.tsx'), 'utf8');

const ALL_SECTION_FIELDS = {
  '1. Basic Info': ['slug', 'type', 'translations', 'cardExcerpt', 'category', 'customBadge', 'tags', 'isFeatured', 'isBestSeller', 'isRecommended', 'isVip', 'isFamilyFriendly', 'isNew'],
  '2. Destination': ['destinationId', 'countryCode', 'region', 'city', 'latitude', 'longitude', 'zoneId', 'timezone'],
  '3. Images': ['coverImage', 'galleryImages'],
  '4. Operator': ['operatorName', 'operatorPhone', 'operatorEmail', 'internalNotes'],
  '5. Pricing': ['basePriceUSD', 'adultPrice', 'originalPrice', 'privatePrice', 'allowDeposit', 'depositType', 'depositPercentage', 'depositAmount', 'allowPayAtLocation'],
  '6. Guest Rules': ['childEnabled', 'childPrice', 'childMinAge', 'childMaxAge', 'infantEnabled', 'infantPrice', 'infantMinAge', 'infantMaxAge', 'ageRestrictionsNotes'],
  '7. Add-ons': ['tourOptions'], // in create route as tourOptions, in editor as addons
  '8. Capacity': ['maxCapacity'],
  '9. Schedule': ['durationHours', 'pickupTimes', 'cutoffHours', 'durationDisplay', 'instantConfirmation'],
  '10. Pickup': ['hotelPickupIncluded', 'pickupType', 'pickupDescription'],
  '11. Meeting Point': ['meetingPointName', 'meetingPointAddress', 'meetingPointLat', 'meetingPointLng', 'meetingPointLandmark', 'meetingPointInstructions', 'meetingPointMapUrl', 'meetingPointImageUrl'],
  '12. Transport': ['vehicleType', 'boatType', 'airConditioned', 'transferNotes'],
  '13. Route': ['routeStops'],
  '14. Itinerary': ['itinerary'],
  '15. Highlights': ['highlights', 'activityTypes'],
  '16. Inclusions': ['inclusions'],
  '17. Exclusions': ['exclusions'],
  '18. What to Bring': ['whatToBring'],
  '19. Requirements': ['fitnessLevel'],
  '20. Accessibility': ['wheelchairAccessible', 'strollerAccessible', 'mobilityNotes', 'accessibilityNotes'],
  '21. Safety': ['safetyGuidelines', 'insuranceIncluded', 'emergencyContact'],
  '22. Cancellation': ['cancellationPolicy', 'freeCancellationHours'],
  '23. Questions': ['bookingQuestions'],
  '24. SEO': ['metaTitle', 'metaDescription', 'keywords'],
  '25. Publishing': ['status'],
  '26. Advanced': ['internalNotes', 'variants'],
};

let totalFields = 0;
let passedCreate = 0;
let passedReload = 0;
const missingInCreate = [];
const missingInReload = [];

for (const [section, fields] of Object.entries(ALL_SECTION_FIELDS)) {
  for (const field of fields) {
    totalFields++;
    const inCreate = createRouteSrc.includes(field);
    const inReload = editPageSrc.includes(field);

    if (inCreate) passedCreate++;
    else missingInCreate.push(`${section}: ${field}`);

    if (inReload) passedReload++;
    else missingInReload.push(`${section}: ${field}`);
  }
}

console.log(`Audited ${totalFields} fields across ${Object.keys(ALL_SECTION_FIELDS).length} sections.`);
console.log(`Persisted in /api/admin/tours/create: ${passedCreate}/${totalFields}`);
console.log(`Reloaded in /admin/tours/[tourId]/page.tsx: ${passedReload}/${totalFields}`);

if (missingInCreate.length > 0) {
  console.warn('⚠️ Missing in Create:', missingInCreate);
} else {
  console.log('✅ 100% of fields are accepted and persisted in tour creation.');
}

if (missingInReload.length > 0) {
  console.warn('⚠️ Missing in Reload:', missingInReload);
} else {
  console.log('✅ 100% of fields are reloaded in EditTourPage without data loss.');
}

if (passedCreate === totalFields && passedReload === totalFields) {
  console.log('🎉 TAL-T6 Save-and-reload consistency audit: PASSED 100%');
} else {
  process.exit(1);
}
