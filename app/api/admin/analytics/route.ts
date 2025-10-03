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

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    // Get analytics data
    const analytics = await getAnalyticsData(supabase, timeRange);

    return NextResponse.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

async function getAnalyticsData(supabase: any, timeRange: string) {
  const dateFilter = getDateFilter(timeRange);

  // Get total users
  const { count: totalUsers } = await supabase
    .from('user_engagement')
    .select('*', { count: 'exact', head: true });

  // Get active users in time range
  const { data: activeUsersData } = await supabase
    .from('engagement_events')
    .select('user_id')
    .gte('created_at', dateFilter.toISOString());

  const uniqueActiveUsers = new Set(activeUsersData?.map((u: any) => u.user_id) || []);
  const activeUsers = uniqueActiveUsers.size;

  // Get total points in time range
  const { data: pointsData } = await supabase
    .from('engagement_events')
    .select('points_awarded')
    .gte('created_at', dateFilter.toISOString());

  const totalPoints = pointsData?.reduce((sum: number, event: any) => sum + event.points_awarded, 0) || 0;

  // Get total activities in time range
  const { count: totalActivities } = await supabase
    .from('engagement_events')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', dateFilter.toISOString());

  // Get most active members
  const { data: mostActiveMembers } = await supabase
    .from('user_engagement')
    .select(`
      user_id,
      username,
      total_points,
      current_tier
    `)
    .order('total_points', { ascending: false })
    .limit(10);

  // Add activity counts for each member
  const membersWithCounts = await Promise.all(
    (mostActiveMembers || []).map(async (member: any) => {
      const { count: activitiesCount } = await supabase
        .from('engagement_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', member.user_id)
        .gte('created_at', dateFilter.toISOString());

      return {
        ...member,
        activities_count: activitiesCount || 0
      };
    })
  );

  // Get activity breakdown
  const { data: activityBreakdownData } = await supabase
    .from('engagement_events')
    .select('activity_type, points_awarded')
    .gte('created_at', dateFilter.toISOString());

  const activityBreakdown = processActivityBreakdown(activityBreakdownData || []);

  // Get engagement trends (daily data for the time range)
  const engagementTrends = await getEngagementTrends(supabase, dateFilter);

  // Get tier distribution
  const { data: tierDistributionData } = await supabase
    .from('user_engagement')
    .select('current_tier');

  const tierDistribution = processTierDistribution(tierDistributionData || []);

  return {
    totalUsers: totalUsers || 0,
    activeUsers,
    totalPoints,
    totalActivities: totalActivities || 0,
    mostActiveMembers: membersWithCounts,
    activityBreakdown,
    engagementTrends,
    tierDistribution
  };
}

function getDateFilter(timeRange: string): Date {
  const now = new Date();
  switch (timeRange) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'all':
    default:
      return new Date(0); // Beginning of time
  }
}

function processActivityBreakdown(activities: any[]) {
  const breakdown: Record<string, { count: number; total_points: number }> = {};

  activities.forEach(activity => {
    if (!breakdown[activity.activity_type]) {
      breakdown[activity.activity_type] = { count: 0, total_points: 0 };
    }
    breakdown[activity.activity_type].count++;
    breakdown[activity.activity_type].total_points += activity.points_awarded;
  });

  const totalActivities = activities.length;
  
  return Object.entries(breakdown).map(([activity_type, data]) => ({
    activity_type,
    count: data.count,
    total_points: data.total_points,
    percentage: totalActivities > 0 ? (data.count / totalActivities) * 100 : 0
  })).sort((a, b) => b.count - a.count);
}

function processTierDistribution(users: any[]) {
  const distribution: Record<string, number> = {};
  
  users.forEach(user => {
    const tier = user.current_tier || 'Bronze';
    distribution[tier] = (distribution[tier] || 0) + 1;
  });

  const totalUsers = users.length;

  return Object.entries(distribution).map(([tier_name, user_count]) => ({
    tier_name,
    user_count,
    percentage: totalUsers > 0 ? (user_count / totalUsers) * 100 : 0
  })).sort((a, b) => {
    const tierOrder = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    return tierOrder.indexOf(a.tier_name) - tierOrder.indexOf(b.tier_name);
  });
}

async function getEngagementTrends(supabase: any, dateFilter: Date) {
  const trends = [];
  const now = new Date();
  const days = Math.min(30, Math.ceil((now.getTime() - dateFilter.getTime()) / (24 * 60 * 60 * 1000)));

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

    const { data: dayActivities } = await supabase
      .from('engagement_events')
      .select('points_awarded, user_id')
      .gte('created_at', date.toISOString())
      .lt('created_at', nextDate.toISOString());

    const total_activities = dayActivities?.length || 0;
    const total_points = dayActivities?.reduce((sum: number, activity: any) => sum + activity.points_awarded, 0) || 0;
    const unique_users = new Set(dayActivities?.map((a: any) => a.user_id) || []).size;

    trends.push({
      date: date.toISOString().split('T')[0],
      total_activities,
      total_points,
      unique_users
    });
  }

  return trends;
}
