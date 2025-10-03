import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { EngagementTracker } from '@/lib/engagement-core';
import { AddEngagementPointsRequest } from '@/lib/types/engagement';

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

    const body: Partial<AddEngagementPointsRequest> = await request.json();
    
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
    const engagementRequest: AddEngagementPointsRequest = {
      user_id: userId,
      username,
      activity_type: body.activity_type,
      points: body.points,
      metadata: body.metadata,
      chat_data: body.chat_data,
      forum_data: body.forum_data,
      course_data: body.course_data
    };

    const result = await EngagementTracker.recordEngagement(engagementRequest);

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

    const userEngagement = await EngagementTracker.getUserEngagement(userId);

    if (!userEngagement) {
      return NextResponse.json(
        { error: 'User engagement data not found' },
        { status: 404 }
      );
    }

    // Get user's rank
    const rank = await EngagementTracker.getUserRank(userId);

    return NextResponse.json({
      success: true,
      user_engagement: userEngagement,
      rank: rank
    });

  } catch (error) {
    console.error('Error fetching user engagement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user engagement data' },
      { status: 500 }
    );
  }
}

