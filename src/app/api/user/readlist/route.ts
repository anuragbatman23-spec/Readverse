import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getReadlist, addReadlistItem, removeReadlistItem, findUserByEmail, createUser, ReadlistItem } from '@/lib/userDb';
import { recordBadgeEvent } from '@/lib/badgeManager';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('user') || session?.user?.email;

    if (!userEmail) {
      return NextResponse.json({ success: true, readlist: [] });
    }

    const readlist = getReadlist(userEmail);
    return NextResponse.json({ success: true, readlist });
  } catch (error) {
    console.error('Error fetching readlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch readlist' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { userEmail: emailFromBody, item, remove, bookId } = body;

    const userEmail = emailFromBody || session?.user?.email;

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'User email is required to sync readlist' },
        { status: 401 }
      );
    }

    // Ensure user exists in userDb
    let user = findUserByEmail(userEmail);
    if (!user) {
      user = createUser({
        name: session?.user?.name || userEmail.split('@')[0],
        email: userEmail,
        image: session?.user?.image || '',
        provider: 'google'
      });
    }

    if (remove) {
      const targetId = bookId || item?.bookId;
      if (!targetId) {
        return NextResponse.json({ success: false, error: 'bookId required for removal' }, { status: 400 });
      }
      const updatedList = removeReadlistItem(userEmail, targetId);
      return NextResponse.json({ success: true, readlist: updatedList });
    }

    if (!item || !item.bookId) {
      return NextResponse.json(
        { success: false, error: 'Valid book item is required' },
        { status: 400 }
      );
    }

    const readlistItem: ReadlistItem = {
      bookId: item.bookId,
      title: item.title || 'Untitled Book',
      author: item.author || 'Unknown Author',
      category: item.category || 'manga',
      coverImage: item.coverImage || '',
      rating: typeof item.rating === 'number' ? item.rating : 4.5,
      addedAt: item.addedAt || new Date().toISOString()
    };

    const updatedList = addReadlistItem(userEmail, readlistItem);

    // Track badge progress for library curation
    try {
      recordBadgeEvent(userEmail, {
        type: 'add_to_readlist',
        bookId: item.bookId,
        totalSaved: updatedList.length
      });
    } catch (bErr) {
      console.warn('Failed recording badge progress on readlist add:', bErr);
    }

    return NextResponse.json({
      success: true,
      readlist: updatedList
    });
  } catch (error) {
    console.error('Error saving readlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save readlist' },
      { status: 500 }
    );
  }
}
