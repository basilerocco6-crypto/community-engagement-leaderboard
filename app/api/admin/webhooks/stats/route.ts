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
    const days = parseInt(searchParams.get('days') || '7');

    // Get webhook statistics using the database function
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_webhook_stats', { p_days: days });

    if (statsError) {
      throw statsError;
    }

    const stats = statsData?.[0] || {
      total_events: 0,
      successful_events: 0,
      failed_events: 0,
      success_rate: 0,
      events_by_type: []
    };

    return NextResponse.json({
      success: true,
      stats: {
        total_events: parseInt(stats.total_events) || 0,
        successful_events: parseInt(stats.successful_events) || 0,
        failed_events: parseInt(stats.failed_events) || 0,
        success_rate: parseFloat(stats.success_rate) || 0,
        events_by_type: stats.events_by_type || []
      },
      period_days: days
    });

  } catch (error) {
    console.error('Error fetching webhook stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch webhook statistics' },
      { status: 500 }
    );
  }
}
