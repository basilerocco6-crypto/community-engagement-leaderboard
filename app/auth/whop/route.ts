import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const devToken = url.searchParams.get('whop-dev-user-token');
  
  if (devToken) {
    console.log('Dev token received:', devToken.substring(0, 20) + '...');
    
    // Extract user info from dev token if needed
    try {
      // For dev mode, we can decode basic info
      const payload = JSON.parse(atob(devToken.split('.')[1]));
      console.log('Dev token payload:', payload);
      
      // Set cookies for dev mode
      const response = NextResponse.redirect(new URL('/dashboard', request.url));
      response.cookies.set('whop_access_token', devToken, {
        path: '/',
        httpOnly: true,
        secure: false, // false for localhost
        sameSite: 'strict',
        maxAge: 3600 // 1 hour
      });
      
      return response;
    } catch (error) {
      console.error('Error processing dev token:', error);
    }
  }

  // Regular OAuth flow
  const clientId = process.env.NEXT_PUBLIC_WHOP_CLIENT_ID;
  const redirectUri = `${url.origin}/api/auth/callback`;
  
  if (!clientId) {
    return NextResponse.json({ error: 'Client ID not configured' }, { status: 500 });
  }

  const whopAuthUrl = `https://whop.com/api/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=read`;
  
  return NextResponse.redirect(whopAuthUrl);
}
