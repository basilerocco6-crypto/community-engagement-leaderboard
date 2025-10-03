import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { RewardSystem } from '@/lib/reward-system';
import { UpdateRewardConfigRequest } from '@/lib/types/engagement';

// PUT - Update reward configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // TODO: Add admin role check here
    // const isAdmin = await checkAdminRole(userId);
    // if (!isAdmin) {
    //   return NextResponse.json(
    //     { error: 'Admin access required' },
    //     { status: 403 }
    //   );
    // }

    const body: UpdateRewardConfigRequest = await request.json();
    const rewardConfig = await RewardSystem.updateRewardConfiguration(params.id, body);

    return NextResponse.json({
      success: true,
      reward_configuration: rewardConfig
    });

  } catch (error) {
    console.error('Error updating reward configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update reward configuration' },
      { status: 500 }
    );
  }
}

// DELETE - Delete reward configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // TODO: Add admin role check here
    // const isAdmin = await checkAdminRole(userId);
    // if (!isAdmin) {
    //   return NextResponse.json(
    //     { error: 'Admin access required' },
    //     { status: 403 }
    //   );
    // }

    await RewardSystem.deleteRewardConfiguration(params.id);

    return NextResponse.json({
      success: true,
      message: 'Reward configuration deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting reward configuration:', error);
    return NextResponse.json(
      { error: 'Failed to delete reward configuration' },
      { status: 500 }
    );
  }
}
