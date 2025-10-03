import { NextRequest, NextResponse } from 'next/server';
import { EngagementTracker } from '@/lib/engagement-core';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeUserPosition = searchParams.get('includeUserPosition') === 'true';

    // Get leaderboard data
    const leaderboard = await EngagementTracker.getLeaderboard(limit, offset);

    let userPosition = null;
    if (includeUserPosition) {
      const cookieStore = await cookies();
      const userId = cookieStore.get('user_id')?.value;
      
      if (userId) {
        userPosition = await EngagementTracker.getUserRank(userId);
      }
    }

    return NextResponse.json({
      success: true,
      leaderboard,
      userPosition,
      pagination: {
        limit,
        offset,
        total_count: leaderboard.length,
        hasMore: leaderboard.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

