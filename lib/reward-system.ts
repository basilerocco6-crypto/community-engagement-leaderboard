import { createClient } from '@supabase/supabase-js';
import {
  RewardType,
  RewardConfiguration,
  UserRewardUnlock,
  RewardTemplate,
  CreateRewardConfigRequest,
  UpdateRewardConfigRequest,
  GetRewardConfigsRequest,
  RewardUnlockNotification
} from './types/engagement';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Reward templates for different types
export const REWARD_TEMPLATES: Record<RewardType, RewardTemplate> = {
  [RewardType.DISCOUNT_PERCENTAGE]: {
    reward_type: RewardType.DISCOUNT_PERCENTAGE,
    default_title: 'Percentage Discount',
    default_description: 'Get {value}% off all premium content and products',
    requires_value: true,
    value_label: 'Discount Percentage',
    value_type: 'percentage',
    icon: '💰',
    category: 'discount'
  },
  [RewardType.DISCOUNT_FIXED]: {
    reward_type: RewardType.DISCOUNT_FIXED,
    default_title: 'Fixed Amount Discount',
    default_description: 'Get ${value} off your next purchase',
    requires_value: true,
    value_label: 'Discount Amount ($)',
    value_type: 'fixed',
    icon: '💵',
    category: 'discount'
  },
  [RewardType.SPECIAL_ACCESS]: {
    reward_type: RewardType.SPECIAL_ACCESS,
    default_title: 'Special Access',
    default_description: 'Access to exclusive areas and features',
    requires_value: false,
    icon: '🔓',
    category: 'access'
  },
  [RewardType.CUSTOM_ROLE]: {
    reward_type: RewardType.CUSTOM_ROLE,
    default_title: 'Custom Role',
    default_description: 'Special role with enhanced permissions',
    requires_value: false,
    icon: '👑',
    category: 'access'
  },
  [RewardType.EXCLUSIVE_CONTENT]: {
    reward_type: RewardType.EXCLUSIVE_CONTENT,
    default_title: 'Exclusive Content',
    default_description: 'Access to tier-exclusive content and resources',
    requires_value: false,
    icon: '📚',
    category: 'content'
  },
  [RewardType.PRIORITY_SUPPORT]: {
    reward_type: RewardType.PRIORITY_SUPPORT,
    default_title: 'Priority Support',
    default_description: 'Faster response times and priority assistance',
    requires_value: false,
    icon: '🚀',
    category: 'support'
  },
  [RewardType.BETA_ACCESS]: {
    reward_type: RewardType.BETA_ACCESS,
    default_title: 'Beta Access',
    default_description: 'Early access to new features and beta testing',
    requires_value: false,
    icon: '🧪',
    category: 'access'
  },
  [RewardType.CUSTOM_BADGE]: {
    reward_type: RewardType.CUSTOM_BADGE,
    default_title: 'Custom Badge',
    default_description: 'Exclusive badge and recognition',
    requires_value: false,
    icon: '🏆',
    category: 'custom'
  },
  [RewardType.FREE_PRODUCT]: {
    reward_type: RewardType.FREE_PRODUCT,
    default_title: 'Free Product',
    default_description: 'Complimentary product or service',
    requires_value: false,
    icon: '🎁',
    category: 'custom'
  },
  [RewardType.CUSTOM_REWARD]: {
    reward_type: RewardType.CUSTOM_REWARD,
    default_title: 'Custom Reward',
    default_description: 'Custom reward defined by community owner',
    requires_value: false,
    icon: '⭐',
    category: 'custom'
  }
};

