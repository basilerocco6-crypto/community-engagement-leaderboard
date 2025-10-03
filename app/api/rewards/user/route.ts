import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { RewardSystem } from '@/lib/reward-system';

// GET - Fetch user's unlocked rewards
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
    const communityId = searchParams.get('community_id') || 'default';

    const { unlockedRewards, availableRewards, totalUnlocked } = await RewardSystem.getUserRewards(
      userId,
      communityId
    );

    return NextResponse.json({
      success: true,
      user_rewards: unlockedRewards,
      available_rewards: availableRewards,
      total_unlocked: totalUnlocked
    });

  } catch (error) {
    console.error('Error fetching user rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user rewards' },
      { status: 500 }
    );
  }
}
