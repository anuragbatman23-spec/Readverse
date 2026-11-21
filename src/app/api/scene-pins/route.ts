import { NextRequest, NextResponse } from 'next/server';
import { getScenePins, addCommentToSpot, toggleLikeComment } from '@/lib/scenePinsDb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get('bookId');
    const chapterKey = searchParams.get('chapterKey');
    const userEmail = searchParams.get('userEmail') || undefined;

    if (!bookId || !chapterKey) {
      return NextResponse.json(
        { success: false, error: 'bookId and chapterKey are required parameters.' },
        { status: 400 }
      );
    }

    const pins = getScenePins(bookId, chapterKey, userEmail);
    return NextResponse.json({ success: true, pins });
  } catch (error) {
    console.error('Error fetching scene pins:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scene pins.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, bookId, chapterKey } = body;

    if (!bookId || !chapterKey) {
      return NextResponse.json(
        { success: false, error: 'bookId and chapterKey are required fields.' },
        { status: 400 }
      );
    }

    if (action === 'add') {
      const { panelIndex, yPercent, text, author, avatarUrl, userEmail, userId } = body;
      if (typeof panelIndex !== 'number' || typeof yPercent !== 'number' || !text || !text.trim()) {
        return NextResponse.json(
          { success: false, error: 'panelIndex, yPercent, and text are required for add action.' },
          { status: 400 }
        );
      }

      const result = addCommentToSpot({
        bookId,
        chapterKey,
        panelIndex,
        yPercent,
        text,
        author: author || 'reader',
        avatarUrl,
        userEmail,
        userId
      });

      return NextResponse.json({
        success: true,
        spot: result.spot,
        pins: result.allSpots
      });
    }

    if (action === 'like') {
      const { spotId, commentId, userEmail } = body;
      if (!spotId || !commentId) {
        return NextResponse.json(
          { success: false, error: 'spotId and commentId are required for like action.' },
          { status: 400 }
        );
      }

      const result = toggleLikeComment({
        bookId,
        chapterKey,
        spotId,
        commentId,
        userEmail
      });

      return NextResponse.json({
        success: true,
        spot: result.spot,
        pins: result.allSpots
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Must be "add" or "like".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error handling scene pins post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process scene pin update.' },
      { status: 500 }
    );
  }
}
