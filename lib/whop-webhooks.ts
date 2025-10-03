import { getSupabaseClient } from '@/lib/supabase';
import { EngagementTracker } from '@/lib/engagement-core';
import { RewardSystem } from '@/lib/reward-system';
import { ActivityType } from '@/lib/types/engagement';
import crypto from 'crypto';

export interface WhopWebhookPayload {
  id: string;
  type: string;
  data: any;
  created_at: string;
}

export interface WhopUser {
  id: string;
  email: string;
  username?: string;
  discord_id?: string;
  avatar_url?: string;
}

export interface WhopMembership {
  id: string;
  user: WhopUser;
  product_id: string;
  status: string;
  created_at: string;
  expires_at?: string;
}

export interface WhopCourse {
  id: string;
  title: string;
  description?: string;
  points_value?: number;
}

export interface WhopLesson {
  id: string;
  title: string;
  course_id: string;
  points_value?: number;
}

export interface WhopPurchase {
  id: string;
  user: WhopUser;
  product_id: string;
  amount: number;
  currency: string;
  discount_applied?: {
    code: string;
    amount: number;
    type: 'percentage' | 'fixed';
  };
}

export class WhopWebhookHandler {
  private static supabase = getSupabaseClient();

  /**
   * Verify webhook signature from Whop
   */
  static async verifySignature(payload: string, signature: string, timestamp: string): Promise<boolean> {
    try {
      const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error('WHOP_WEBHOOK_SECRET not configured');
        return false;
      }

      // Check timestamp to prevent replay attacks (within 5 minutes)
      const timestampMs = parseInt(timestamp) * 1000;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (Math.abs(now - timestampMs) > fiveMinutes) {
        console.error('Webhook timestamp too old');
        return false;
      }

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(`${timestamp}.${payload}`)
        .digest('hex');

      const providedSignature = signature.replace('v1=', '');
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Handle new member joining the community
   */
  static async handleMemberJoin(data: { membership?: WhopMembership; user?: WhopUser }): Promise<any> {
    try {
      const user = data.membership?.user || data.user;
      if (!user) {
        throw new Error('No user data in membership webhook');
      }

      console.log(`Processing member join for user: ${user.id}`);

      // Check if user already exists in our system
      const { data: existingUser } = await this.supabase
        .from('user_engagement')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingUser) {
        console.log(`User ${user.id} already exists, updating profile`);
        
        // Update existing user profile
        const { error: updateError } = await this.supabase
          .from('user_engagement')
          .update({
            username: user.username || existingUser.username,
            email: user.email,
            avatar_url: user.avatar_url,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) {
          throw updateError;
        }

        return { success: true, action: 'updated_existing_user', user_id: user.id };
      }

      // Create new user engagement profile
      const { error: insertError } = await this.supabase
        .from('user_engagement')
        .insert({
          user_id: user.id,
          username: user.username || user.email.split('@')[0],
          email: user.email,
          avatar_url: user.avatar_url,
          total_points: 0,
          current_tier: 'Bronze',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        throw insertError;
      }

      // Award welcome bonus points
      const welcomePoints = 10;
      await EngagementTracker.recordEngagement({
        user_id: user.id,
        activity_type: ActivityType.PROFILE_COMPLETED,
        points_awarded: welcomePoints,
        metadata: {
          source: 'whop_webhook',
          event_type: 'member_join',
          welcome_bonus: true
        }
      });

      // Check for any tier-based rewards to unlock
      await RewardSystem.checkAndUnlockRewards(user.id);

      console.log(`Successfully created engagement profile for user: ${user.id}`);

      return {
        success: true,
        action: 'created_new_user',
        user_id: user.id,
        welcome_points: welcomePoints
      };

    } catch (error) {
      console.error('Error handling member join:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle course/lesson completion with enhanced Whop Courses integration
   */
  static async handleCourseCompletion(data: { 
    user: WhopUser; 
    course?: WhopCourse; 
    lesson?: WhopLesson;
    module?: any;
    completion_type: 'course' | 'lesson' | 'module';
    completion_data?: {
      time_spent_minutes?: number;
      score?: number;
      attempts?: number;
      started_at?: string;
    };
  }): Promise<any> {
    try {
      const { user, course, lesson, module, completion_type, completion_data } = data;
      
      console.log(`Processing ${completion_type} completion for user: ${user.id}`);

      // Ensure user exists in our system
      await this.ensureUserExists(user);

      // Import course engagement tracker
      const { CourseEngagementTracker } = await import('./whop-courses-api');

      if (completion_type === 'course' && course) {
        // Calculate completion time if we have start date
        const completionTimeDays = completion_data?.started_at 
          ? Math.ceil((Date.now() - new Date(completion_data.started_at).getTime()) / (1000 * 60 * 60 * 24))
          : 30; // Default assumption

        // Process course completion with enhanced tracking
        const result = await CourseEngagementTracker.processCourseCompletion({
          user_id: user.id,
          course_id: course.id,
          completion_time_days: completionTimeDays,
          final_score: completion_data?.score
        });

        return {
          success: result.success,
          action: 'course_completed',
          user_id: user.id,
          course_id: course.id,
          points_awarded: result.points_awarded,
          certificate_issued: result.certificate_issued
        };

      } else if ((completion_type === 'lesson' || completion_type === 'module') && (lesson || module)) {
        const moduleData = module || lesson;
        
        // Process module completion with enhanced tracking
        const result = await CourseEngagementTracker.processModuleCompletion({
          user_id: user.id,
          course_id: moduleData.course_id,
          module_id: moduleData.id,
          time_spent_minutes: completion_data?.time_spent_minutes,
          score: completion_data?.score
        });

        return {
          success: result.success,
          action: 'module_completed',
          user_id: user.id,
          course_id: moduleData.course_id,
          module_id: moduleData.id,
          points_awarded: result.points_awarded,
          tier_upgraded: result.tier_upgraded
        };
      }

      throw new Error('Invalid completion data provided');

    } catch (error) {
      console.error('Error handling course completion:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle member cancellation/leaving
   */
  static async handleMemberCancel(data: { 
    membership?: WhopMembership; 
    user?: WhopUser;
    reason?: string;
  }): Promise<any> {
    try {
      const user = data.membership?.user || data.user;
      if (!user) {
        throw new Error('No user data in cancellation webhook');
      }

      console.log(`Processing member cancellation for user: ${user.id}`);

      // Mark user as inactive but don't delete data
      const { error: updateError } = await this.supabase
        .from('user_engagement')
        .update({
          is_active: false,
          cancelled_at: new Date().toISOString(),
          cancellation_reason: data.reason,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Archive user's active rewards (mark as expired)
      const { error: rewardError } = await this.supabase
        .from('user_reward_unlocks')
        .update({
          is_active: false,
          expired_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (rewardError) {
        console.error('Error archiving user rewards:', rewardError);
      }

      // Log the cancellation event
      await this.supabase
        .from('engagement_events')
        .insert({
          user_id: user.id,
          activity_type: 'MEMBER_CANCELLED',
          points_awarded: 0,
          metadata: {
            source: 'whop_webhook',
            reason: data.reason,
            archived_at: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });

      console.log(`Successfully archived data for cancelled user: ${user.id}`);

      return {
        success: true,
        action: 'member_cancelled',
        user_id: user.id,
        archived: true
      };

    } catch (error) {
      console.error('Error handling member cancellation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle purchase events and apply discounts
   */
  static async handlePurchaseEvent(data: WhopPurchase): Promise<any> {
    try {
      const { user, product_id, amount, discount_applied } = data;
      
      console.log(`Processing purchase event for user: ${user.id}`);

      // Ensure user exists in our system
      await this.ensureUserExists(user);

      // Check if user has any unlocked discount rewards
      const { data: userRewards } = await this.supabase
        .from('user_reward_unlocks')
        .select(`
          *,
          reward_configurations!inner(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('reward_configurations.reward_type', 'discount')
        .is('used_at', null);

      let appliedDiscount = null;
      let discountRewardId = null;

      // If a discount was applied, find the matching reward
      if (discount_applied && userRewards && userRewards.length > 0) {
        // Find the reward that matches the applied discount
        const matchingReward = userRewards.find(reward => {
          const rewardData = reward.reward_configurations.reward_data;
          return rewardData.discount_code === discount_applied.code ||
                 rewardData.discount_percent === discount_applied.amount;
        });

        if (matchingReward) {
          appliedDiscount = discount_applied;
          discountRewardId = matchingReward.id;

          // Mark the discount reward as used
          await this.supabase
            .from('user_reward_unlocks')
            .update({
              used_at: new Date().toISOString(),
              usage_metadata: {
                purchase_id: data.id,
                purchase_amount: amount,
                discount_applied: discount_applied
              }
            })
            .eq('id', matchingReward.id);

          console.log(`Applied discount reward for user: ${user.id}`);
        }
      }

      // Award points for making a purchase (optional)
      const purchasePoints = Math.floor(amount / 10); // 1 point per $10 spent
      if (purchasePoints > 0) {
        await EngagementTracker.recordEngagement({
          user_id: user.id,
          activity_type: ActivityType.CONTENT_SHARED, // Using as generic purchase activity
          points_awarded: purchasePoints,
          metadata: {
            source: 'whop_webhook',
            event_type: 'purchase',
            purchase_id: data.id,
            product_id,
            amount,
            currency: data.currency,
            discount_applied: appliedDiscount
          }
        });
      }

      // Log the purchase event
      await this.supabase
        .from('purchase_events')
        .insert({
          user_id: user.id,
          purchase_id: data.id,
          product_id,
          amount,
          currency: data.currency,
          discount_applied: appliedDiscount,
          reward_used_id: discountRewardId,
          points_awarded: purchasePoints,
          created_at: new Date().toISOString()
        });

      return {
        success: true,
        action: 'purchase_processed',
        user_id: user.id,
        purchase_id: data.id,
        points_awarded: purchasePoints,
        discount_applied: appliedDiscount
      };

    } catch (error) {
      console.error('Error handling purchase event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle user profile updates
   */
  static async handleUserUpdate(data: { user: WhopUser }): Promise<any> {
    try {
      const { user } = data;
      
      console.log(`Processing user update for: ${user.id}`);

      // Update user profile in our system
      const { error: updateError } = await this.supabase
        .from('user_engagement')
        .update({
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      return {
        success: true,
        action: 'user_updated',
        user_id: user.id
      };

    } catch (error) {
      console.error('Error handling user update:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ensure user exists in our engagement system
   */
  private static async ensureUserExists(user: WhopUser): Promise<void> {
    const { data: existingUser } = await this.supabase
      .from('user_engagement')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!existingUser) {
      // Create user if they don't exist
      await this.handleMemberJoin({ user });
    }
  }

  /**
   * Test webhook endpoint connectivity
   */
  static async testWebhook(): Promise<any> {
    try {
      const testPayload = {
        type: 'test',
        data: {
          message: 'Webhook test successful',
          timestamp: new Date().toISOString()
        }
      };

      // Log test event
      await this.supabase
        .from('webhook_events')
        .insert({
          event_type: 'test',
          payload: testPayload,
          processing_result: { success: true },
          processed_at: new Date().toISOString(),
          success: true
        });

      return {
        success: true,
        message: 'Webhook test completed successfully',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Webhook test failed:', error);
      return { success: false, error: error.message };
    }
  }
}
