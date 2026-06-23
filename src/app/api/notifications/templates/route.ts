import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Template {
  id: string;
  channel: 'WHATSAPP' | 'EMAIL';
  subject: string | null;
  body: string;
  updatedAt: string;
}

const SETTINGS_KEY = 'notification_templates';

function parseTemplates(value: string | null): Template[] {
  if (!value) return [];
  try {
    return JSON.parse(value) as Template[];
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTINGS_KEY },
    });
    const templates = parseTemplates(setting?.value ?? null);
    return NextResponse.json(templates);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const incoming: { channel: 'WHATSAPP' | 'EMAIL'; subject?: string; body: string }[] = body.templates;

    if (!Array.isArray(incoming) || incoming.length === 0) {
      return NextResponse.json({ error: 'No templates provided' }, { status: 400 });
    }

    const existing = parseTemplates(
      (await prisma.systemSetting.findUnique({ where: { key: SETTINGS_KEY } }))?.value ?? null,
    );

    const now = new Date().toISOString();
    const newTemplates: Template[] = incoming.map((t) => ({
      id: crypto.randomUUID(),
      channel: t.channel,
      subject: t.subject ?? null,
      body: t.body,
      updatedAt: now,
    }));

    const merged = [...existing, ...newTemplates];

    await prisma.systemSetting.upsert({
      where: { key: SETTINGS_KEY },
      create: { key: SETTINGS_KEY, value: JSON.stringify(merged) },
      update: { value: JSON.stringify(merged) },
    });

    return NextResponse.json(newTemplates, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to save templates' }, { status: 500 });
  }
}
