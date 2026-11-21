import { NextResponse } from 'next/server';
import { getStorageMedia, queryD1 } from '@/lib/d1Client';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const isDebug = searchParams.get('debug') === '1';

    if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_\-]+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid or missing image ID' }, { status: 400 });
    }

    // 1. Fetch media from Cloudflare D1
    let d1Error: any = null;
    let media = null;
    let rawRows: any = null;
    try {
      rawRows = await queryD1('SELECT content_type, data FROM storage_objects WHERE key = ? LIMIT 1', [id]);
      if (rawRows && rawRows.length > 0 && rawRows[0].data) {
        media = {
          contentType: rawRows[0].content_type || 'image/jpeg',
          buffer: Buffer.from(rawRows[0].data, 'base64')
        };
      }
    } catch (err: any) {
      d1Error = err?.message || String(err);
      console.error('[Image API] D1 lookup error:', err);
    }

    if (media && media.buffer && media.buffer.length > 0) {
      return new NextResponse(new Uint8Array(media.buffer), {
        status: 200,
        headers: {
          'Content-Type': media.contentType || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    if (isDebug) {
      return NextResponse.json({
        error: 'Image not found',
        id,
        rawRowsCount: rawRows ? rawRows.length : null,
        rawRowKeys: rawRows && rawRows[0] ? Object.keys(rawRows[0]) : null,
        mediaFound: Boolean(media),
        d1Error,
        hasEnvToken: Boolean(process.env.CLOUDFLARE_API_TOKEN)
      }, { status: 404 });
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
