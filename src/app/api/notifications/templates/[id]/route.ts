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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const { id } = params;

    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTINGS_KEY },
    });
    const templates = parseTemplates(setting?.value ?? null);

    const index = templates.findIndex((t) => t.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    templates[index] = {
      ...templates[index],
      subject: body.subject ?? templates[index].subject,
      body: body.body ?? templates[index].body,
      updatedAt: new Date().toISOString(),
    };

    await prisma.systemSetting.upsert({
      where: { key: SETTINGS_KEY },
      create: { key: SETTINGS_KEY, value: JSON.stringify(templates) },
      update: { value: JSON.stringify(templates) },
    });

    return NextResponse.json(templates[index]);
  } catch {
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}
