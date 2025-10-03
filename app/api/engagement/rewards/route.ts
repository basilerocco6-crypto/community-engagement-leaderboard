import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Temporarily disabled for deployment
    return NextResponse.json({
      success: false,
      rewards: [],
      message: 'Engagement API temporarily disabled for deployment'
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}