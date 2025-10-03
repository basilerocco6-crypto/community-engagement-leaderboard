import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Temporarily disabled for deployment
    return NextResponse.json({
      success: false,
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