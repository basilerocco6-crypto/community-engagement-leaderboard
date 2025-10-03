import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  getUserRewards, 
  checkAndUnlockRewards, 
  claimReward,
  getRewards 
} from '@/lib/engagement';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'user'; // 'user' or 'all'
    
    if (type === 'all') {
      // Get all available rewards
      const rewards = await getRewards();
      return NextResponse.json({
        success: true,
        rewards
      });
    }

    // Get user rewards
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRewards = await getUserRewards(userId);

    return NextResponse.json({
      success: true,
      rewards: userRewards
    });

  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, rewardId } = body;

    if (action === 'check') {
      // Check and unlock new rewards
      const newRewards = await checkAndUnlockRewards(userId);
      
      return NextResponse.json({
        success: true,
        newRewards,
        count: newRewards.length
      });
    }

    if (action === 'claim') {
      if (!rewardId) {
        return NextResponse.json(
          { error: 'Reward ID is required for claiming' },
          { status: 400 }
        );
      }

      const success = await claimReward(userId, rewardId);
      
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to claim reward' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Reward claimed successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing reward action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

