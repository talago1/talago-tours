import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/utils/adminAuth';
import {
  isBrevoConfigured,
  createBrevoCampaign,
  sendBrevoCampaignNow,
  getBrevoAccountInfo,
  sendBrevoTransactionalEmail,
} from '@/lib/brevo';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/campaigns/brevo
 * Check Brevo connection status & account details
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isBrevoConfigured()) {
    return NextResponse.json({
      configured: false,
      message: 'BREVO_API_KEY environment variable is not configured.',
    });
  }

  try {
    const account = await getBrevoAccountInfo();
    return NextResponse.json({
      configured: true,
      account,
    });
  } catch (err: any) {
    return NextResponse.json({
      configured: true,
      connected: false,
      error: err.message || 'Failed to authenticate with Brevo API',
    }, { status: 400 });
  }
}

/**
 * POST /api/admin/campaigns/brevo
 * Create and optionally schedule or send an email campaign via Brevo
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isBrevoConfigured()) {
    return NextResponse.json({
      error: 'Brevo is not configured. Please set BREVO_API_KEY.',
    }, { status: 400 });
  }

  try {
    const body = await request.json();
    const {
      name,
      subject,
      htmlContent,
      senderName,
      senderEmail,
      listIds,
      scheduledAt,
      sendNow,
      testEmail,
    } = body;

    if (!name || !subject || !htmlContent) {
      return NextResponse.json({
        error: 'Campaign name, subject, and htmlContent are required.',
      }, { status: 422 });
    }

    // If testEmail is requested, send a test transactional email
    if (testEmail) {
      const testResult = await sendBrevoTransactionalEmail({
        to: testEmail,
        subject: `[TEST] ${subject}`,
        htmlContent,
        sender: senderEmail ? { name: senderName || 'TALAGO Tours', email: senderEmail } : undefined,
      });

      return NextResponse.json({
        success: true,
        testSent: true,
        messageId: testResult.messageId,
      });
    }

    // Create the campaign in Brevo
    const campaign = await createBrevoCampaign({
      name,
      subject,
      htmlContent,
      sender: senderEmail ? { name: senderName || 'TALAGO Tours', email: senderEmail } : undefined,
      recipients: listIds && listIds.length > 0 ? { listIds } : undefined,
      scheduledAt: scheduledAt || undefined,
    });

    // If immediate send requested
    if (sendNow && campaign.id) {
      await sendBrevoCampaignNow(campaign.id);
    }

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      status: sendNow ? 'sent' : scheduledAt ? 'scheduled' : 'draft',
    });
  } catch (err: any) {
    console.error('[Brevo Campaign API Error]:', err);
    return NextResponse.json({
      error: err.message || 'Failed to process Brevo campaign.',
    }, { status: 500 });
  }
}

