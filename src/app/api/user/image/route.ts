import { NextResponse } from 'next/server';
import { getStorageMedia, queryD1 } from '@/lib/d1Client';
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
    try {
      const rows = await queryD1<{ content_type: string; data: string }>(
        'SELECT content_type, data FROM storage_objects WHERE key = ? LIMIT 1',
        [id]
      );
      if (rows && rows.length > 0 && rows[0].data) {
        const buffer = Buffer.from(rows[0].data, 'base64');
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            'Content-Type': rows[0].content_type || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    } catch (err: any) {
      console.error('[Image API] D1 lookup error:', err);
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
