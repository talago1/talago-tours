import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

let cachedBotUsername: string | null = null;

export async function GET() {
  try {
    const envUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || process.env.TELEGRAM_BOT_USERNAME;
    if (envUsername) {
      return NextResponse.json({
        configured: true,
        botUsername: envUsername.replace(/^@/, ''),
      });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({
        configured: false,
        botUsername: null,
        message: 'TELEGRAM_BOT_TOKEN is not configured.',
      });
    }

    if (cachedBotUsername) {
      return NextResponse.json({
        configured: true,
        botUsername: cachedBotUsername,
      });
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await res.json();

    if (data.ok && data.result?.username) {
      cachedBotUsername = data.result.username;
      return NextResponse.json({
        configured: true,
        botUsername: data.result.username,
      });
    }

    return NextResponse.json({
      configured: false,
      botUsername: null,
      message: 'Could not fetch bot information from Telegram API.',
    });
  } catch (err: any) {
    return NextResponse.json({
      configured: false,
      botUsername: null,
      error: err?.message || 'Failed to inspect Telegram configuration.',
    });
  }
}

