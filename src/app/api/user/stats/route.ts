import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { findUserByEmail, findUserById, getUserStats, updateUserStats, createUser } from '@/lib/userDb';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const userQuery = searchParams.get('user') || session?.user?.email;

    if (!userQuery) {
      return NextResponse.json({
        success: true,
        stats: {
          points: 0,
          totalChaptersRead: 0,
          totalWordsRead: 0,
          readingMinutes: 0,
          currentStreakDays: 1
        }
      });
    }

    const stats = getUserStats(userQuery);
    if (!stats) {
      return NextResponse.json({
        success: true,
        stats: {
          points: 0,
          totalChaptersRead: 0,
          totalWordsRead: 0,
          readingMinutes: 0,
          currentStreakDays: 1
        }
      });
    }

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Error in GET /api/user/stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const userEmail = body.userEmail || session?.user?.email;

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Authentication or user email required.' },
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

    // Anti-tamper guard: Prevent arbitrary positive points injection via direct API calls
    if (typeof body.pointsDelta === 'number' && body.pointsDelta > 10) {
      return NextResponse.json(
        { success: false, error: 'Direct points manipulation blocked. Reading points must be earned through verified reading sessions.' },
        { status: 403 }
      );
    }
    if (typeof body.points === 'number' && body.points > (user.points || 0)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized override of user balance.' },
        { status: 403 }
      );
    }

    const updatedUser = updateUserStats(user.id, body);

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'Failed to update user stats.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stats: {
        points: updatedUser.points,
        totalChaptersRead: updatedUser.totalChaptersRead,
        totalWordsRead: updatedUser.totalWordsRead,
        readingMinutes: updatedUser.readingMinutes,
        currentStreakDays: updatedUser.currentStreakDays
      }
    });
  } catch (error) {
    console.error('Error in POST /api/user/stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while updating stats' },
      { status: 500 }
    );
  }
}
