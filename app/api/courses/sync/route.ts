import { NextRequest, NextResponse } from 'next/server';
import { WhopCoursesAPI } from '@/lib/whop-courses-api';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access (courses sync should be admin-only)
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get('admin_key');
    
    if (adminKey !== process.env.ADMIN_SYNC_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting course sync from Whop API...');

    // Sync all courses from Whop to our database
    const syncResult = await WhopCoursesAPI.syncCoursesToDatabase();

    console.log(`Course sync completed: ${syncResult.synced} synced, ${syncResult.errors} errors`);

    return NextResponse.json({
      success: true,
      message: 'Course sync completed',
      synced: syncResult.synced,
      errors: syncResult.errors
    });

  } catch (error) {
    console.error('Error syncing courses:', error);
    return NextResponse.json(
      { success: false, error: 'Course sync failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Course sync endpoint',
    usage: {
      method: 'POST',
      params: {
        admin_key: 'Required admin key for authentication'
      }
    }
  });
}
