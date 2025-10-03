/**
 * Whop Webhook Integration Examples
 * 
 * This file contains example webhook payloads and usage patterns
 * for integrating with Whop's webhook system.
 */

// Example webhook payloads from Whop

export const EXAMPLE_WEBHOOKS = {
  // New member joins the community
  memberJoin: {
    type: 'membership.created',
    data: {
      membership: {
        id: 'mem_1234567890',
        user: {
          id: 'user_abcdef123456',
          email: 'john.doe@example.com',
          username: 'johndoe',
          discord_id: '123456789012345678',
          avatar_url: 'https://cdn.whop.com/avatars/user_abcdef123456.jpg'
        },
        product_id: 'prod_community_access',
        status: 'active',
        created_at: '2024-01-15T10:30:00Z',
        expires_at: '2024-02-15T10:30:00Z'
      }
    },
    created_at: '2024-01-15T10:30:00Z'
  },

  // Course completion event
  courseCompletion: {
    type: 'course.completed',
    data: {
      user: {
        id: 'user_abcdef123456',
        email: 'john.doe@example.com',
        username: 'johndoe'
      },
      course: {
        id: 'course_advanced_trading',
        title: 'Advanced Trading Strategies',
        description: 'Learn advanced trading techniques and risk management',
        points_value: 150
      },
      completion_type: 'course',
      completed_at: '2024-01-15T14:45:00Z'
    },
    created_at: '2024-01-15T14:45:00Z'
  },

  // Lesson completion event
  lessonCompletion: {
    type: 'lesson.completed',
    data: {
      user: {
        id: 'user_abcdef123456',
        email: 'john.doe@example.com',
        username: 'johndoe'
      },
      lesson: {
        id: 'lesson_risk_management_101',
        title: 'Risk Management Fundamentals',
        course_id: 'course_advanced_trading',
        points_value: 25
      },
      completion_type: 'lesson',
      completed_at: '2024-01-15T13:30:00Z'
    },
    created_at: '2024-01-15T13:30:00Z'
  },

  // Member cancellation
  memberCancel: {
    type: 'membership.cancelled',
    data: {
      membership: {
        id: 'mem_1234567890',
        user: {
          id: 'user_abcdef123456',
          email: 'john.doe@example.com',
          username: 'johndoe'
        },
        product_id: 'prod_community_access',
        status: 'cancelled',
        created_at: '2024-01-15T10:30:00Z',
        cancelled_at: '2024-01-20T16:20:00Z'
      },
      reason: 'user_requested'
    },
    created_at: '2024-01-20T16:20:00Z'
  },

  // Purchase with discount applied
  purchaseEvent: {
    type: 'payment.succeeded',
    data: {
      id: 'pay_1234567890abcdef',
      user: {
        id: 'user_abcdef123456',
        email: 'john.doe@example.com',
        username: 'johndoe'
      },
      product_id: 'prod_premium_course',
      amount: 89.99,
      currency: 'USD',
      discount_applied: {
        code: 'GOLD_TIER_10',
        amount: 10,
        type: 'percentage'
      },
      payment_method: 'card',
      created_at: '2024-01-15T12:00:00Z'
    },
    created_at: '2024-01-15T12:00:00Z'
  },

  // User profile update
  userUpdate: {
    type: 'user.updated',
    data: {
      user: {
        id: 'user_abcdef123456',
        email: 'john.doe.new@example.com',
        username: 'johndoe_updated',
        discord_id: '123456789012345678',
        avatar_url: 'https://cdn.whop.com/avatars/user_abcdef123456_new.jpg'
      },
      changes: ['email', 'username', 'avatar_url'],
      updated_at: '2024-01-15T15:30:00Z'
    },
    created_at: '2024-01-15T15:30:00Z'
  }
};

// Example usage patterns

export class WhopWebhookExamples {
  /**
   * Example: Process member join with custom welcome flow
   */
  static async handleMemberJoinWithWelcome(membershipData: any) {
    const { user } = membershipData;
    
    // 1. Initialize engagement profile
    console.log(`Initializing profile for ${user.username}`);
    
    // 2. Award welcome bonus
    const welcomeBonus = 25;
    console.log(`Awarding ${welcomeBonus} welcome points`);
    
    // 3. Send welcome message (integrate with Discord/email)
    console.log(`Sending welcome message to ${user.email}`);
    
    // 4. Assign initial tier and rewards
    console.log(`Checking for tier-based rewards`);
    
    return {
      success: true,
      actions: ['profile_created', 'welcome_bonus_awarded', 'welcome_message_sent']
    };
  }

  /**
   * Example: Handle course completion with achievement unlocking
   */
  static async handleCourseCompletionWithAchievements(courseData: any) {
    const { user, course } = courseData;
    
    // 1. Award course completion points
    const basePoints = course.points_value || 100;
    console.log(`Awarding ${basePoints} points for course completion`);
    
    // 2. Check for streak bonuses
    const streakBonus = await this.calculateStreakBonus(user.id);
    console.log(`Streak bonus: ${streakBonus} points`);
    
    // 3. Unlock course-specific achievements
    const achievements = await this.unlockCourseAchievements(user.id, course.id);
    console.log(`Unlocked ${achievements.length} achievements`);
    
    // 4. Check for tier upgrades
    const tierUpgrade = await this.checkTierUpgrade(user.id);
    console.log(`Tier upgrade: ${tierUpgrade ? 'Yes' : 'No'}`);
    
    return {
      success: true,
      points_awarded: basePoints + streakBonus,
      achievements_unlocked: achievements.length,
      tier_upgraded: tierUpgrade
    };
  }

