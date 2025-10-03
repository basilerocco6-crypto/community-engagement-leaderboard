import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const supabase = createClient();
    const { courseId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get course leaderboard using database function
    const { data: leaderboard, error: leaderboardError } = await supabase
      .rpc('get_course_leaderboard', { 
        p_course_id: courseId,
        p_limit: limit
      });

    if (leaderboardError) {
      throw leaderboardError;
    }

    // Get course details
    const { data: courseData, error: courseError } = await supabase
      .from('whop_courses')
      .select('*')
      .eq('whop_course_id', courseId)
      .single();

    if (courseError) {
      throw courseError;
    }

    // Get course statistics
    const { data: statsData, error: statsError } = await supabase
      .from('course_overview')
      .select('*')
      .eq('whop_course_id', courseId)
      .single();

    const courseStats = statsData || {
      total_enrolled: 0,
      total_completed: 0,
      completion_rate: 0,
      avg_completion_days: 0
    };

    return NextResponse.json({
      success: true,
      data: {
        course: courseData,
        leaderboard: leaderboard || [],
        statistics: {
          total_enrolled: courseStats.total_enrolled,
          total_completed: courseStats.total_completed,
          completion_rate: courseStats.completion_rate,
          average_completion_days: courseStats.avg_completion_days
        }
      }
    });

  } catch (error) {
    console.error('Error fetching course leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course leaderboard' },
      { status: 500 }
    );
  }
}
