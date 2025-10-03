import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
// // import { EngagementTracker } from .*/*/
// import { AddEngagementPointsRequest } from '@/lib/types/engagement';

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

    const body: any = await request.json();
    
    // Get username from cookies or body
    const username = cookieStore.get('username')?.value || body.username || 'Unknown User';
    
    // Validate required fields
    if (!body.activity_type) {
      return NextResponse.json(
        { error: 'Missing required field: activity_type' },
        { status: 400 }
      );
    }

    // Create the engagement request
    const engagementRequest: any = {
      user_id: userId,
      username,
      activity_type: body.activity_type,
      points: body.points,
      metadata: body.metadata,
      chat_data: body.chat_data,
      forum_data: body.forum_data,
      course_data: body.course_data
    };

    // TODO: Temporarily disabled during deployment
    const result = { success: false, message: 'API temporarily disabled' };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error recording engagement activity:', error);
    return NextResponse.json(
      { error: 'Failed to record engagement activity' },
      { status: 500 }
    );
  }
}

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

    // TODO: Temporarily disabled during deployment
    return NextResponse.json({
              success: false,
              error: 'API temporarily disabled for deployment',
    });

  } catch (error) {
    console.error('Error fetching user engagement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user engagement data' },
      { status: 500 }
    );
  }
}

