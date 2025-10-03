import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET endpoint to fetch user's engagement history
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const activityType = searchParams.get('activity_type');

    let query = supabase
      .from('engagement_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (activityType) {
      query = query.eq('activity_type', activityType);
    }

    const { data: activities, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      activities: activities || [],
      pagination: {
        limit,
        offset,
        hasMore: (activities || []).length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching engagement history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch engagement history' },
      { status: 500 }
    );
  }
}
