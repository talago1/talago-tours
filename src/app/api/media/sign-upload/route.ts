import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import crypto from 'crypto';

const BUCKET = 'talago-tour-media';
const ALLOWED_EXTENSIONS = ['webp', 'jpg', 'jpeg', 'png', 'gif'];

export async function POST(request: NextRequest) {
  try {
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'Missing filename or contentType' },
        { status: 400 }
      );
    }

    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: 'Invalid file extension' },
        { status: 400 }
      );
    }

    const uniqueKey = `tours/${crypto.randomUUID()}.webp`;

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(uniqueKey);

    if (error || !data) {
      console.error('Signed URL generation failed:', error);
      return NextResponse.json(
        { error: 'Failed to generate signed upload URL' },
        { status: 500 }
      );
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${uniqueKey}`;

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path: data.path,
      token: data.token,
      publicUrl,
    });
  } catch (error) {
    console.error('Sign upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