export class RewardSystem {
  /**
   * Create a new reward configuration
   */
  static async createRewardConfiguration(request: CreateRewardConfigRequest): Promise<RewardConfiguration> {
    try {
      const { data, error } = await supabase
        .from('reward_configurations')
        .insert({
          community_id: request.community_id,
          tier_name: request.tier_name,
          reward_type: request.reward_type,
          reward_title: request.reward_title,
          reward_description: request.reward_description,
          reward_value: request.reward_value,
          reward_data: request.reward_data || {},
          is_active: request.is_active !== undefined ? request.is_active : true
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating reward configuration:', error);
      throw error;
    }
  }

  /**
   * Update an existing reward configuration
   */
  static async updateRewardConfiguration(
    configId: string, 
    request: UpdateRewardConfigRequest
  ): Promise<RewardConfiguration> {
    try {
      const updateData: any = {};
      
      if (request.reward_title !== undefined) updateData.reward_title = request.reward_title;
      if (request.reward_description !== undefined) updateData.reward_description = request.reward_description;
      if (request.reward_value !== undefined) updateData.reward_value = request.reward_value;
      if (request.reward_data !== undefined) updateData.reward_data = request.reward_data;
      if (request.is_active !== undefined) updateData.is_active = request.is_active;

      const { data, error } = await supabase
        .from('reward_configurations')
        .update(updateData)
        .eq('id', configId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating reward configuration:', error);
      throw error;
    }
  }

  /**
   * Delete a reward configuration
   */
  static async deleteRewardConfiguration(configId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('reward_configurations')
        .delete()
        .eq('id', configId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting reward configuration:', error);
      throw error;
    }
  }

  /**
   * Get reward configurations based on filters
   */
  static async getRewardConfigurations(request: GetRewardConfigsRequest): Promise<{
    configurations: RewardConfiguration[];
    totalCount: number;
  }> {
    try {
      let query = supabase
        .from('reward_configurations')
        .select('*', { count: 'exact' })
        .eq('community_id', request.community_id);

      if (request.tier_name) {
        query = query.eq('tier_name', request.tier_name);
      }

      if (request.reward_type) {
        query = query.eq('reward_type', request.reward_type);
      }

      if (request.is_active !== undefined) {
        query = query.eq('is_active', request.is_active);
      }

      query = query.order('tier_name').order('reward_type');

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        configurations: data || [],
        totalCount: count || 0
      };
    } catch (error) {
      console.error('Error getting reward configurations:', error);
      throw error;
    }
  }

  /**
   * Get user's unlocked rewards
   */
  static async getUserRewards(
    userId: string, 
    communityId: string = 'default'
  ): Promise<{
    unlockedRewards: UserRewardUnlock[];
    availableRewards: RewardConfiguration[];
    totalUnlocked: number;
  }> {
    try {
      // Get unlocked rewards using the database function
      const { data: unlockedData, error: unlockedError } = await supabase
        .rpc('get_user_rewards', {
          p_user_id: userId,
          p_community_id: communityId
        });

      if (unlockedError) {
        throw unlockedError;
      }

      // Transform the data to match our interface
      const unlockedRewards: UserRewardUnlock[] = (unlockedData || []).map((row: any) => ({
        id: row.reward_id,
        user_id: userId,
        reward_config_id: row.reward_id,
        tier_name: row.tier_name,
        unlocked_at: row.unlocked_at,
        used_at: row.used_at,
        is_active: row.is_active,
        reward_configuration: {
          id: row.reward_id,
          community_id: communityId,
          tier_name: row.tier_name,
          reward_type: row.reward_type,
          reward_title: row.reward_title,
          reward_description: row.reward_description,
          reward_value: row.reward_value,
          reward_data: row.reward_data,
          is_active: row.is_active,
          created_at: '',
          updated_at: ''
        }
      }));

      // Get all available rewards for this community
      const { configurations: availableRewards } = await this.getRewardConfigurations({
        community_id: communityId,
        is_active: true
      });

      return {
        unlockedRewards,
        availableRewards,
        totalUnlocked: unlockedRewards.length
      };
    } catch (error) {
      console.error('Error getting user rewards:', error);
      throw error;
    }
  }

  /**
   * Manually unlock a reward for a user (admin function)
   */
  static async unlockRewardForUser(
    userId: string,
    rewardConfigId: string,
    tierName: string
  ): Promise<UserRewardUnlock> {
    try {
      const { data, error } = await supabase
        .from('user_reward_unlocks')
        .insert({
          user_id: userId,
          reward_config_id: rewardConfigId,
          tier_name: tierName
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error unlocking reward for user:', error);
      throw error;
    }
  }

  /**
   * Mark a reward as used
   */
  static async useReward(userId: string, rewardConfigId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('use_reward', {
          p_user_id: userId,
          p_reward_config_id: rewardConfigId
        });

      if (error) {
        throw error;
      }

      return data === true;
    } catch (error) {
      console.error('Error using reward:', error);
      return false;
    }
  }

  /**
   * Get rewards by tier for display purposes
   */
  static async getRewardsByTier(
    communityId: string,
    tierName: string
  ): Promise<RewardConfiguration[]> {
    try {
      const { configurations } = await this.getRewardConfigurations({
        community_id: communityId,
        tier_name: tierName,
        is_active: true
      });

      return configurations;
    } catch (error) {
      console.error('Error getting rewards by tier:', error);
      return [];
    }
  }

  /**
   * Generate reward description with value substitution
   */
  static generateRewardDescription(
    template: RewardTemplate,
    value?: number,
    customDescription?: string
  ): string {
    if (customDescription) {
      return customDescription;
    }

    let description = template.default_description;
    
    if (value !== undefined && template.requires_value) {
      description = description.replace('{value}', value.toString());
    }

    return description;
  }

  /**
   * Validate reward configuration
   */
  static validateRewardConfiguration(request: CreateRewardConfigRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!request.reward_title?.trim()) {
      errors.push('Reward title is required');
    }

    if (!request.reward_description?.trim()) {
      errors.push('Reward description is required');
    }

    if (!Object.values(RewardType).includes(request.reward_type)) {
      errors.push('Invalid reward type');
    }

    const template = REWARD_TEMPLATES[request.reward_type];
    if (template?.requires_value && (request.reward_value === undefined || request.reward_value <= 0)) {
      errors.push(`${template.value_label} is required and must be greater than 0`);
    }

    if (request.reward_type === RewardType.DISCOUNT_PERCENTAGE && request.reward_value && request.reward_value > 100) {
      errors.push('Discount percentage cannot exceed 100%');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get reward statistics for a community
   */
  static async getRewardStatistics(communityId: string): Promise<{
    totalConfigurations: number;
    activeConfigurations: number;
    totalUnlocks: number;
    rewardsByTier: Record<string, number>;
    rewardsByType: Record<string, number>;
  }> {
    try {
      // Get total configurations
      const { count: totalConfigurations } = await supabase
        .from('reward_configurations')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId);

      // Get active configurations
      const { count: activeConfigurations } = await supabase
        .from('reward_configurations')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
        .eq('is_active', true);

      // Get total unlocks
      const { count: totalUnlocks } = await supabase
        .from('user_reward_unlocks')
        .select(`
          *,
          reward_configurations!inner(community_id)
        `, { count: 'exact', head: true })
        .eq('reward_configurations.community_id', communityId);

      // Get rewards by tier
      const { data: tierData } = await supabase
        .from('reward_configurations')
        .select('tier_name')
        .eq('community_id', communityId)
        .eq('is_active', true);

      const rewardsByTier: Record<string, number> = {};
      tierData?.forEach(row => {
        rewardsByTier[row.tier_name] = (rewardsByTier[row.tier_name] || 0) + 1;
      });

      // Get rewards by type
      const { data: typeData } = await supabase
        .from('reward_configurations')
        .select('reward_type')
        .eq('community_id', communityId)
        .eq('is_active', true);

      const rewardsByType: Record<string, number> = {};
      typeData?.forEach(row => {
        rewardsByType[row.reward_type] = (rewardsByType[row.reward_type] || 0) + 1;
      });

      return {
        totalConfigurations: totalConfigurations || 0,
        activeConfigurations: activeConfigurations || 0,
        totalUnlocks: totalUnlocks || 0,
        rewardsByTier,
        rewardsByType
      };
    } catch (error) {
      console.error('Error getting reward statistics:', error);
      return {
        totalConfigurations: 0,
        activeConfigurations: 0,
        totalUnlocks: 0,
        rewardsByTier: {},
        rewardsByType: {}
      };
    }
  }

  /**
   * Bulk create default rewards for a community
   */
  static async createDefaultRewards(communityId: string): Promise<RewardConfiguration[]> {
    try {
      const defaultRewards = [
        {
          community_id: communityId,
          tier_name: 'Bronze',
          reward_type: RewardType.SPECIAL_ACCESS,
          reward_title: 'Community Access',
          reward_description: 'Welcome to the community with basic access to all channels'
        },
        {
          community_id: communityId,
          tier_name: 'Silver',
          reward_type: RewardType.DISCOUNT_PERCENTAGE,
          reward_title: 'Silver Member Discount',
          reward_description: 'Get 5% off all premium content and products',
          reward_value: 5
        },
        {
          community_id: communityId,
          tier_name: 'Gold',
          reward_type: RewardType.DISCOUNT_PERCENTAGE,
          reward_title: 'Gold Member Discount',
          reward_description: 'Get 10% off all premium content and products',
          reward_value: 10
        },
        {
          community_id: communityId,
          tier_name: 'Platinum',
          reward_type: RewardType.DISCOUNT_PERCENTAGE,
          reward_title: 'Platinum Member Discount',
          reward_description: 'Get 15% off all premium content and products',
          reward_value: 15
        },
        {
          community_id: communityId,
          tier_name: 'Diamond',
          reward_type: RewardType.DISCOUNT_PERCENTAGE,
          reward_title: 'Diamond Member Discount',
          reward_description: 'Get 20% off all premium content and products',
          reward_value: 20
        }
      ];

      const { data, error } = await supabase
        .from('reward_configurations')
        .insert(defaultRewards)
        .select();

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error creating default rewards:', error);
      throw error;
    }
  }
}
