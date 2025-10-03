import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { WhopWebhookHandler } from '@/lib/whop-webhooks';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    
    // Get webhook signature for verification
    const signature = headersList.get('whop-signature');
    const timestamp = headersList.get('whop-timestamp');
    
    if (!signature || !timestamp) {
      console.error('Missing webhook signature or timestamp');
      return NextResponse.json(
        { success: false, error: 'Missing webhook signature' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    const isValid = await WhopWebhookHandler.verifySignature(body, signature, timestamp);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const payload = JSON.parse(body);
    const { type, data } = payload;

    console.log(`Received Whop webhook: ${type}`, { data });

    // Route to appropriate handler based on event type
    let result;
    switch (type) {
      case 'membership.created':
      case 'user.joined':
        result = await WhopWebhookHandler.handleMemberJoin(data);
        break;
        
      case 'course.completed':
      case 'lesson.completed':
        result = await WhopWebhookHandler.handleCourseCompletion(data);
        break;
        
      case 'membership.cancelled':
      case 'membership.expired':
      case 'user.left':
        result = await WhopWebhookHandler.handleMemberCancel(data);
        break;
        
      case 'payment.succeeded':
      case 'purchase.completed':
        result = await WhopWebhookHandler.handlePurchaseEvent(data);
        break;
        
      case 'user.updated':
        result = await WhopWebhookHandler.handleUserUpdate(data);
        break;
        
      default:
        console.log(`Unhandled webhook type: ${type}`);
        return NextResponse.json({ 
          success: true, 
          message: `Webhook type ${type} received but not handled` 
        });
    }

    // Log webhook processing
    await logWebhookEvent(type, data, result);

    return NextResponse.json({
      success: true,
      message: `Webhook ${type} processed successfully`,
      result
    });

  } catch (error) {
    console.error('Error processing Whop webhook:', error);
    
    // Log failed webhook
    try {
      await logWebhookEvent('error', { error: error.message }, { success: false });
    } catch (logError) {
      console.error('Error logging webhook failure:', logError);
    }

    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function logWebhookEvent(type: string, data: any, result: any) {
  try {
    const supabase = createClient();
    
    await supabase
      .from('webhook_events')
      .insert({
        event_type: type,
        payload: data,
        processing_result: result,
        processed_at: new Date().toISOString(),
        success: result?.success !== false
      });
  } catch (error) {
    console.error('Error logging webhook event:', error);
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Whop webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
