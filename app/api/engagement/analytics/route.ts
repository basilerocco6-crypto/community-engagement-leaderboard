import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  getUserEngagementAnalytics,
  getUserActivitySummary,
  getUserTiers,
  getActivityTypesByCategory 
} from '@/lib/engagement';

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
    const type = searchParams.get('type') || 'overview';

    if (type === 'overview') {
      // Get comprehensive analytics
      const analytics = await getUserEngagementAnalytics(userId);
      
      return NextResponse.json({
        success: true,
        analytics
      });
    }

    if (type === 'activity-summary') {
      // Get activity summary
      const summary = await getUserActivitySummary(userId);
      
      return NextResponse.json({
        success: true,
        summary
      });
    }

    if (type === 'tiers') {
      // Get all tiers for reference
      const tiers = await getUserTiers();
      
      return NextResponse.json({
        success: true,
        tiers
      });
    }

    if (type === 'activity-types') {
      // Get activity types by category
      const activityTypes = await getActivityTypesByCategory();
      
      return NextResponse.json({
        success: true,
        activityTypes
      });
    }

    return NextResponse.json(
      { error: 'Invalid analytics type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

