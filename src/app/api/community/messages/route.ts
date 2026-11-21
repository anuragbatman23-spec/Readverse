import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMessagesBetween, sendDirectMessage } from '@/lib/communityDb';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get('with') || '';
    const currentUserId = session?.user?.email || session?.user?.id || searchParams.get('me') || '';

    if (!otherUserId || !currentUserId) {
      return NextResponse.json({ success: true, messages: [] });
    }

    const messages = getMessagesBetween(currentUserId, otherUserId);
    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const content = (body.content || '').trim();
    const recipientId = body.recipientId;

    if (!content || !recipientId) {
      return NextResponse.json({ success: false, error: 'Recipient and content are required' }, { status: 400 });
    }

    const senderId = session?.user?.email || session?.user?.id || body.senderId || 'guest_user';
    const senderName = session?.user?.name || body.senderName || 'Anonymous';
    const senderAvatar = session?.user?.image || body.senderAvatar || '/community/avatar-pegasus.jpg';

    const message = sendDirectMessage({
      senderId,
      senderName,
      senderAvatar,
      recipientId,
      content
    });

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}
