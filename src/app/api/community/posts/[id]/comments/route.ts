import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCommentsForPost, addComment } from '@/lib/communityDb';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const comments = getCommentsForPost(params.id);
    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const content = (body.content || '').trim();
    if (!content) {
      return NextResponse.json({ success: false, error: 'Comment content cannot be empty' }, { status: 400 });
    }

    const userId = session?.user?.id || session?.user?.email || body.userId || `guest_${Date.now()}`;
    const userName = session?.user?.name || body.userName || 'Anonymous Reader';
    const userAvatar = session?.user?.image || body.userAvatar || '/community/avatar-pegasus.jpg';

    const comment = addComment(params.id, {
      userId,
      userName,
      userAvatar,
      content,
      parentId: body.parentId || undefined
    });

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ success: false, error: 'Failed to add comment' }, { status: 500 });
  }
}
