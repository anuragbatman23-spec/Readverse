import { NextResponse } from 'next/server';
import { getAllCommunityUsers, toggleFollowUser, getUserFollowedIds, getUserFollowersCount } from '@/lib/communityDb';
import { recordBadgeEvent } from '@/lib/badgeManager';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get('user') || '';
    const search = (searchParams.get('search') || '').toLowerCase().trim();

    let users = getAllCommunityUsers(user);

    if (search) {
      users = users.filter(
        u =>
          u.name.toLowerCase().includes(search) ||
          (u.title && u.title.toLowerCase().includes(search)) ||
          (u.email && u.email.toLowerCase().includes(search))
      );
    }

    const followedUserIds = user ? getUserFollowedIds(user) : [];
    const followersCount = user ? getUserFollowersCount(user) : 0;
    const followingCount = followedUserIds.length;

    return NextResponse.json({
      success: true,
      users,
      followedUserIds,
      followersCount,
      followingCount
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, followerId, targetUserId } = body;

    if (action === 'toggle_follow') {
      if (!followerId || !targetUserId) {
        return NextResponse.json(
          { success: false, error: 'followerId and targetUserId are required' },
          { status: 400 }
        );
      }

      if (followerId === targetUserId) {
        return NextResponse.json(
          { success: false, error: 'Cannot follow yourself' },
          { status: 400 }
        );
      }

      const result = toggleFollowUser(followerId, targetUserId);

      if (result.isFollowing) {
        try {
          recordBadgeEvent(followerId, { type: 'follow_author', authorId: targetUserId });
        } catch (bErr) {
          console.warn('Failed recording badge progress on follow:', bErr);
        }
      }

      return NextResponse.json({
        success: true,
        ...result,
        targetUserId
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in user follows API:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
