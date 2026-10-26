// Synthetic unit test for 28-section tour text parser
const fs = require('fs');
const path = require('path');

// Read the template
const templatePath = path.join(__dirname, '..', 'public', 'templates', 'talago-tour-template-28-sections.txt');
const templateText = fs.readFileSync(templatePath, 'utf8');

console.log('--- TESTING 28-SECTION TOUR TEXT PARSER ---');

// Mock simple parser validation logic
function testTemplateContent() {
  const expectedSections = [
    '1. BASIC INFORMATION',
    '2. DESTINATION & LOCATION',
    '3. IMAGES & MEDIA',
    '4. OPERATOR & OPERATIONS',
    '5. PRICING ENGINE',
    '6. GUEST TYPES & AGE RULES',
    '7. ADD-ONS & UPGRADES',
    '8. AVAILABILITY & CAPACITY',
    '9. SCHEDULE & PICKUP TIMES',
    '10. HOTEL PICKUP & TRANSFERS',
    '11. MEETING POINT',
    '12. TRANSPORTATION DETAILS',
    '13. ROUTE & WAYPOINTS',
    '14. ITINERARY TIMELINE',
    '15. ACTIVITIES & HIGHLIGHTS',
    '16. INCLUDED FEATURES',
    '17. EXCLUDED ITEMS',
    '18. WHAT TO BRING',
    '18a. IMPORTANT INFORMATION',
    '18b. FAQS',
    '19. REQUIREMENTS & FITNESS',
    '20. ACCESSIBILITY & SPECIAL NEEDS',
    '21. SAFETY & GUIDELINES',
    '22. CANCELLATION POLICY',
    '23. CUSTOM BOOKING QUESTIONS',
    '24. SEO & METADATA',
    '25. PUBLISHING & VISIBILITY',
    '26. ADVANCED & OPERATIONS',
  ];

  let found = 0;
  for (const s of expectedSections) {
    if (templateText.includes(`### ${s}`)) {
      found++;
    } else {
      console.error(`Missing section heading: ### ${s}`);
    }
  }

  console.log(`Verified ${found} of ${expectedSections.length} section headings in template.`);
  if (found === expectedSections.length) {
    console.log('✅ Template structure verified 100% complete.');
  } else {
    process.exit(1);
  }
}

testTemplateContent();
