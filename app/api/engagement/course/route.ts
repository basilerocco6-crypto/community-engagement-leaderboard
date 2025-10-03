import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { EngagementTracker } from '@/lib/engagement-core';

// Specialized endpoint for tracking course completions
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      course_id, 
      course_title, 
      completion_percentage = 100,
      time_spent_minutes,
      quiz_score,
      lesson_id,
      username
    } = body;

    // Validate required fields
    if (!course_id || !course_title) {
      return NextResponse.json(
        { error: 'Missing required fields: course_id, course_title' },
        { status: 400 }
      );
    }

    // Validate completion percentage
    if (completion_percentage < 0 || completion_percentage > 100) {
      return NextResponse.json(
        { error: 'completion_percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Get username from cookies or body
    const finalUsername = cookieStore.get('username')?.value || username || 'Unknown User';

    const result = await EngagementTracker.trackCourseCompletion(
      userId,
      finalUsername,
      course_id,
      course_title,
      completion_percentage,
      time_spent_minutes,
      quiz_score,
      lesson_id
    );

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error tracking course completion:', error);
    return NextResponse.json(
      { error: 'Failed to track course completion' },
      { status: 500 }
    );
  }
}
