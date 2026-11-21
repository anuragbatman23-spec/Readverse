import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { findUserByEmail, findUserById, findUserByAny, createUser, updateUser } from '@/lib/userDb';
import { evaluateBadges, recordBadgeEvent, BadgeEvent } from '@/lib/badgeManager';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const userQuery = searchParams.get('user') || session?.user?.email;

    if (!userQuery) {
      return NextResponse.json({
        success: true,
        badges: evaluateBadges({
          id: 'guest',
          name: 'Guest',
          email: '',
          provider: 'credentials',
          points: 0,
          totalChaptersRead: 0,
          totalWordsRead: 0,
          readingMinutes: 0,
          currentStreakDays: 1,
          createdAt: new Date().toISOString()
        }),
        unlockedCount: 0
      });
    }

    let user = findUserByEmail(userQuery) || findUserById(userQuery) || findUserByAny(userQuery);
    if (!user) {
      user = createUser({
        name: session?.user?.name || userQuery.split('@')[0],
        email: userQuery,
        image: session?.user?.image || '',
        provider: 'google'
      });
    }

    const badges = evaluateBadges(user);
    const validUnlockedIds = badges.filter(b => b.unlocked).map(b => b.id);
    const unlockedCount = validUnlockedIds.length;

    // Keep stored unlockedBadges strictly in sync with accurate evaluation
    if (JSON.stringify(user.unlockedBadges || []) !== JSON.stringify(validUnlockedIds)) {
      updateUser(user.id, { unlockedBadges: validUnlockedIds });
    }

    return NextResponse.json({
      success: true,
      badges,
      unlockedCount,
      unlockedBadges: validUnlockedIds,
      badgeProgress: user.badgeProgress
    });
  } catch (error) {
    console.error('Error in GET /api/user/badges:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const userEmail = body.userEmail || session?.user?.email;
    const event = body.event as BadgeEvent;

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Authentication or user email required.' },
        { status: 401 }
      );
    }

    if (!event || !event.type) {
      return NextResponse.json(
        { success: false, error: 'Valid badge event is required.' },
        { status: 400 }
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

    const result = recordBadgeEvent(user.id, event);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to record badge event.' },
        { status: 500 }
      );
    }

    const allBadges = evaluateBadges(result.user);

    return NextResponse.json({
      success: true,
      badges: allBadges,
      unlockedCount: allBadges.filter(b => b.unlocked).length,
      newlyUnlocked: result.newlyUnlocked,
      badgeProgress: result.user.badgeProgress
    });
  } catch (error) {
    console.error('Error in POST /api/user/badges:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while processing badge event.' },
      { status: 500 }
    );
  }
}
