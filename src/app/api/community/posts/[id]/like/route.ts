import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { toggleLikePost } from '@/lib/communityDb';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json().catch(() => ({}));
    const userIdentifier = session?.user?.email || session?.user?.id || body.userId;

    if (!userIdentifier) {
      return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 });
    }

    const { post, hasLiked } = toggleLikePost(params.id, userIdentifier);

    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      hasLiked,
      likes: post.likes
    });
  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json({ success: false, error: 'Failed to toggle like' }, { status: 500 });
  }
}
