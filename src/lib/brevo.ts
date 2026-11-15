/**
 * Brevo (formerly Sendinblue) API v3 Integration
 * Native fetch implementation for server-side Next.js route handlers.
 *
 * Supported features:
 *  - Transactional email dispatch
 *  - Marketing email campaign creation & scheduling
 *  - Contact list synchronization
 */

const BREVO_API_BASE = 'https://api.brevo.com/v3';

export function getBrevoApiKey(): string | null {
  return process.env.BREVO_API_KEY?.trim() || null;
}

export function isBrevoConfigured(): boolean {
  return Boolean(getBrevoApiKey());
}

export interface BrevoSender {
  name: string;
  email: string;
}

/**
 * Returns the centrally configured sender for Brevo transactional and marketing emails.
 * Never uses unverified hardcoded addresses like noreply@talago.com.
 */
export function getBrevoSender(): BrevoSender {
  const email = process.env.BREVO_FROM_EMAIL?.trim();
  const name = process.env.BREVO_FROM_NAME?.trim() || 'TALAGO Experiences';

  if (!email) {
    throw new Error(
      'Missing BREVO_FROM_EMAIL environment variable. Configure BREVO_FROM_EMAIL with your verified Brevo sender address in Vercel or .env.'
    );
  }

  return { email, name };
}

function getHeaders(): HeadersInit {
  const apiKey = getBrevoApiKey();
  if (!apiKey) {
    throw new Error('BREVO_API_KEY environment variable is missing.');
  }
  return {
    'accept': 'application/json',
    'content-type': 'application/json',
    'api-key': apiKey,
  };
}

export interface BrevoTransactionalEmailOptions {
  to: Array<{ email: string; name?: string }> | string;
  subject: string;
  htmlContent: string;
  sender?: BrevoSender;
  replyTo?: { email: string; name?: string };
}

export interface BrevoCampaignOptions {
  name: string;
  subject: string;
  htmlContent: string;
  sender?: BrevoSender;
  recipients?: { listIds?: number[]; exclusionListIds?: number[] };
  scheduledAt?: string; // Format: YYYY-MM-DD HH:mm:ss
}

/**
 * Send transactional email via Brevo SMTP API
 */
export async function sendBrevoTransactionalEmail(options: BrevoTransactionalEmailOptions): Promise<{ messageId: string }> {
  const sender = options.sender || getBrevoSender();

  const recipients = typeof options.to === 'string'
    ? [{ email: options.to }]
    : options.to;

  const payload = {
    sender,
    to: recipients,
    subject: options.subject,
    htmlContent: options.htmlContent,
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
  };

  const response = await fetch(`${BREVO_API_BASE}/smtp/email`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Brevo API error: ${response.status}`;
    console.error('[sendBrevoTransactionalEmail] Failed:', errorMsg, 'Sender:', sender.email);
    throw new Error(errorMsg);
  }

  return { messageId: data.messageId || 'accepted' };
}

/**
 * Create a marketing email campaign in Brevo
 */
export async function createBrevoCampaign(options: BrevoCampaignOptions): Promise<{ id: number }> {
  const sender = options.sender || getBrevoSender();

  const payload: Record<string, any> = {
    name: options.name,
    subject: options.subject,
    sender,
    type: 'classic',
    htmlContent: options.htmlContent,
  };

  if (options.recipients) {
    payload.recipients = options.recipients;
  }

  if (options.scheduledAt) {
    payload.scheduledAt = options.scheduledAt;
  }

  const response = await fetch(`${BREVO_API_BASE}/emailCampaigns`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Brevo campaign creation failed: ${response.status}`;
    throw new Error(errorMsg);
  }

  return { id: data.id };
}

/**
 * Send / trigger a draft campaign immediately in Brevo
 */
export async function sendBrevoCampaignNow(campaignId: number): Promise<void> {
  const response = await fetch(`${BREVO_API_BASE}/emailCampaigns/${campaignId}/sendNow`, {
    method: 'POST',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Failed to send Brevo campaign ${campaignId}`);
  }
}

/**
 * Add or sync a contact to Brevo contacts list
 */
export async function syncBrevoContact(email: string, listIds?: number[], attributes?: Record<string, any>): Promise<void> {
  const payload = {
    email,
    ...(listIds && listIds.length > 0 ? { listIds } : {}),
    ...(attributes ? { attributes } : {}),
    updateEnabled: true,
  };

  const response = await fetch(`${BREVO_API_BASE}/contacts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok && response.status !== 204 && response.status !== 201) {
    const data = await response.json().catch(() => ({}));
    // Duplicate contacts return 400 with duplicate parameter
    if (data.code !== 'duplicate_parameter') {
      console.warn('[Brevo Sync Contact Warning]', data.message || response.statusText);
    }
  }
}

/**
 * Test Brevo account connectivity and fetch account info
 */
export async function getBrevoAccountInfo(): Promise<{ email: string; companyName: string; plan: any } | null> {
  if (!isBrevoConfigured()) return null;

  try {
    const response = await fetch(`${BREVO_API_BASE}/account`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Brevo account error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Brevo getBrevoAccountInfo]', error);
    throw error;
  }
}

