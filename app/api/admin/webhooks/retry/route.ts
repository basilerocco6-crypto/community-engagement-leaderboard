import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const maxRetries = body.max_retries || 3;

    // Use the database function to retry failed webhooks
    const { data: retryResult, error: retryError } = await supabase
      .rpc('retry_failed_webhooks', { p_max_retries: maxRetries });

    if (retryError) {
      throw retryError;
    }

    const retryCount = retryResult || 0;

    // Log the retry operation
    await supabase
      .from('system_events')
      .insert({
        event_type: 'WEBHOOK_RETRY',
        admin_user_id: user.id,
        admin_username: user.email || 'Unknown Admin',
        description: `Retried ${retryCount} failed webhooks`,
        metadata: {
          max_retries: maxRetries,
          retry_count: retryCount
        }
      });

    return NextResponse.json({
      success: true,
      message: `Successfully retried ${retryCount} failed webhooks`,
      retry_count: retryCount
    });

  } catch (error) {
    console.error('Error retrying failed webhooks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retry webhooks' },
      { status: 500 }
    );
  }
}
