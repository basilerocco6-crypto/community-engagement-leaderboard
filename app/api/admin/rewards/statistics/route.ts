import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { RewardSystem } from '@/lib/reward-system';

// GET - Fetch reward statistics for admin dashboard
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

    const statistics = await RewardSystem.getRewardStatistics(communityId);

    return NextResponse.json({
      success: true,
      statistics
    });

  } catch (error) {
    console.error('Error fetching reward statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reward statistics' },
      { status: 500 }
    );
  }
}
