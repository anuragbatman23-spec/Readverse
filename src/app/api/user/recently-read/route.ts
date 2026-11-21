import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getRecentlyRead, addRecentlyRead, findUserByEmail, createUser } from '@/lib/userDb';
import { recordBadgeEvent } from '@/lib/badgeManager';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('user') || session?.user?.email;

    if (!userEmail) {
      return NextResponse.json({ success: true, recentlyRead: [] });
    }

    const recentlyRead = getRecentlyRead(userEmail);
    return NextResponse.json({ success: true, recentlyRead });
  } catch (error) {
    console.error('Error fetching recently read:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recently read' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { userEmail: emailFromBody, item } = body;

    const userEmail = emailFromBody || session?.user?.email;

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'User email is required to sync recently read books' },
        { status: 401 }
      );
    }

    if (!item || !item.bookId) {
      return NextResponse.json(
        { success: false, error: 'Valid book item is required' },
        { status: 400 }
      );
    }

    // Ensure user exists in userDb (e.g. if they just logged in with Google)
    let user = findUserByEmail(userEmail);
    if (!user) {
      user = createUser({
        name: session?.user?.name || userEmail.split('@')[0],
        email: userEmail,
        image: session?.user?.image || '',
        provider: 'google'
      });
    }

    const recentlyReadItem = {
      bookId: item.bookId,
      title: item.title || 'Untitled',
      author: item.author || 'Unknown',
      category: item.category || 'manga',
      coverImage: item.coverImage || '',
      chapterIndex: item.chapterIndex || 0,
      chapterTitle: item.chapterTitle,
      lastReadAt: new Date().toISOString(),
      progressPercent: item.progressPercent,
      rating: item.rating
    };

    const updatedList = addRecentlyRead(userEmail, recentlyReadItem);

    // Record reading event and rating for badges
    try {
      const isLastChapter = Boolean(
        item.isFinale ||
        (typeof item.totalChapters === 'number' && item.totalChapters > 0 && item.chapterIndex >= item.totalChapters - 1)
      );

      recordBadgeEvent(userEmail, {
        type: 'read_chapter',
        category: item.category,
        genre: item.genre,
        seriesId: item.bookId,
        isFinale: isLastChapter
      });

      if (isLastChapter || item.isCompleted || (typeof item.progressPercent === 'number' && item.progressPercent >= 100)) {
        recordBadgeEvent(userEmail, {
          type: 'complete_series',
          seriesId: item.bookId
        });
      }

      if (typeof item.rating === 'number' && item.rating > 0) {
        recordBadgeEvent(userEmail, {
          type: 'rate_title',
          bookId: item.bookId,
          rating: item.rating
        });
      }
    } catch (bErr) {
      console.warn('Failed recording badge progress on recently-read:', bErr);
    }

    return NextResponse.json({
      success: true,
      recentlyRead: updatedList
    });
  } catch (error) {
    console.error('Error saving recently read:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save recently read' },
      { status: 500 }
    );
  }
}
