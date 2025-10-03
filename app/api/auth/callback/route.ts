import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    console.log('Auth callback hit with:', { code: !!code, error });

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error 
      }, { status: 400 });
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.json({ 
        success: false, 
        error: 'No authorization code' 
      }, { status: 400 });
    }

    // For now, return success to avoid redirect loops
    return NextResponse.json({ 
      success: true, 
      code: code,
      message: 'Authentication successful - copy this URL and paste in address bar: /dashboard'
    });

  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Callback error' 
    }, { status: 500 });
  }
}