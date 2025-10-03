import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Clear authentication cookies
    cookieStore.set('whop_access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    cookieStore.set('whop_refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    console.log('User logged out successfully');
    
    // Redirect to home page
    return NextResponse.redirect(new URL('/', request.url), { status: 302 });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.redirect(new URL('/?error=logout_error', request.url), { status: 302 });
  }
}

// Handle GET requests for browser redirects (fallback)
export async function GET(request: NextRequest) {
  return POST(request);
}