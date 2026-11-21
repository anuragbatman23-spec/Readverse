import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllPosts, createNewPost } from '@/lib/communityDb';
import { recordBadgeEvent } from '@/lib/badgeManager';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').toLowerCase().trim();
    const scope = searchParams.get('scope') || 'Global';
    const userIdentifier = searchParams.get('user') || '';

    let posts = getAllPosts();

    // Filter by search query if present
    if (search) {
      posts = posts.filter(
        p =>
          p.content.toLowerCase().includes(search) ||
          p.userName.toLowerCase().includes(search) ||
          (p.bookTitle && p.bookTitle.toLowerCase().includes(search))
      );
    }

    // Attach hasLiked indicator for requesting user
    const formatted = posts.map(p => ({
      ...p,
      hasLiked: userIdentifier ? (p.likedBy || []).includes(userIdentifier) : false
    }));

    return NextResponse.json({ success: true, posts: formatted });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const content = (body.content || '').trim();
    if (!content && !body.mediaUrl && !body.quoteText) {
      return NextResponse.json({ success: false, error: 'Post cannot be empty' }, { status: 400 });
    }

    const userId = session?.user?.id || session?.user?.email || body.userId || `guest_${Date.now()}`;
    const userName = session?.user?.name || body.userName || 'Anonymous Reader';
    const userAvatar = session?.user?.image || body.userAvatar || '/community/avatar-pegasus.jpg';

    const newPost = createNewPost({
      userId,
      userName,
      userAvatar,
      userTitle: body.userTitle || 'Verified Reader ✨',
      bookTitle: body.bookTitle || undefined,
      bookCategory: body.bookCategory || undefined,
      chapterNumber: body.chapterNumber || undefined,
      content,
      type: body.type || (body.mediaUrl ? 'panel' : body.quoteText ? 'quote' : 'discussion'),
      mediaUrl: body.mediaUrl || undefined,
      quoteText: body.quoteText || undefined,
      isSpoiler: Boolean(body.isSpoiler),
      spoilerChapter: body.spoilerChapter || undefined
    });

    // Record review / community post activity for badges
    try {
      recordBadgeEvent(userId, { type: 'publish_review', bookId: body.bookTitle });
    } catch (bErr) {
      console.warn('Failed recording badge progress on post:', bErr);
    }

    return NextResponse.json({ success: true, post: { ...newPost, hasLiked: false } }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ success: false, error: 'Failed to create post' }, { status: 500 });
  }
}
