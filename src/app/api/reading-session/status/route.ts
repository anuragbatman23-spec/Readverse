import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasUserClaimedChapter } from '@/lib/readingSessionDb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);

    const userEmail = searchParams.get('user') || session?.user?.email;
    const bookId = searchParams.get('bookId');
    const chapterId = searchParams.get('chapterId');

    if (!userEmail || !bookId || chapterId === null || chapterId === undefined) {
      return NextResponse.json({
        success: true,
        claimed: false
      });
    }

    const claimed = hasUserClaimedChapter(userEmail, bookId, chapterId);

    return NextResponse.json({
      success: true,
      claimed
    });
  } catch (error: unknown) {
    console.error('Error in GET /api/reading-session/status:', error);
    const message = error instanceof Error ? error.message : 'Failed to check chapter claim status';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
