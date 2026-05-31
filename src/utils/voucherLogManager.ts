import type { CheckInLogEntry } from '@/types/voucher';

export function createCheckInLogEntry(timestamp?: string): CheckInLogEntry {
  return {
    event: 'QR_CHECK_IN',
    timestamp: timestamp || new Date().toISOString(),
    scanStatus: 'SUCCESS',
  };
}

export function hasExistingCheckIn(logs: unknown): boolean {
  if (!Array.isArray(logs)) return false;
  return logs.some(
    (entry) =>
      typeof entry === 'object' &&
      entry !== null &&
      (entry as Record<string, unknown>).event === 'QR_CHECK_IN'
  );
}

export function getExistingCheckInTimestamp(logs: unknown): string | null {
  if (!Array.isArray(logs)) return null;
  const entry = logs.find(
    (entry) =>
      typeof entry === 'object' &&
      entry !== null &&
      (entry as Record<string, unknown>).event === 'QR_CHECK_IN'
  );
  if (!entry) return null;
  return ((entry as Record<string, unknown>).timestamp as string) || null;
}
