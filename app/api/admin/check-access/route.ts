import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { hasWhopAccess } from '@/lib/whop';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', isAdmin: false },
        { status: 401 }
      );
    }

    // Check if user has Whop owner permissions
    // This would integrate with your Whop API to verify ownership
    const isOwner = await checkWhopOwnerPermissions(user.id);
    
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: 'Owner permissions required', isAdmin: false },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      isAdmin: true,
      user: {
        id: user.id,
        email: user.email,
        role: 'owner'
      }
    });

  } catch (error) {
    console.error('Error checking admin access:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', isAdmin: false },
      { status: 500 }
    );
  }
}

async function checkWhopOwnerPermissions(userId: string): Promise<boolean> {
  try {
    // TODO: Replace with actual Whop API integration
    // This should check if the user has owner permissions for the community
    
    // For now, we'll check if the user exists in our system and has admin role
    const supabase = createClient();
    
    // Check if user has admin role in our system
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'owner')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking admin user:', error);
      return false;
    }

    // If admin user exists, they have permissions
    if (adminUser) {
      return true;
    }

    // TODO: Integrate with Whop API
    // Example Whop API call:
    // const whopResponse = await fetch(`https://api.whop.com/v1/users/${userId}/permissions`, {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   }
    // });
    // 
    // const permissions = await whopResponse.json();
    // return permissions.role === 'owner' || permissions.permissions.includes('admin');

    // For development/testing, allow access if user is authenticated
    // Remove this in production and implement proper Whop integration
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    return false;

  } catch (error) {
    console.error('Error checking Whop owner permissions:', error);
    return false;
  }
}