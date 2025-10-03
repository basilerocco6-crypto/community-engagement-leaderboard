import { NextRequest, NextResponse } from 'next/server';
import { WhopCoursesAPI } from '@/lib/whop-courses-api';
import { createClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createClient();
    const { userId } = params;

    // Get user's course dashboard from database function
    const { data: courseDashboard, error: dashboardError } = await supabase
      .rpc('get_user_course_dashboard', { p_user_id: userId });

    if (dashboardError) {
      throw dashboardError;
    }

    // Get detailed course history
    const { CourseEngagementTracker } = await import('@/lib/whop-courses-api');
    const courseHistory = await CourseEngagementTracker.getUserCourseHistory(userId);

    return NextResponse.json({
      success: true,
      data: {
        courses: courseDashboard || [],
        history: courseHistory,
        summary: {
          total_courses: courseDashboard?.length || 0,
          completed_courses: courseDashboard?.filter((c: any) => c.completed_at).length || 0,
          in_progress_courses: courseDashboard?.filter((c: any) => !c.completed_at && c.progress_percentage > 0).length || 0,
          total_modules_completed: courseDashboard?.reduce((sum: number, c: any) => sum + c.completed_modules, 0) || 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user course progress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course progress' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();
    const { sync_from_whop } = body;

    if (sync_from_whop) {
      // Sync user's progress from Whop API
      const syncResult = await WhopCoursesAPI.syncUserProgress(userId);

      return NextResponse.json({
        success: true,
        message: 'User progress synced from Whop',
        synced: syncResult.synced,
        errors: syncResult.errors
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error syncing user course progress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync course progress' },
      { status: 500 }
    );
  }
}
