import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { findUserByEmail, findUserById, createUser } from '@/lib/userDb';
import { startReadingSession } from '@/lib/readingSessionDb';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const userEmail = session?.user?.email || body.userEmail;
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Authentication or user email required to start reading session.' },
        { status: 401 }
      );
    }

    let user = findUserByEmail(userEmail) || findUserById(userEmail);
    if (!user) {
      user = createUser({
        name: session?.user?.name || userEmail.split('@')[0],
        email: userEmail,
        image: session?.user?.image || '',
        provider: 'google'
      });
    }

    const { bookId, chapterId, chapterTitle, category, pageCount, wordCount } = body;

    if (!bookId || chapterId === undefined || chapterId === null) {
      return NextResponse.json(
        { success: false, error: 'bookId and chapterId are required.' },
        { status: 400 }
      );
    }

    const sessionData = startReadingSession({
      userId: user.id,
      userEmail: user.email,
      bookId: String(bookId),
      chapterId: String(chapterId),
      chapterTitle: chapterTitle || '',
      category: category || 'manga',
      pageCount: typeof pageCount === 'number' ? pageCount : undefined,
      wordCount: typeof wordCount === 'number' ? wordCount : undefined
    });

    return NextResponse.json({
      success: true,
      ...sessionData
    });
  } catch (error: unknown) {
    console.error('Error starting reading session:', error);
    const message = error instanceof Error ? error.message : 'Failed to initialize reading session.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
