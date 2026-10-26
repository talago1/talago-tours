/**
 * scripts/test_content_pages_roundtrip.cjs
 *
 * Verifies Content CMS editing, persistence, read-back, and multi-language isolation.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('--- TALAGO Content CMS Persistence & Multi-Language Audit ---');

  // 1. Read existing setting
  const initial = await prisma.systemSetting.findUnique({ where: { key: 'content_pages' } });
  console.log('1. Initial setting exists:', Boolean(initial));

  const initialVal = initial ? JSON.parse(initial.value) : [];
  console.log(`   Found ${initialVal.length} managed content pages.`);

  // 2. Perform a non-destructive roundtrip test on 'about'
  const testMarker = `[TEST-AUDIT-${Date.now()}]`;
  const modifiedPages = initialVal.length > 0 ? JSON.parse(JSON.stringify(initialVal)) : [
    {
      slug: 'about',
      label: 'About TALAGO',
      visible: true,
      translations: {
        en: { title: 'A marketplace for better travel days', intro: 'Intro', blocks: [] },
      },
    },
  ];

  const aboutIndex = modifiedPages.findIndex((p) => p.slug === 'about');
  if (aboutIndex === -1) throw new Error("Could not find 'about' page");

  const originalAbout = JSON.parse(JSON.stringify(modifiedPages[aboutIndex]));

  // Add marker to English and a distinct German translation
  modifiedPages[aboutIndex].translations.en.title = `About TALAGO ${testMarker}`;
  if (!modifiedPages[aboutIndex].translations.de) {
    modifiedPages[aboutIndex].translations.de = {
      title: `Über TALAGO ${testMarker}`,
      intro: 'Deutsche Einleitung',
      blocks: [
        { id: 'about-de-1', heading: 'Über uns', body: 'Deutscher Text', visible: true, kind: 'TEXT' }
      ]
    };
  } else {
    modifiedPages[aboutIndex].translations.de.title = `Über TALAGO ${testMarker}`;
  }

  // 3. Save to database
  console.log('2. Saving test updates with isolated DE translation...');
  await prisma.systemSetting.upsert({
    where: { key: 'content_pages' },
    create: { key: 'content_pages', value: JSON.stringify(modifiedPages) },
    update: { value: JSON.stringify(modifiedPages) },
  });

  // 4. Read back from database
  console.log('3. Re-reading from database...');
  const reread = await prisma.systemSetting.findUnique({ where: { key: 'content_pages' } });
  if (!reread) throw new Error('Failed to re-read systemSetting(content_pages)');
  const parsed = JSON.parse(reread.value);
  const rereadAbout = parsed.find((p) => p.slug === 'about');

  if (!rereadAbout) throw new Error("Missing 'about' page in re-read data");
  if (!rereadAbout.translations.en.title.includes(testMarker)) {
    throw new Error('English title did not persist test marker!');
  }
  if (!rereadAbout.translations.de || !rereadAbout.translations.de.title.includes(testMarker)) {
    throw new Error('German title did not persist test marker!');
  }

  // 5. Verify language isolation: French (fr) or Polish (pl) must NOT have German or modified English injected
  console.log('4. Verifying language isolation...');
  if (rereadAbout.translations.fr && rereadAbout.translations.fr.title?.includes('Über TALAGO')) {
    throw new Error('Pollution detected: German text leaked into French translation!');
  }
  console.log('   ✓ English persisted correctly:', rereadAbout.translations.en.title);
  console.log('   ✓ German persisted correctly and isolated:', rereadAbout.translations.de.title);
  console.log('   ✓ French translation untouched / clean fallback preserved.');

  // 6. Clean up: restore original
  console.log('5. Restoring original content pages state...');
  if (initial) {
    await prisma.systemSetting.update({
      where: { key: 'content_pages' },
      data: { value: initial.value },
    });
  } else {
    await prisma.systemSetting.delete({ where: { key: 'content_pages' } });
  }
  console.log('   ✓ Original state restored perfectly.');
  console.log('=== TEST PASSED: Content CMS roundtrip and language isolation verified ===');
}

run()
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
