import { NextResponse } from 'next/server';

// Helper to convert Google Drive, Dropbox, and cloud storage share links into direct binary download links
function normalizeCloudStorageUrl(rawUrl: string): string {
  const url = rawUrl.trim();

  // 1. Google Drive share links
  // e.g. https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing
  // or https://drive.google.com/open?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
  const gdriveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (gdriveMatch && (url.includes('drive.google.com') || url.includes('docs.google.com'))) {
    const fileId = gdriveMatch[1];
    return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  }

  // 2. Dropbox share links
  // e.g. https://www.dropbox.com/s/xyz/book.epub?dl=0 -> dl=1
  if (url.includes('dropbox.com')) {
    return url.replace(/[?&]dl=0/, '?dl=1');
  }

  return url;
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    const downloadUrl = normalizeCloudStorageUrl(url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout for cloud storage

    const res = await fetch(downloadUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/epub+zip,application/octet-stream,*/*'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Remote storage returned HTTP status ${res.status}. If using Google Drive, make sure "Anyone with the link can view" is enabled.` },
        { status: 502 }
      );
    }

    const arrayBuffer = await res.arrayBuffer();

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/epub+zip',
        'Content-Disposition': 'attachment; filename="book.epub"'
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Could not fetch remote EPUB: ${message}. If using Google Drive, check link sharing permissions.` },
      { status: 500 }
    );
  }
}
