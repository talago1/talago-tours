import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { parseSettingValue, serializeSettingValue } from '@/lib/systemSettings';

// 5 partner submissions per IP per 10 minutes
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;
const SETTINGS_KEY = 'partner_applications';

export interface PartnerApplication {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  category: string;
  website?: string;
  fleetSize?: string;
  message: string;
  status: 'PENDING' | 'REVIEWED' | 'APPROVED' | 'DECLINED';
  createdAt: string;
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'partner-apply'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const body = await request.json();
    const {
      companyName,
      contactName,
      email,
      phone,
      country,
      city,
      category,
      website,
      fleetSize,
      message,
    } = body;

    if (!companyName || !contactName || !email || !phone || !country) {
      return NextResponse.json(
        { error: 'Company name, contact name, email, phone, and country are required.' },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const newApp: PartnerApplication = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      companyName: String(companyName).trim().slice(0, 150),
      contactName: String(contactName).trim().slice(0, 150),
      email: String(email).trim().toLowerCase().slice(0, 200),
      phone: String(phone).trim().slice(0, 50),
      country: String(country).trim().slice(0, 100),
      city: String(city || '').trim().slice(0, 100),
      category: String(category || 'General Tours').trim().slice(0, 100),
      website: website ? String(website).trim().slice(0, 200) : undefined,
      fleetSize: fleetSize ? String(fleetSize).trim().slice(0, 50) : undefined,
      message: String(message || '').trim().slice(0, 2000),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    // Load existing applications from DB
    const existingRecord = await prisma.systemSetting.findUnique({
      where: { key: SETTINGS_KEY },
    });

    const currentList: PartnerApplication[] = existingRecord
      ? parseSettingValue<PartnerApplication[]>(existingRecord.value, [])
      : [];

    const updatedList = [newApp, ...currentList].slice(0, 500); // retain last 500 applications

    await prisma.systemSetting.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: serializeSettingValue(updatedList),
      },
      update: {
        value: serializeSettingValue(updatedList),
      },
    });

    // Optional email notification if Resend is configured
    if (process.env.RESEND_API_KEY) {
      try {
        const { sendEmail } = await import('@/lib/email');
        const recipient = process.env.CONTACT_EMAIL || 'support@talago-tours.com';
        await sendEmail({
          to: recipient,
          subject: `New Partner Application: ${newApp.companyName} (${newApp.country})`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#fff;border-radius:8px;">
              <h2 style="color:#0284c7;margin-bottom:12px;">New Tour Supplier Application</h2>
              <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                <tr><td style="padding:6px 0;color:#666;width:35%;">Company:</td><td><strong>${newApp.companyName}</strong></td></tr>
                <tr><td style="padding:6px 0;color:#666;">Contact:</td><td>${newApp.contactName}</td></tr>
                <tr><td style="padding:6px 0;color:#666;">Location:</td><td>${newApp.city ? `${newApp.city}, ` : ''}${newApp.country}</td></tr>
                <tr><td style="padding:6px 0;color:#666;">Email:</td><td><a href="mailto:${newApp.email}">${newApp.email}</a></td></tr>
                <tr><td style="padding:6px 0;color:#666;">Phone/WA:</td><td>${newApp.phone}</td></tr>
                <tr><td style="padding:6px 0;color:#666;">Category:</td><td>${newApp.category}</td></tr>
              </table>
              <h3 style="color:#333;margin-top:16px;">Message / Services:</h3>
              <p style="background:#f4f4f5;padding:12px;border-radius:6px;color:#333;">${newApp.message || 'No additional message.'}</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.warn('[partner-apply] Resend email notice failed:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Your partner application has been submitted successfully. Our supplier onboarding team will reach out via WhatsApp or email within 24-48 hours.',
      applicationId: newApp.id,
    });
  } catch (err) {
    console.error('[partner-apply] error:', err);
    return NextResponse.json({ error: 'Failed to process application.' }, { status: 500 });
  }
}
