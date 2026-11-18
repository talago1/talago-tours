import fs from 'fs';
import path from 'path';
import ImportReviewClient from './ImportReviewClient';

export const dynamic = 'force-dynamic';

export default async function ImportReviewPage() {
  const resultsPath = path.join(process.cwd(), 'scripts', 'data', 'match_results.json');
  let initialData = {
    summary: { A: 0, B: 0, C: 0, D: 0, F: 0 },
    totalSourceTours: 0,
    totalTalagoTours: 0,
    generatedAt: new Date().toISOString(),
    results: []
  };

  if (fs.existsSync(resultsPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      initialData = {
        summary: parsed.summary || initialData.summary,
        totalSourceTours: parsed.totalSourceTours || 0,
        totalTalagoTours: parsed.totalTalagoTours || 0,
        generatedAt: parsed.generatedAt || initialData.generatedAt,
        results: (parsed.results || []).slice(0, 300)
      };
    } catch (e) {}
  }

  return <ImportReviewClient initialData={initialData} />;
}
