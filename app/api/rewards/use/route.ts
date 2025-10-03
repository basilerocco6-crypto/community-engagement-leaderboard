import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { RewardSystem } from '@/lib/reward-system';

// POST - Mark a reward as used
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
    const { reward_config_id } = body;

    if (!reward_config_id) {
      return NextResponse.json(
        { error: 'reward_config_id is required' },
        { status: 400 }
      );
    }

    const success = await RewardSystem.useReward(userId, reward_config_id);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Reward marked as used successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Reward not found or already used' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error using reward:', error);
    return NextResponse.json(
      { error: 'Failed to use reward' },
      { status: 500 }
    );
  }
}
