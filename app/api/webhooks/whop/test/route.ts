import { NextRequest, NextResponse } from 'next/server';
import { WhopWebhookHandler } from '@/lib/whop-webhooks';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { test_type, test_data } = body;

    console.log(`Running webhook test: ${test_type}`);

    let result;
    switch (test_type) {
      case 'member_join':
        result = await testMemberJoin(test_data);
        break;
        
      case 'course_completion':
        result = await testCourseCompletion(test_data);
        break;
        
      case 'member_cancel':
        result = await testMemberCancel(test_data);
        break;
        
      case 'purchase_event':
        result = await testPurchaseEvent(test_data);
        break;
        
      case 'connectivity':
        result = await WhopWebhookHandler.testWebhook();
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: `Unknown test type: ${test_type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      test_type,
      result
    });

  } catch (error) {
    console.error('Error running webhook test:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Webhook test endpoint is active',
    available_tests: [
      'member_join',
      'course_completion', 
      'member_cancel',
      'purchase_event',
      'connectivity'
    ],
    usage: {
      method: 'POST',
      body: {
        test_type: 'string',
        test_data: 'object (optional)'
      }
    }
  });
}

async function testMemberJoin(testData?: any) {
  const mockUser = testData?.user || {
    id: 'test_user_' + Date.now(),
    email: 'test@example.com',
    username: 'TestUser',
    avatar_url: 'https://example.com/avatar.jpg'
  };

  const mockMembership = {
    id: 'test_membership_' + Date.now(),
    user: mockUser,
    product_id: 'test_product',
    status: 'active',
    created_at: new Date().toISOString()
  };

  return await WhopWebhookHandler.handleMemberJoin({ membership: mockMembership });
}

async function testCourseCompletion(testData?: any) {
  const mockUser = testData?.user || {
    id: 'test_user_' + Date.now(),
    email: 'test@example.com',
    username: 'TestUser'
  };

  const mockCourse = testData?.course || {
    id: 'test_course_' + Date.now(),
    title: 'Test Course',
    description: 'A test course for webhook testing',
    points_value: 100
  };

  return await WhopWebhookHandler.handleCourseCompletion({
    user: mockUser,
    course: mockCourse,
    completion_type: 'course'
  });
}

async function testMemberCancel(testData?: any) {
  const mockUser = testData?.user || {
    id: 'test_user_' + Date.now(),
    email: 'test@example.com',
    username: 'TestUser'
  };

  const mockMembership = {
    id: 'test_membership_' + Date.now(),
    user: mockUser,
    product_id: 'test_product',
    status: 'cancelled',
    created_at: new Date().toISOString()
  };

  return await WhopWebhookHandler.handleMemberCancel({ 
    membership: mockMembership,
    reason: 'Test cancellation'
  });
}

async function testPurchaseEvent(testData?: any) {
  const mockUser = testData?.user || {
    id: 'test_user_' + Date.now(),
    email: 'test@example.com',
    username: 'TestUser'
  };

  const mockPurchase = testData?.purchase || {
    id: 'test_purchase_' + Date.now(),
    user: mockUser,
    product_id: 'test_product',
    amount: 99.99,
    currency: 'USD',
    discount_applied: testData?.discount_applied
  };

  return await WhopWebhookHandler.handlePurchaseEvent(mockPurchase);
}