  /**
   * Example: Handle purchase with smart discount application
   */
  static async handlePurchaseWithSmartDiscounts(purchaseData: any) {
    const { user, product_id, amount, discount_applied } = purchaseData;
    
    // 1. Verify discount eligibility
    if (discount_applied) {
      const isValid = await this.verifyDiscountEligibility(user.id, discount_applied.code);
      console.log(`Discount ${discount_applied.code} valid: ${isValid}`);
    }
    
    // 2. Award purchase points
    const purchasePoints = Math.floor(amount / 10); // 1 point per $10
    console.log(`Awarding ${purchasePoints} purchase points`);
    
    // 3. Mark discount as used
    if (discount_applied) {
      await this.markDiscountAsUsed(user.id, discount_applied.code);
      console.log(`Marked discount ${discount_applied.code} as used`);
    }
    
    // 4. Check for purchase milestones
    const milestones = await this.checkPurchaseMilestones(user.id, amount);
    console.log(`Purchase milestones reached: ${milestones.length}`);
    
    return {
      success: true,
      points_awarded: purchasePoints,
      discount_validated: !!discount_applied,
      milestones_reached: milestones.length
    };
  }

  /**
   * Example: Batch process multiple webhooks
   */
  static async batchProcessWebhooks(webhooks: any[]) {
    const results = [];
    
    for (const webhook of webhooks) {
      try {
        let result;
        
        switch (webhook.type) {
          case 'membership.created':
            result = await this.handleMemberJoinWithWelcome(webhook.data.membership);
            break;
          case 'course.completed':
            result = await this.handleCourseCompletionWithAchievements(webhook.data);
            break;
          case 'payment.succeeded':
            result = await this.handlePurchaseWithSmartDiscounts(webhook.data);
            break;
          default:
            result = { success: true, message: 'Webhook type not handled in batch' };
        }
        
        results.push({
          webhook_id: webhook.id,
          type: webhook.type,
          result
        });
        
      } catch (error) {
        results.push({
          webhook_id: webhook.id,
          type: webhook.type,
          result: { success: false, error: error.message }
        });
      }
    }
    
    return {
      processed: results.length,
      successful: results.filter(r => r.result.success).length,
      failed: results.filter(r => !r.result.success).length,
      results
    };
  }

  // Helper methods (would be implemented with actual logic)
  private static async calculateStreakBonus(userId: string): Promise<number> {
    // Implementation would check user's learning streak
    return Math.floor(Math.random() * 20); // Mock implementation
  }

  private static async unlockCourseAchievements(userId: string, courseId: string): Promise<any[]> {
    // Implementation would check and unlock relevant achievements
    return []; // Mock implementation
  }

  private static async checkTierUpgrade(userId: string): Promise<boolean> {
    // Implementation would check if user qualifies for tier upgrade
    return Math.random() > 0.7; // Mock implementation
  }

  private static async verifyDiscountEligibility(userId: string, discountCode: string): Promise<boolean> {
    // Implementation would verify if user is eligible for the discount
    return true; // Mock implementation
  }

  private static async markDiscountAsUsed(userId: string, discountCode: string): Promise<void> {
    // Implementation would mark the discount reward as used
    console.log(`Marking discount ${discountCode} as used for user ${userId}`);
  }

  private static async checkPurchaseMilestones(userId: string, amount: number): Promise<any[]> {
    // Implementation would check for purchase-based milestones
    return []; // Mock implementation
  }
}

// Webhook signature verification example
export function verifyWhopWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  
  // Check timestamp (within 5 minutes)
  const timestampMs = parseInt(timestamp) * 1000;
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  if (Math.abs(now - timestampMs) > fiveMinutes) {
    return false;
  }
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
  
  const providedSignature = signature.replace('v1=', '');
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(providedSignature, 'hex')
  );
}

// Environment variables needed for webhook integration
export const REQUIRED_ENV_VARS = {
  WHOP_WEBHOOK_SECRET: 'Your webhook secret from Whop dashboard',
  WHOP_API_KEY: 'Your Whop API key for making API calls',
  WHOP_CLIENT_ID: 'Your Whop client ID',
  WHOP_CLIENT_SECRET: 'Your Whop client secret'
};

// Webhook endpoint configuration for Whop dashboard
export const WEBHOOK_CONFIG = {
  endpoint_url: 'https://your-domain.com/api/webhooks/whop',
  events: [
    'membership.created',
    'membership.cancelled',
    'membership.expired',
    'course.completed',
    'lesson.completed',
    'payment.succeeded',
    'user.updated'
  ],
  description: 'Community engagement system webhook integration'
};
