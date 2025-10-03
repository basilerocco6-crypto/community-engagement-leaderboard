import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(new URL('/?error=no_code', request.url), { status: 302 });
    }

    const whopClientId = process.env.NEXT_PUBLIC_WHOP_CLIENT_ID;
    const whopClientSecret = process.env.WHOP_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback`;

    if (!whopClientId || !whopClientSecret) {
      console.error('Missing Whop OAuth configuration');
      return NextResponse.redirect(new URL('/?error=config', request.url), { status: 302 });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://dev.whop.com/api/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: whopClientId,
        client_secret: whopClientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Failed to exchange code for token:', tokenResponse.status, await tokenResponse.text());
      return NextResponse.redirect(new URL('/?error=login_failed', request.url), { status: 302 });
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token } = tokenData;

    if (!access_token) {
      console.error('No access token received');
      return NextResponse.redirect(new URL('/?error=no_token', request.url), { status: 302 });
    }

    // Set secure session cookies
    const cookieStore = await cookies();
    
    cookieStore.set('whop_access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    if (refresh_token) {
      cookieStore.set('whop_refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }

    console.log('Successfully authenticated user with Whop OAuth');
    
    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url), { status: 302 });

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=callback_error', request.url), { status: 302 });
  }
}

// Handle GET requests for browser redirects (fallback)
export async function GET(request: NextRequest) {
  // Redirect POST to handle properly
  return POST(request);
}
