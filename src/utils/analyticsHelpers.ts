/**
 * Shared helpers for admin analytics API routes.
 */

export function getTourTitle(translations: unknown, lang = 'en'): string {
  if (typeof translations === 'object' && translations !== null) {
    const t = translations as Record<string, { title?: string }>;
    for (const key of [lang, 'en']) {
      const entry = t[key];
      if (entry && typeof entry.title === 'string') return entry.title;
    }
  }
  return 'Unknown Tour';
}

export function getDateRange(period: string | null): { startDate: Date; endDate: Date } | null {
  const now = new Date();
  const end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));

  switch (period) {
    case 'today': {
      const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
      return { startDate: start, endDate: end };
    }
    case '7d': {
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: end };
    }
    case 'month': {
      const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
      return { startDate: start, endDate: end };
    }
    case 'ytd': {
      const start = new Date(Date.UTC(now.getFullYear(), 0, 1, 0, 0, 0, 0));
      return { startDate: start, endDate: end };
    }
    default:
      return null;
  }
}
