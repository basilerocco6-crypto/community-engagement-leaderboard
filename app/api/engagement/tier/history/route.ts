import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TierSystem } from '@/lib/tier-system';

// GET endpoint to fetch user's tier change history
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get tier change history
    const { history, totalCount } = await TierSystem.getTierHistory(userId, limit, offset);

    return NextResponse.json({
      success: true,
      tier_history: history,
      pagination: {
        limit,
        offset,
        total_count: totalCount,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching tier history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tier history' },
      { status: 500 }
    );
  }
}
