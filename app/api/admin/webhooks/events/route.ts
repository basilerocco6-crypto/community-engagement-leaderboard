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
    const eventType = searchParams.get('event_type');
    const success = searchParams.get('success');

    let query = supabase
      .from('webhook_events')
      .select('*')
      .order('processed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (success !== null) {
      query = query.eq('success', success === 'true');
    }

    const { data: events, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      events: events || [],
      pagination: {
        limit,
        offset,
        total: events?.length || 0
      }
    });

  } catch (error) {
    console.error('Error fetching webhook events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch webhook events' },
      { status: 500 }
    );
  }
}
