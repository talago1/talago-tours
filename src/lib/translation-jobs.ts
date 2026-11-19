import { prisma } from '@/lib/prisma';
import {
  translateChunk,
  CHUNK_KEYS,
  ChunkKey,
  computeSourceHash,
  mergeChunkResults,
  auditTranslationCompleteness,
  FieldCompletenessAudit,
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
  status: 'PENDING' | 'RUNNING' | 'PARTIAL' | 'DONE' | 'PAUSED' | 'FAILED';
  targetLangs: string[];
  currentLanguage?: string;
  totalChunks: number;
  completedChunks: number;
  failedChunks: number;
  percent: number;
  chunkStatus: Record<string, Record<string, string>>;
  chunkErrors: Record<string, Record<string, string>>;
  chunkProviders: Record<string, string>;
  languageAudits?: Record<string, FieldCompletenessAudit>;
  isComplete: boolean;
}

/**
 * Creates a new translation job or resumes an existing matching active job.
 * Enforces: Only ONE active job per tour at a time.
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
    langs = all
      .filter((l) => !l.isSource && l.isActive && l.includeInTranslations)
      .map((l) => l.code);
  }

  // Look for existing active or partial job with same sourceHash
  const existing = await prisma.translationJob.findFirst({
    where: {
      tourId,
      sourceHash,
      status: { in: ['PENDING', 'RUNNING', 'PARTIAL', 'PAUSED'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    return formatJobResponse(existing, source);
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

  return formatJobResponse(job, source);
}

/**
 * Fetches the current progress of a translation job.
 */
export async function getTranslationJob(
  jobId: string,
  source?: TourTranslationPayload
): Promise<JobProgressResponse | null> {
  const job = await prisma.translationJob.findUnique({ where: { id: jobId } });
  if (!job) return null;
  return formatJobResponse(job, source);
}

/**
 * Pauses an active translation job.
 */
export async function pauseTranslationJob(jobId: string): Promise<JobProgressResponse> {
  const updated = await prisma.translationJob.update({
    where: { id: jobId },
    data: { status: 'PAUSED' },
  });
  return formatJobResponse(updated);
}

/**
 * Executes the next sequential chunk for a job.
 * RULE: Completes one language completely (all applicable chunks) before moving to the next language.
 * Immediately saves completed language to PostgreSQL Tour.translations[lang].
 */
