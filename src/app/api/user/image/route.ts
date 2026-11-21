import { NextResponse } from 'next/server';
import { getStorageMedia } from '@/lib/d1Client';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_\-]+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid or missing image ID' }, { status: 400 });
    }

    // 1. Fetch media from Cloudflare D1
    const media = await getStorageMedia(id);
    if (media && media.buffer && media.buffer.length > 0) {
      return new NextResponse(new Uint8Array(media.buffer), {
        status: 200,
        headers: {
          'Content-Type': media.contentType || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 2. Fallback check local filesystem if present (e.g. local dev uploads)
    const possibleDirs = [
      path.join(process.cwd(), 'public', 'uploads', 'banners'),
      path.join(process.cwd(), 'public', 'uploads', 'avatars'),
      path.join(process.cwd(), 'public', 'uploads', 'overview-bg'),
    ];

    for (const dir of possibleDirs) {
      for (const ext of ['.jpg', '.jpeg', '.png', '.webp', '.gif']) {
        const filePath = path.join(dir, `${id}${ext}`);
        try {
          if (fs.existsSync(filePath)) {
            const fileBuffer = fs.readFileSync(filePath);
            const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
            return new NextResponse(new Uint8Array(fileBuffer), {
              status: 200,
              headers: {
                'Content-Type': mime,
                'Cache-Control': 'public, max-age=31536000, immutable',
              },
            });
          }
        } catch {}
      }
    }

    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  } catch (error) {
    console.error('[Image API] Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve image' }, { status: 500 });
  }
}
