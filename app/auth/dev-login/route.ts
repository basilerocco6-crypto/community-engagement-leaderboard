import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const userId = searchParams.get('user_id');
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  // Validate required parameters
  if (!token || !userId) {
    console.error('Missing token or user_id in dev-login');
    return NextResponse.redirect(new URL('/?error=dev_auth_failed', request.url));
  }

  try {
    // Create response with redirect
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    
    // Set authentication cookies
    response.cookies.set('whop_access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    response.cookies.set('user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Dev login error:', error);
    return NextResponse.redirect(new URL('/?error=dev_auth_failed', request.url));
  }
}

