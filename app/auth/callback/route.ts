import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getWhopUser } from '@/lib/whop';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Handle OAuth error
  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(new URL('/?error=oauth_error', request.url));
  }

  // Handle missing authorization code
  if (!code) {
    console.error('No authorization code provided');
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    // Exchange authorization code for access token
    const tokenData = await exchangeCodeForToken(code);
    const { access_token } = tokenData;

    // Get user information from Whop
    const whopUser = await getWhopUser(access_token);

    // Store or update user in Supabase (if configured)
    if (!supabase) {
      console.warn('Supabase not configured - skipping user storage');
      // Create a session without database storage
      const response = NextResponse.redirect(new URL('/dashboard', request.url));
      response.cookies.set('whop_access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      response.cookies.set('user_id', whopUser.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return response;
    }

    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('whop_user_id', whopUser.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      throw fetchError;
    }

    let user;
    if (existingUser) {
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          email: whopUser.email,
          username: whopUser.username,
          avatar_url: whopUser.profile_pic_url,
          updated_at: new Date().toISOString(),
        })
        .eq('whop_user_id', whopUser.id)
        .select()
        .single();

      if (updateError) throw updateError;
      user = updatedUser;
    } else {
      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          whop_user_id: whopUser.id,
          email: whopUser.email,
          username: whopUser.username,
          avatar_url: whopUser.profile_pic_url,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      user = newUser;
    }

    // Create a session (you might want to use a more secure session management solution)
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.set('whop_access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    response.cookies.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}
