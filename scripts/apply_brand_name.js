const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, searchRegex, replacement) {
  const fullPath = path.resolve(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn('File not found:', filePath);
    return;
  }
  const original = fs.readFileSync(fullPath, 'utf8');
  const updated = original.replace(searchRegex, replacement);
  if (original !== updated) {
    fs.writeFileSync(fullPath, updated, 'utf8');
    console.log(`Updated brand in: ${filePath}`);
  } else {
    console.log(`No match for regex in: ${filePath}`);
  }
}

// 1. src/app/layout.tsx
replaceInFile(
  'src/app/layout.tsx',
  /alternateName:\s*'TALAGO Tours'/g,
  "alternateName: 'Talago'"
);

// 2. src/lib/brevo.ts
replaceInFile(
  'src/lib/brevo.ts',
  /process\.env\.BREVO_FROM_NAME \|\| 'TALAGO Tours'/g,
  "process.env.BREVO_FROM_NAME || 'TALAGO'"
);

// 3. src/lib/seoMetadata.ts
replaceInFile(
  'src/lib/seoMetadata.ts',
  /siteName:\s*'TALAGO Tours'/g,
  "siteName: 'TALAGO'"
);

// 4. src/lib/tourTemplates.ts
replaceInFile(
  'src/lib/tourTemplates.ts',
  /\$\{template\.title\} \| TALAGO Tours/g,
  '${template.title} | TALAGO'
);

// 5. src/utils/notificationDispatcher.ts
replaceInFile(
  'src/utils/notificationDispatcher.ts',
  /TALAGO Tours — Booking Confirmation/g,
  'TALAGO — Booking Confirmation'
);
replaceInFile(
  'src/utils/notificationDispatcher.ts',
  /Talago Tours Team/g,
  'Talago Team'
);

// 6. src/utils/pdfGenerator.ts
replaceInFile(
  'src/utils/pdfGenerator.ts',
  /\(TALAGO TOURS & EXPERIENCES\)/g,
  '(TALAGO EXPERIENCES)'
);
replaceInFile(
  'src/utils/pdfGenerator.ts',
  /TALAGO TOURS EGYPT/g,
  'TALAGO EGYPT'
);

// 7. src/utils/whatsappLinkBuilder.ts
replaceInFile(
  'src/utils/whatsappLinkBuilder.ts',
  /Talago Tours/g,
  'Talago'
);

// 8. src/utils/whatsappNotifications.ts
replaceInFile(
  'src/utils/whatsappNotifications.ts',
  /TALAGO Tours/g,
  'TALAGO'
);
replaceInFile(
  'src/utils/whatsappNotifications.ts',
  /Talago Tours Team/g,
  'Talago Team'
);
replaceInFile(
  'src/utils/whatsappNotifications.ts',
  /Команда Talago Tours/g,
  'Команда Talago'
);
replaceInFile(
  'src/utils/whatsappNotifications.ts',
  /L'équipe Talago Tours/g,
  "L'équipe Talago"
);
replaceInFile(
  'src/utils/whatsappNotifications.ts',
  /Team Talago Tours/g,
  'Team Talago'
);
replaceInFile(
  'src/utils/whatsappNotifications.ts',
  /Zespół Talago Tours/g,
  'Zespół Talago'
);
replaceInFile(
  'src/utils/whatsappNotifications.ts',
  /Equipo Talago Tours/g,
  'Equipo Talago'
);

console.log('Brand normalization completed.');
