import { prisma } from '@/lib/prisma';
import {
  translateChunk,
  CHUNK_KEYS,
  ChunkKey,
  computeSourceHash,
  mergeChunkResults,
} from '@/lib/translation-engine';
import type { TourTranslationPayload } from '@/lib/gemini';
import { getManagedLanguages } from '@/lib/languages';

if (typeof window !== 'undefined') {
  throw new Error('Security Violation: translation-jobs cannot be imported into client bundle.');
}

export interface JobProgressResponse {
  id: string;
  tourId: string;
  sourceHash: string;
  status: string;
  targetLangs: string[];
  totalChunks: number;
  completedChunks: number;
  failedChunks: number;
  percent: number;
  chunkStatus: Record<string, Record<string, string>>;
  chunkErrors: Record<string, Record<string, string>>;
  chunkProviders: Record<string, string>;
  isComplete: boolean;
}

/**
 * Creates a new translation job or resumes an existing matching active job.
 */
export async function createOrResumeTranslationJob(
  tourId: string,
  source: TourTranslationPayload,
  requestedLangs?: string[]
): Promise<JobProgressResponse> {
  const sourceHash = computeSourceHash(source);

  // Determine active target languages
  let langs = requestedLangs;
  if (!langs || langs.length === 0) {
    const all = await getManagedLanguages();
    langs = all.filter((l) => !l.isSource && l.isActive && l.includeInTranslations).map((l) => l.code);
  }

  // Look for existing active job with same sourceHash
  const existing = await prisma.translationJob.findFirst({
    where: {
      tourId,
      sourceHash,
      status: { in: ['PENDING', 'RUNNING', 'PARTIAL'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    return formatJobResponse(existing);
  }

  // Initialize chunk status matrix
  const initialStatus: Record<string, Record<string, string>> = {};
  for (const l of langs) {
    initialStatus[l] = {};
    for (const c of CHUNK_KEYS) {
      initialStatus[l][c] = 'PENDING';
    }
  }

  const job = await prisma.translationJob.create({
    data: {
      tourId,
      sourceHash,
      status: 'PENDING',
      targetLangs: langs.join(','),
      chunkStatus: initialStatus,
      chunkResults: {},
      chunkErrors: {},
      chunkProviders: {},
    },
  });

  return formatJobResponse(job);
}

/**
 * Fetches the current progress of a translation job.
 */
export async function getTranslationJob(jobId: string): Promise<JobProgressResponse | null> {
  const job = await prisma.translationJob.findUnique({ where: { id: jobId } });
  if (!job) return null;
  return formatJobResponse(job);
}

/**
 * Executes the next pending or retry-requested chunk for a job.
 * Updates database immediately after each chunk finishes.
 */
export async function executeNextChunk(
  jobId: string,
  source: TourTranslationPayload,
  options?: { targetLang?: string; targetChunk?: ChunkKey }
): Promise<{
  job: JobProgressResponse;
  processedChunk?: { lang: string; chunkKey: ChunkKey; success: boolean; error?: string };
}> {
  const job = await prisma.translationJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error(`Job not found: ${jobId}`);

  // Stale check
  const currentHash = computeSourceHash(source);
  if (currentHash !== job.sourceHash) {
    throw new Error('Source tour has changed since this translation job was created. Start a new job to prevent overwriting new content.');
  }

  const chunkStatus = (job.chunkStatus as Record<string, Record<string, string>>) || {};
  const chunkResults = (job.chunkResults as Record<string, Record<string, any>>) || {};
  const chunkErrors = (job.chunkErrors as Record<string, Record<string, string>>) || {};
  const chunkProviders = (job.chunkProviders as Record<string, string>) || {};
  const targetLangs = job.targetLangs.split(',').filter(Boolean);

  // Find next chunk to process
  let selectedLang = options?.targetLang;
  let selectedChunk = options?.targetChunk;

  if (!selectedLang || !selectedChunk) {
    for (const l of targetLangs) {
      for (const c of CHUNK_KEYS) {
        const s = chunkStatus[l]?.[c];
        if (s === 'PENDING' || s === 'FAILED') {
          selectedLang = l;
          selectedChunk = c;
          break;
        }
      }
      if (selectedLang) break;
    }
  }

  // If all chunks already processed
  if (!selectedLang || !selectedChunk) {
    const isAllDone = Object.values(chunkStatus).every((langObj) =>
      Object.values(langObj).every((status) => status === 'DONE')
    );
    const finalStatus = isAllDone ? 'DONE' : 'PARTIAL';

    const updatedJob = await prisma.translationJob.update({
      where: { id: jobId },
      data: { status: finalStatus },
    });

    // If fully completed, persist results to Tour
    if (finalStatus === 'DONE') {
      await persistCompletedJobToTour(job.tourId, targetLangs, chunkResults);
    }

    return { job: formatJobResponse(updatedJob) };
  }

  // Translate the selected chunk
  const allLangs = await getManagedLanguages();
  const langMeta = allLangs.find((l) => l.code === selectedLang);

  if (!chunkStatus[selectedLang]) chunkStatus[selectedLang] = {};
  if (!chunkResults[selectedLang]) chunkResults[selectedLang] = {};
  if (!chunkErrors[selectedLang]) chunkErrors[selectedLang] = {};

  try {
    const result = await translateChunk(source, selectedChunk, selectedLang, langMeta?.displayName);

    chunkStatus[selectedLang][selectedChunk] = 'DONE';
    chunkResults[selectedLang][selectedChunk] = result.fields;
    delete chunkErrors[selectedLang][selectedChunk];
    chunkProviders[`${selectedLang}:${selectedChunk}`] = `${result.providerUsed} (${result.modelUsed})`;

    // Check if whole job is now complete
    const isAllDone = targetLangs.every((l) =>
      CHUNK_KEYS.every((c) => chunkStatus[l]?.[c] === 'DONE')
    );

    const updatedJob = await prisma.translationJob.update({
      where: { id: jobId },
      data: {
        status: isAllDone ? 'DONE' : 'RUNNING',
        chunkStatus,
        chunkResults,
        chunkErrors,
        chunkProviders,
      },
    });

    if (isAllDone) {
      await persistCompletedJobToTour(job.tourId, targetLangs, chunkResults);
    }

    return {
      job: formatJobResponse(updatedJob),
      processedChunk: { lang: selectedLang, chunkKey: selectedChunk, success: true },
    };
  } catch (err: any) {
    chunkStatus[selectedLang][selectedChunk] = 'FAILED';
    chunkErrors[selectedLang][selectedChunk] = err.message || 'Unknown error';

    const updatedJob = await prisma.translationJob.update({
      where: { id: jobId },
      data: {
        status: 'PARTIAL',
        chunkStatus,
        chunkErrors,
      },
    });

    return {
      job: formatJobResponse(updatedJob),
      processedChunk: { lang: selectedLang, chunkKey: selectedChunk, success: false, error: err.message },
    };
  }
}

/**
 * Merges and saves completed job chunks into the Tour translations column in PostgreSQL.
 */
async function persistCompletedJobToTour(
  tourId: string,
  targetLangs: string[],
  chunkResults: Record<string, Record<string, any>>
) {
  try {
    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) return;

    const currentTranslations = (tour.translations as Record<string, any>) || {};
    const updatedTranslations = { ...currentTranslations };

    for (const l of targetLangs) {
      let merged = updatedTranslations[l] || {};
      const langChunks = chunkResults[l] || {};
      for (const c of CHUNK_KEYS) {
        if (langChunks[c]) {
          merged = mergeChunkResults(merged, langChunks[c]);
        }
      }
      updatedTranslations[l] = merged;
    }

    await prisma.tour.update({
      where: { id: tourId },
      data: { translations: updatedTranslations },
    });
  } catch (e) {
    console.error(`[persistCompletedJobToTour] Error saving translations to tour ${tourId}:`, e);
  }
}

function formatJobResponse(job: any): JobProgressResponse {
  const targetLangs = (job.targetLangs || '').split(',').filter(Boolean);
  const chunkStatus = (job.chunkStatus as Record<string, Record<string, string>>) || {};
  const chunkErrors = (job.chunkErrors as Record<string, Record<string, string>>) || {};
  const chunkProviders = (job.chunkProviders as Record<string, string>) || {};

  let totalChunks = targetLangs.length * CHUNK_KEYS.length;
  let completedChunks = 0;
  let failedChunks = 0;

  for (const l of targetLangs) {
    for (const c of CHUNK_KEYS) {
      const s = chunkStatus[l]?.[c];
      if (s === 'DONE') completedChunks++;
      else if (s === 'FAILED') failedChunks++;
    }
  }

  const percent = totalChunks > 0 ? Math.round((completedChunks / totalChunks) * 100) : 0;

  return {
    id: job.id,
    tourId: job.tourId,
    sourceHash: job.sourceHash,
    status: job.status,
    targetLangs,
    totalChunks,
    completedChunks,
    failedChunks,
    percent,
    chunkStatus,
    chunkErrors,
    chunkProviders,
    isComplete: completedChunks === totalChunks && totalChunks > 0,
  };
}
