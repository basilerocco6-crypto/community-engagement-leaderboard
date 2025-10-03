import { NextRequest, NextResponse } from 'next/server';
import { TierSystem } from '@/lib/tier-system';
import { TierName } from '@/lib/types/engagement';

// GET endpoint to fetch tier distribution statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier') as TierName | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (tier) {
      // Get users in a specific tier
      const users = await TierSystem.getUsersByTier(tier, limit, offset);
      
      return NextResponse.json({
        success: true,
        tier: tier,
        users: users,
        pagination: {
          limit,
          offset,
          hasMore: users.length === limit
        }
      });
    } else {
      // Get overall tier distribution
      const distribution = await TierSystem.getTierDistribution();
      
      return NextResponse.json({
        success: true,
        tier_distribution: distribution,
        total_users: Object.values(distribution).reduce((sum, count) => sum + count, 0)
      });
    }

  } catch (error) {
    console.error('Error fetching tier distribution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tier distribution' },
      { status: 500 }
    );
  }
}