export async function executeNextChunk(
  jobId: string,
  source: TourTranslationPayload,
  options?: { targetLang?: string; targetChunk?: ChunkKey; preserveManualEdits?: boolean }
): Promise<{
  job: JobProgressResponse;
  processedChunk?: { lang: string; chunkKey: ChunkKey; success: boolean; error?: string };
  completedLanguage?: { lang: string; translation: TourTranslationPayload; audit: FieldCompletenessAudit };
}> {
  const job = await prisma.translationJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error(`Job not found: ${jobId}`);

  // Stale check
  const currentHash = computeSourceHash(source);
  if (currentHash !== job.sourceHash) {
    throw new Error(
      'Source tour has changed since this translation job was created. Start a new job to prevent overwriting new content.'
    );
  }

  const chunkStatus = (job.chunkStatus as Record<string, Record<string, string>>) || {};
  const chunkResults = (job.chunkResults as Record<string, Record<string, any>>) || {};
  const chunkErrors = (job.chunkErrors as Record<string, Record<string, string>>) || {};
  const chunkProviders = (job.chunkProviders as Record<string, string>) || {};
  const targetLangs = job.targetLangs.split(',').filter(Boolean);

  // Determine active language and chunk sequentially
  let selectedLang = options?.targetLang;
  let selectedChunk = options?.targetChunk;

  if (!selectedLang || !selectedChunk) {
    // Sequential language iteration: process the first language with unfinished chunks
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

  // If no chunks remain in any language: job is complete
  if (!selectedLang || !selectedChunk) {
    const isAllDone = Object.values(chunkStatus).every((langObj) =>
      Object.values(langObj).every((status) => status === 'DONE')
    );
    const finalStatus = isAllDone ? 'DONE' : 'PARTIAL';

    const updatedJob = await prisma.translationJob.update({
      where: { id: jobId },
      data: { status: finalStatus },
    });

    return { job: formatJobResponse(updatedJob, source) };
  }

  // Initialize lang structures
  if (!chunkStatus[selectedLang]) chunkStatus[selectedLang] = {};
  if (!chunkResults[selectedLang]) chunkResults[selectedLang] = {};
  if (!chunkErrors[selectedLang]) chunkErrors[selectedLang] = {};

  const allLangs = await getManagedLanguages();
  const langMeta = allLangs.find((l) => l.code === selectedLang);

  try {
    const result = await translateChunk(source, selectedChunk, selectedLang, langMeta?.displayName);

    chunkStatus[selectedLang][selectedChunk] = 'DONE';
    chunkResults[selectedLang][selectedChunk] = result.fields;
    delete chunkErrors[selectedLang][selectedChunk];
    chunkProviders[`${selectedLang}:${selectedChunk}`] = `${result.providerUsed} (${result.modelUsed})`;

    // Check if the current language is now completely translated
    const isCurrentLangDone = CHUNK_KEYS.every(
      (c) => chunkStatus[selectedLang]?.[c] === 'DONE'
    );

    let completedLanguageData:
      | { lang: string; translation: TourTranslationPayload; audit: FieldCompletenessAudit }
      | undefined;

    if (isCurrentLangDone) {
      // Assemble full language translation
      let fullLangPayload: TourTranslationPayload = {} as any;
      for (const c of CHUNK_KEYS) {
        if (chunkResults[selectedLang][c]) {
          fullLangPayload = mergeChunkResults(fullLangPayload, chunkResults[selectedLang][c]);
        }
      }

      // Compute field-level completeness audit
      const audit = auditTranslationCompleteness(source, fullLangPayload, selectedLang);
      chunkResults[selectedLang]._audit = audit;

      // IMMEDIATELY PERSIST this completed language into the Tour in PostgreSQL
      await persistLanguageToTour(
        job.tourId,
        selectedLang,
        fullLangPayload,
        options?.preserveManualEdits ?? true
      );

      completedLanguageData = {
        lang: selectedLang,
        translation: fullLangPayload,
        audit,
      };
    }

    // Check if all requested target languages are done
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

    return {
      job: formatJobResponse(updatedJob, source),
      processedChunk: { lang: selectedLang, chunkKey: selectedChunk, success: true },
      completedLanguage: completedLanguageData,
    };
  } catch (err: any) {
    chunkStatus[selectedLang][selectedChunk] = 'FAILED';
    chunkErrors[selectedLang][selectedChunk] = err.message || 'Unknown translation error';

    const updatedJob = await prisma.translationJob.update({
      where: { id: jobId },
      data: {
        status: 'PARTIAL',
        chunkStatus,
        chunkErrors,
      },
    });

    return {
      job: formatJobResponse(updatedJob, source),
      processedChunk: {
        lang: selectedLang,
        chunkKey: selectedChunk,
        success: false,
        error: err.message,
      },
    };
  }
}

/**
 * Saves a single completed language immediately into Tour.translations[lang]
 * Protects manual edits if preserveManualEdits is true.
 */
export async function persistLanguageToTour(
  tourId: string,
  lang: string,
  newTranslation: TourTranslationPayload,
  preserveManualEdits = true
): Promise<void> {
  try {
    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) return;

    const currentTranslations = (tour.translations as Record<string, any>) || {};
    const existingLang = currentTranslations[lang] || {};

    let finalLangData = { ...newTranslation };

    if (preserveManualEdits && existingLang._manuallyEdited) {
      // Keep manually edited fields
      finalLangData = {
        ...newTranslation,
        ...existingLang,
        _manuallyEdited: true,
      };
    }

    const updatedTranslations = {
      ...currentTranslations,
      [lang]: finalLangData,
    };

    await prisma.tour.update({
      where: { id: tourId },
      data: { translations: updatedTranslations },
    });
  } catch (err) {
    console.error(`[persistLanguageToTour] Error saving language ${lang} to tour ${tourId}:`, err);
  }
}

function formatJobResponse(job: any, source?: TourTranslationPayload): JobProgressResponse {
  const targetLangs = (job.targetLangs || '').split(',').filter(Boolean);
  const chunkStatus = (job.chunkStatus as Record<string, Record<string, string>>) || {};
  const chunkResults = (job.chunkResults as Record<string, Record<string, any>>) || {};
  const chunkErrors = (job.chunkErrors as Record<string, Record<string, string>>) || {};
  const chunkProviders = (job.chunkProviders as Record<string, string>) || {};

  const totalChunks = targetLangs.length * CHUNK_KEYS.length;
  let completedChunks = 0;
  let failedChunks = 0;
  let currentLanguage: string | undefined;

  for (const l of targetLangs) {
    let langHasPending = false;
    for (const c of CHUNK_KEYS) {
      const s = chunkStatus[l]?.[c];
      if (s === 'DONE') completedChunks++;
      else if (s === 'FAILED') failedChunks++;
      else if (s === 'PENDING') langHasPending = true;
    }
    if (!currentLanguage && langHasPending) {
      currentLanguage = l;
    }
  }

  const percent = totalChunks > 0 ? Math.round((completedChunks / totalChunks) * 100) : 0;

  // Extract or compute field completeness audits
  const languageAudits: Record<string, FieldCompletenessAudit> = {};
  for (const l of targetLangs) {
    if (chunkResults[l]?._audit) {
      languageAudits[l] = chunkResults[l]._audit;
    } else if (source) {
      let langData: TourTranslationPayload = {} as any;
      for (const c of CHUNK_KEYS) {
        if (chunkResults[l]?.[c]) {
          langData = mergeChunkResults(langData, chunkResults[l][c]);
        }
      }
      languageAudits[l] = auditTranslationCompleteness(source, langData, l);
    }
  }

  return {
    id: job.id,
    tourId: job.tourId,
    sourceHash: job.sourceHash,
    status: job.status as any,
    targetLangs,
    currentLanguage,
    totalChunks,
    completedChunks,
    failedChunks,
    percent,
    chunkStatus,
    chunkErrors,
    chunkProviders,
    languageAudits,
    isComplete: completedChunks === totalChunks && totalChunks > 0,
  };
}
