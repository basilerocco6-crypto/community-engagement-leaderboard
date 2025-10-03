import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { RewardSystem } from '@/lib/reward-system';
import { CreateRewardConfigRequest, UpdateRewardConfigRequest } from '@/lib/types/engagement';

// GET - Fetch reward configurations
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

    // TODO: Add admin role check here
    // const isAdmin = await checkAdminRole(userId);
    // if (!isAdmin) {
    //   return NextResponse.json(
    //     { error: 'Admin access required' },
    //     { status: 403 }
    //   );
    // }

    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('community_id') || 'default';
    const tierName = searchParams.get('tier_name') || undefined;
    const rewardType = searchParams.get('reward_type') || undefined;
    const isActive = searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined;

    const { configurations, totalCount } = await RewardSystem.getRewardConfigurations({
      community_id: communityId,
      tier_name: tierName,
      reward_type: rewardType as any,
      is_active: isActive
    });

    return NextResponse.json({
      success: true,
      reward_configurations: configurations,
      total_count: totalCount
    });

  } catch (error) {
    console.error('Error fetching reward configurations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reward configurations' },
      { status: 500 }
    );
  }
}

// POST - Create new reward configuration
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

    // TODO: Add admin role check here
    // const isAdmin = await checkAdminRole(userId);
    // if (!isAdmin) {
    //   return NextResponse.json(
    //     { error: 'Admin access required' },
    //     { status: 403 }
    //   );
    // }

    const body: CreateRewardConfigRequest = await request.json();

    // Validate the request
    const validation = RewardSystem.validateRewardConfiguration(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const rewardConfig = await RewardSystem.createRewardConfiguration(body);

    return NextResponse.json({
      success: true,
      reward_configuration: rewardConfig
    });

  } catch (error) {
    console.error('Error creating reward configuration:', error);
    return NextResponse.json(
      { error: 'Failed to create reward configuration' },
      { status: 500 }
    );
  }
}
