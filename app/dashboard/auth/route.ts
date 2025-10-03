import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  
  if (!token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  console.log('Setting dev token in cookie:', token.substring(0, 20) + '...');
  
  const response = NextResponse.redirect(new URL('/dashboard', request.url));
  
  response.cookies.set('whop_access_token', token, {
    path: '/',
    httpOnly: true,
    secure: false, // false for localhost
    sameSite: 'strict',
    maxAge: 3600 // 1 hour
  });
  
  return response;
}
