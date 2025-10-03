import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TierSystem } from '@/lib/tier-system';

// GET endpoint to fetch user's current tier information
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
    const includeHistory = searchParams.get('includeHistory') === 'true';
    const historyLimit = parseInt(searchParams.get('historyLimit') || '10');

    // Get tier information
    const tierInfo = await TierSystem.getUserTierInfo(userId);

    if (!tierInfo) {
      return NextResponse.json(
        { error: 'User tier information not found' },
        { status: 404 }
      );
    }

    let tierHistory = undefined;
    if (includeHistory) {
      const historyResult = await TierSystem.getTierHistory(userId, historyLimit, 0);
      tierHistory = historyResult.history;
    }

    return NextResponse.json({
      success: true,
      tier_info: tierInfo,
      tier_history: tierHistory
    });

  } catch (error) {
    console.error('Error fetching user tier:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user tier information' },
      { status: 500 }
    );
  }
}
