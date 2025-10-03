import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get overview statistics
    const stats = await getOverviewStats(supabase);

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching overview stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch overview statistics' },
      { status: 500 }
    );
  }
}

async function getOverviewStats(supabase: any) {
  // Get total users
  const { count: totalUsers } = await supabase
    .from('user_engagement')
    .select('*', { count: 'exact', head: true });

  // Get active users (users with activity in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: activeUsersData } = await supabase
    .from('engagement_events')
    .select('user_id')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .group('user_id');

  const activeUsers = activeUsersData?.length || 0;

  // Get total points awarded
  const { data: pointsData } = await supabase
    .from('user_engagement')
    .select('total_points');

  const totalPoints = pointsData?.reduce((sum: number, user: any) => sum + user.total_points, 0) || 0;

  // Get total activities
  const { count: totalActivities } = await supabase
    .from('engagement_events')
    .select('*', { count: 'exact', head: true });

  // Calculate average points per user
  const averagePointsPerUser = totalUsers > 0 ? totalPoints / totalUsers : 0;

  // Get top tier
  const { data: topTierData } = await supabase
    .from('user_engagement')
    .select('current_tier')
    .order('total_points', { ascending: false })
    .limit(1);

  const topTier = topTierData?.[0]?.current_tier || 'Bronze';

  // Get recent activity (last 20 activities)
  const { data: recentActivity } = await supabase
    .from('engagement_events')
    .select(`
      user_id,
      activity_type,
      points_awarded,
      created_at,
      user_engagement!inner(username)
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  const formattedRecentActivity = recentActivity?.map((activity: any) => ({
    user_id: activity.user_id,
    username: activity.user_engagement.username,
    activity_type: activity.activity_type,
    points_awarded: activity.points_awarded,
    created_at: activity.created_at
  })) || [];

  // System health check
  const systemHealth = {
    status: 'healthy' as const,
    uptime: getUptime(),
    lastSync: new Date().toISOString(),
    issues: [] as string[]
  };

  // Check for potential issues
  if (activeUsers / totalUsers < 0.1) {
    systemHealth.status = 'warning';
    systemHealth.issues.push('Low user engagement rate (< 10%)');
  }

  if (totalActivities === 0) {
    systemHealth.status = 'warning';
    systemHealth.issues.push('No recent activity recorded');
  }

  return {
    totalUsers: totalUsers || 0,
    activeUsers,
    totalPoints,
    totalActivities: totalActivities || 0,
    averagePointsPerUser,
    topTier,
    recentActivity: formattedRecentActivity,
    systemHealth
  };
}

function getUptime(): string {
  // Simple uptime calculation - in production this would be more sophisticated
  const uptimeMs = process.uptime() * 1000;
  const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}
