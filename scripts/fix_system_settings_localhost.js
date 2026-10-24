const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.systemSetting.findMany();
  for (const s of settings) {
    const str = JSON.stringify(s.value);
    if (str.includes('localhost:3000')) {
      console.log('Found localhost:3000 in key:', s.key);
      const cleaned = str.replace(/http:\/\/localhost:3000/g, '');
      await prisma.systemSetting.update({
        where: { id: s.id },
        data: { value: JSON.parse(cleaned) },
      });
      console.log('Cleaned key:', s.key);
    }
  }

  // Also check Tour table for localhost:3000
  const tours = await prisma.tour.findMany({
    select: { id: true, slug: true, coverImage: true, galleryImages: true, thumbnailUrl: true }
  });
  for (const t of tours) {
    let changed = false;
    let coverImage = t.coverImage;
    let thumbnailUrl = t.thumbnailUrl;
    let galleryImages = t.galleryImages;

    if (coverImage && coverImage.includes('localhost:3000')) {
      coverImage = coverImage.replace(/http:\/\/localhost:3000/g, '');
      changed = true;
    }
    if (thumbnailUrl && thumbnailUrl.includes('localhost:3000')) {
      thumbnailUrl = thumbnailUrl.replace(/http:\/\/localhost:3000/g, '');
      changed = true;
    }
    if (galleryImages && galleryImages.length > 0) {
      const cleanedGallery = galleryImages.map(img => img.replace(/http:\/\/localhost:3000/g, ''));
      if (JSON.stringify(cleanedGallery) !== JSON.stringify(galleryImages)) {
        galleryImages = cleanedGallery;
        changed = true;
      }
    }

    if (changed) {
      await prisma.tour.update({
        where: { id: t.id },
        data: { coverImage, thumbnailUrl, galleryImages }
      });
      console.log('Cleaned localhost:3000 on tour:', t.slug);
    }
  }

  console.log('Finished checking and sanitizing localhost URLs.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
