import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(new URL('/?error=oauth_error', request.url));
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(new URL('/?error=no_code', request.url));
    }

    // For now, let's just store the code and redirect
    const cookieStore = await cookies();
    
    // Set a simple success flag in cookies
    cookieStore.set('oauth_code', code, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 300 // 5 minutes
    });

    // Redirect to dashboard with success
    return NextResponse.redirect(new URL('/dashboard', request.url));

  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/?error=callback_error', request.url));
  }
}