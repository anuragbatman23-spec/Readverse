import { NextResponse } from 'next/server';
import { downloadEpubFromAdminDrive } from '@/lib/gdriveStorage';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId || typeof fileId !== 'string') {
      return NextResponse.json({ error: 'fileId query parameter is required' }, { status: 400 });
    }

    const { buffer, contentType } = await downloadEpubFromAdminDrive(fileId);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType || 'application/epub+zip',
        'Content-Disposition': `inline; filename="book_${fileId}.epub"`,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/books/gdrive/read:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to download EPUB from Google Drive storage' },
      { status: 500 }
    );
  }
}
