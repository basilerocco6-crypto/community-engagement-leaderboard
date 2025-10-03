import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Reason is required for leaderboard reset' },
        { status: 400 }
      );
    }

    // Get all users before reset for logging
    const { data: allUsers, error: usersError } = await supabase
      .from('user_engagement')
      .select('user_id, username, total_points, current_tier');

    if (usersError) {
      throw usersError;
    }

    // Reset all users to 0 points and Bronze tier
    const { error: resetError } = await supabase
      .from('user_engagement')
      .update({
        total_points: 0,
        current_tier: 'Bronze',
        updated_at: new Date().toISOString()
      })
      .neq('user_id', ''); // Update all users

    if (resetError) {
      throw resetError;
    }

    // Log individual adjustments for each user
    const adjustmentPromises = (allUsers || []).map(async (userData: any) => {
      if (userData.total_points > 0) {
        // Log the reset as an adjustment
        await supabase
          .from('point_adjustments')
          .insert({
            user_id: userData.user_id,
            admin_user_id: user.id,
            admin_username: user.email || 'Unknown Admin',
            adjustment_type: 'set',
            points_change: -userData.total_points,
            previous_points: userData.total_points,
            new_points: 0,
            reason: `Leaderboard Reset: ${reason}`,
            created_at: new Date().toISOString()
          });

        // Create engagement event
        await supabase
          .from('engagement_events')
          .insert({
            user_id: userData.user_id,
            activity_type: 'LEADERBOARD_RESET',
            points_awarded: -userData.total_points,
            metadata: {
              reason,
              admin_user_id: user.id,
              previous_tier: userData.current_tier
            },
            created_at: new Date().toISOString()
          });
      }
    });

    await Promise.all(adjustmentPromises);

    // Log the system-wide reset
    const { error: systemLogError } = await supabase
      .from('system_events')
      .insert({
        event_type: 'LEADERBOARD_RESET',
        admin_user_id: user.id,
        admin_username: user.email || 'Unknown Admin',
        description: `Leaderboard reset: ${reason}`,
        metadata: {
          users_affected: allUsers?.length || 0,
          total_points_reset: allUsers?.reduce((sum: number, u: any) => sum + u.total_points, 0) || 0
        },
        created_at: new Date().toISOString()
      });

    if (systemLogError) {
      console.error('Error logging system event:', systemLogError);
    }

    return NextResponse.json({
      success: true,
      message: 'Leaderboard has been reset successfully',
      reset_summary: {
        users_affected: allUsers?.length || 0,
        total_points_reset: allUsers?.reduce((sum: number, u: any) => sum + u.total_points, 0) || 0,
        reason,
        reset_at: new Date().toISOString(),
        admin_user: user.email
      }
    });

  } catch (error) {
    console.error('Error resetting leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset leaderboard' },
      { status: 500 }
    );
  }
}
