export interface EligibilityResult {
  eligible: boolean;
  error?: string;
  statusCode?: number;
}

export async function verifyBookingEligibility(bookingRef: string): Promise<EligibilityResult> {
  return { eligible: false, error: 'Verification system not configured' };
}
