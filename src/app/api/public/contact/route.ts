import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 },
      );
    }

    // In production, this would send an email to the business or log to CRM.
    // For now, we acknowledge receipt.
    console.log('Contact form submission:', { name, email, message });

    return NextResponse.json({
      success: true,
      message: 'Your message has been received. Our concierge team will respond within 24 hours.',
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process your message' },
      { status: 500 },
    );
  }
}
