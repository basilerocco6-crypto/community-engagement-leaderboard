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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const userId = searchParams.get('user_id');

    let query = supabase
      .from('point_adjustments')
      .select(`
        *,
        user_engagement!inner(username)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by user if specified
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: adjustments, error } = await query;

    if (error) {
      throw error;
    }

    // Format the response
    const formattedHistory = adjustments?.map((adjustment: any) => ({
      id: adjustment.id,
      user_id: adjustment.user_id,
      username: adjustment.user_engagement.username,
      points_change: adjustment.points_change,
      previous_points: adjustment.previous_points,
      new_points: adjustment.new_points,
      reason: adjustment.reason,
      admin_user: adjustment.admin_username,
      created_at: adjustment.created_at
    })) || [];

    return NextResponse.json({
      success: true,
      history: formattedHistory,
      pagination: {
        limit,
        offset,
        total: formattedHistory.length
      }
    });

  } catch (error) {
    console.error('Error fetching adjustment history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch adjustment history' },
      { status: 500 }
    );
  }
}
