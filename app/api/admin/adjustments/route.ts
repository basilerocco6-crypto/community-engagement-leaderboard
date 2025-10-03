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
    const { user_id, adjustment_type, points_change, reason } = body;

    if (!user_id || !adjustment_type || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current user data
    const { data: currentUser, error: userError } = await supabase
      .from('user_engagement')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate new points based on adjustment type
    let newPoints: number;
    switch (adjustment_type) {
      case 'add':
        newPoints = currentUser.total_points + points_change;
        break;
      case 'remove':
        newPoints = Math.max(0, currentUser.total_points - points_change);
        break;
      case 'set':
        newPoints = Math.max(0, points_change);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid adjustment type' },
          { status: 400 }
        );
    }

    const actualPointsChange = newPoints - currentUser.total_points;

    // Update user points
    const { error: updateError } = await supabase
      .from('user_engagement')
      .update({ 
        total_points: newPoints,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id);

    if (updateError) {
      throw updateError;
    }

    // Log the adjustment
    const { error: logError } = await supabase
      .from('point_adjustments')
      .insert({
        user_id,
        admin_user_id: user.id,
        admin_username: user.email || 'Unknown Admin',
        adjustment_type,
        points_change: actualPointsChange,
        previous_points: currentUser.total_points,
        new_points: newPoints,
        reason,
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging adjustment:', logError);
      // Don't fail the request if logging fails
    }

    // Create an engagement event for tracking
    const { error: eventError } = await supabase
      .from('engagement_events')
      .insert({
        user_id,
        activity_type: 'MANUAL_ADJUSTMENT',
        points_awarded: actualPointsChange,
        metadata: {
          adjustment_type,
          reason,
          admin_user_id: user.id
        },
        created_at: new Date().toISOString()
      });

    if (eventError) {
      console.error('Error creating engagement event:', eventError);
    }

    return NextResponse.json({
      success: true,
      message: 'Point adjustment completed successfully',
      adjustment: {
        user_id,
        previous_points: currentUser.total_points,
        new_points: newPoints,
        points_change: actualPointsChange,
        reason
      }
    });

  } catch (error) {
    console.error('Error making point adjustment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to make point adjustment' },
      { status: 500 }
    );
  }
}
