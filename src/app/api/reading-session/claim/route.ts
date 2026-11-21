import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { findUserByEmail, findUserById } from '@/lib/userDb';
import { verifyAndClaimReadingSession } from '@/lib/readingSessionDb';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const userEmail = session?.user?.email || body.userEmail;
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to claim points.' },
        { status: 401 }
      );
    }

    const user = findUserByEmail(userEmail) || findUserById(userEmail);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User account not found.' },
        { status: 404 }
      );
    }

    const { sessionId, sessionToken, proof, customPoints } = body;

    if (!sessionId || !sessionToken || !proof) {
      return NextResponse.json(
        { success: false, error: 'Missing sessionId, sessionToken, or interaction proof.' },
        { status: 400 }
      );
    }

    const result = verifyAndClaimReadingSession({
      userId: user.id,
      userEmail: user.email,
      sessionId,
      sessionToken,
      proof: {
        activeReadingSeconds: Number(proof.activeReadingSeconds || 0),
        qualifiedFocusSeconds: typeof proof.qualifiedFocusSeconds === 'number' ? proof.qualifiedFocusSeconds : undefined,
        coveragePercent: typeof proof.coveragePercent === 'number' ? proof.coveragePercent : undefined,
        scrollDepthPercent: typeof proof.scrollDepthPercent === 'number' ? proof.scrollDepthPercent : undefined,
        pagesTurned: typeof proof.pagesTurned === 'number' ? proof.pagesTurned : undefined,
        interactionCount: Number(proof.interactionCount || 0),
        totalChunksEncountered: typeof proof.totalChunksEncountered === 'number' ? proof.totalChunksEncountered : undefined,
        calculatedRequiredSeconds: typeof proof.calculatedRequiredSeconds === 'number' ? proof.calculatedRequiredSeconds : undefined,
        verifiedSlicesCount: typeof proof.verifiedSlicesCount === 'number' ? proof.verifiedSlicesCount : undefined,
        totalChapterSlices: typeof proof.totalChapterSlices === 'number' ? proof.totalChapterSlices : undefined
      },
      customPoints: typeof customPoints === 'number' ? customPoints : undefined
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, code: result.code, error: result.error },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      pointsAwarded: result.pointsAwarded,
      stats: result.stats
    });
  } catch (error: unknown) {
    console.error('Error claiming reading session points:', error);
    const message = error instanceof Error ? error.message : 'Failed to verify and claim points.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
