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
    const includeStats = searchParams.get('include_stats') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    let query = supabase
      .from('user_engagement')
      .select('*')
      .order('total_points', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add search filter if provided
    if (search) {
      query = query.or(`username.ilike.%${search}%,user_id.ilike.%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      throw error;
    }

    // Add rank to each user
    const usersWithRank = users?.map((user: any, index: number) => ({
      ...user,
      rank: offset + index + 1
    })) || [];

    // Add additional stats if requested
    let usersWithStats = usersWithRank;
    if (includeStats) {
      usersWithStats = await Promise.all(
        usersWithRank.map(async (user: any) => {
          // Get activity count for last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { count: recentActivityCount } = await supabase
            .from('engagement_events')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.user_id)
            .gte('created_at', thirtyDaysAgo.toISOString());

          // Get total activity count
          const { count: totalActivityCount } = await supabase
            .from('engagement_events')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.user_id);

          // Get last activity date
          const { data: lastActivity } = await supabase
            .from('engagement_events')
            .select('created_at')
            .eq('user_id', user.user_id)
            .order('created_at', { ascending: false })
            .limit(1);

          return {
            ...user,
            stats: {
              recent_activity_count: recentActivityCount || 0,
              total_activity_count: totalActivityCount || 0,
              last_activity_at: lastActivity?.[0]?.created_at || null
            }
          };
        })
      );
    }

    return NextResponse.json({
      success: true,
      users: usersWithStats,
      pagination: {
        limit,
        offset,
        total: usersWithStats.length
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
