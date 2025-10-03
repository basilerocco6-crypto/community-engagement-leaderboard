// Example usage of the Reward System
// This file demonstrates how to use the automatic rewards unlocking system

import { RewardSystem, REWARD_TEMPLATES } from './reward-system';
import { RewardType, CreateRewardConfigRequest } from './types/engagement';

// Example 1: Create reward configurations for a community
export async function exampleCreateRewards() {
  console.log('Creating Reward Configurations:');
  
  const communityId = 'my-community-123';
  
  const rewardConfigs: CreateRewardConfigRequest[] = [
    {
      community_id: communityId,
      tier_name: 'Silver',
      reward_type: RewardType.DISCOUNT_PERCENTAGE,
      reward_title: 'Silver Member Discount',
      reward_description: 'Get 10% off all premium courses and content',
      reward_value: 10,
      is_active: true
    },
    {
      community_id: communityId,
      tier_name: 'Gold',
      reward_type: RewardType.EXCLUSIVE_CONTENT,
      reward_title: 'Gold Exclusive Library',
      reward_description: 'Access to Gold-only courses, templates, and resources',
      is_active: true
    },
    {
      community_id: communityId,
      tier_name: 'Platinum',
      reward_type: RewardType.PRIORITY_SUPPORT,
      reward_title: 'VIP Support',
      reward_description: 'Direct access to community managers with priority response',
      is_active: true
    },
    {
      community_id: communityId,
      tier_name: 'Diamond',
      reward_type: RewardType.CUSTOM_REWARD,
      reward_title: '1-on-1 Mentorship Session',
      reward_description: 'Monthly 1-hour mentorship session with community founder',
      reward_data: {
        session_duration: 60,
        frequency: 'monthly',
        booking_link: 'https://calendly.com/founder/diamond-members'
      },
      is_active: true
    }
  ];

  for (const config of rewardConfigs) {
    try {
      const reward = await RewardSystem.createRewardConfiguration(config);
      console.log(`Created reward: ${reward.reward_title} for ${reward.tier_name} tier`);
    } catch (error) {
      console.error(`Failed to create reward: ${config.reward_title}`, error);
    }
  }
}

// Example 2: Get user's rewards
export async function exampleGetUserRewards(userId: string) {
  console.log('Fetching User Rewards:');
  
  const { unlockedRewards, availableRewards, totalUnlocked } = await RewardSystem.getUserRewards(
    userId,
    'my-community-123'
  );

  console.log(`User has unlocked ${totalUnlocked} rewards:`);
  unlockedRewards.forEach(reward => {
    const status = reward.used_at ? 'USED' : 'AVAILABLE';
    console.log(`- ${reward.reward_configuration?.reward_title} (${status})`);
  });

  console.log(`\nAvailable rewards in community: ${availableRewards.length}`);
  availableRewards.forEach(reward => {
    const isUnlocked = unlockedRewards.some(ur => ur.reward_config_id === reward.id);
    console.log(`- ${reward.reward_title} (${reward.tier_name}) - ${isUnlocked ? 'UNLOCKED' : 'LOCKED'}`);
  });
}

// Example 3: Admin reward management
export async function exampleAdminRewardManagement() {
  console.log('Admin Reward Management:');
  
  const communityId = 'my-community-123';
  
  // Get all reward configurations
  const { configurations, totalCount } = await RewardSystem.getRewardConfigurations({
    community_id: communityId
  });
  
  console.log(`Total reward configurations: ${totalCount}`);
  
  // Get statistics
  const stats = await RewardSystem.getRewardStatistics(communityId);
  console.log('Reward Statistics:', {
    totalConfigurations: stats.totalConfigurations,
    activeConfigurations: stats.activeConfigurations,
    totalUnlocks: stats.totalUnlocks,
    rewardsByTier: stats.rewardsByTier,
    rewardsByType: stats.rewardsByType
  });

  // Update a reward configuration
  if (configurations.length > 0) {
    const firstReward = configurations[0];
    try {
      const updatedReward = await RewardSystem.updateRewardConfiguration(firstReward.id, {
        reward_description: 'Updated description with more details',
        is_active: true
      });
      console.log(`Updated reward: ${updatedReward.reward_title}`);
    } catch (error) {
      console.error('Failed to update reward:', error);
    }
  }
}

// Example 4: Reward templates usage
export function exampleRewardTemplates() {
  console.log('Available Reward Templates:');
  
  Object.values(REWARD_TEMPLATES).forEach(template => {
    console.log(`${template.icon} ${template.default_title}`);
    console.log(`  Category: ${template.category}`);
    console.log(`  Description: ${template.default_description}`);
    console.log(`  Requires Value: ${template.requires_value}`);
    if (template.requires_value) {
      console.log(`  Value Type: ${template.value_type}`);
      console.log(`  Value Label: ${template.value_label}`);
    }
    console.log('---');
  });
}

// Example 5: Bulk create default rewards
export async function exampleCreateDefaultRewards() {
  console.log('Creating Default Rewards:');
  
  const communityId = 'new-community-456';
  
  try {
    const defaultRewards = await RewardSystem.createDefaultRewards(communityId);
    console.log(`Created ${defaultRewards.length} default rewards:`);
    defaultRewards.forEach(reward => {
      console.log(`- ${reward.reward_title} (${reward.tier_name})`);
    });
  } catch (error) {
    console.error('Failed to create default rewards:', error);
  }
}

// Example 6: Use a reward
export async function exampleUseReward(userId: string, rewardConfigId: string) {
  console.log('Using Reward:');
  
  const success = await RewardSystem.useReward(userId, rewardConfigId);
  
  if (success) {
    console.log('Reward used successfully!');
    // In a real app, you might:
    // - Generate a discount code
    // - Grant special access
    // - Send notification to user
    // - Update user's profile/permissions
  } else {
    console.log('Failed to use reward - reward not found or already used');
  }
}

// Example 7: Reward validation
export function exampleRewardValidation() {
  console.log('Reward Validation Examples:');
  
  const validReward: CreateRewardConfigRequest = {
    community_id: 'test-community',
    tier_name: 'Gold',
    reward_type: RewardType.DISCOUNT_PERCENTAGE,
    reward_title: 'Gold Discount',
    reward_description: 'Get 15% off all products',
    reward_value: 15
  };

  const invalidReward: CreateRewardConfigRequest = {
    community_id: 'test-community',
    tier_name: 'Gold',
    reward_type: RewardType.DISCOUNT_PERCENTAGE,
    reward_title: '', // Invalid: empty title
    reward_description: 'Get discount',
    reward_value: 150 // Invalid: percentage > 100
  };

  const validValidation = RewardSystem.validateRewardConfiguration(validReward);
  const invalidValidation = RewardSystem.validateRewardConfiguration(invalidReward);

  console.log('Valid reward validation:', validValidation);
  console.log('Invalid reward validation:', invalidValidation);
}

// Example 8: API usage patterns
export const rewardApiExamples = {
  // Admin endpoints
  createReward: {
    method: 'POST',
    url: '/api/admin/rewards',
    body: {
      community_id: 'my-community',
      tier_name: 'Gold',
      reward_type: 'discount_percentage',
      reward_title: 'Gold Member Discount',
      reward_description: 'Get 15% off all premium content',
      reward_value: 15,
      is_active: true
    }
  },

  getRewards: {
    method: 'GET',
    url: '/api/admin/rewards?community_id=my-community&tier_name=Gold',
    description: 'Get all rewards for Gold tier'
  },

  updateReward: {
    method: 'PUT',
    url: '/api/admin/rewards/[reward-id]',
    body: {
      reward_title: 'Updated Title',
      reward_value: 20,
      is_active: false
    }
  },

  deleteReward: {
    method: 'DELETE',
    url: '/api/admin/rewards/[reward-id]',
    description: 'Delete a reward configuration'
  },

  getStatistics: {
    method: 'GET',
    url: '/api/admin/rewards/statistics?community_id=my-community',
    description: 'Get reward statistics for admin dashboard'
  },

  getTemplates: {
    method: 'GET',
    url: '/api/admin/rewards/templates',
    description: 'Get available reward templates'
  },

  // User endpoints
  getUserRewards: {
    method: 'GET',
    url: '/api/rewards/user?community_id=my-community',
    description: 'Get current user\'s unlocked rewards'
  },

  useReward: {
    method: 'POST',
    url: '/api/rewards/use',
    body: {
      reward_config_id: 'reward-uuid'
    },
    description: 'Mark a reward as used'
  }
};

// Example 9: React component usage
export const componentUsageExamples = {
  rewardCard: `
    // Display a single reward
    <RewardCard
      reward={rewardConfiguration}
      isUnlocked={true}
      isUsed={false}
      unlockedAt="2024-01-15T10:30:00Z"
      onUse={(rewardId) => handleUseReward(rewardId)}
    />
  `,

  rewardList: `
    // Display user's rewards with tabs
    <RewardList
      unlockedRewards={userRewards}
      availableRewards={allRewards}
      onUseReward={(rewardId) => handleUseReward(rewardId)}
      showAll={true}
    />
  `,

  rewardSummary: `
    // Show reward statistics
    <RewardSummary
      unlockedRewards={userRewards}
      totalAvailable={allRewards.length}
    />
  `,

  rewardNotification: `
    // Show notification when new rewards are unlocked
    <RewardNotification
      newRewards={newlyUnlockedRewards}
      onClose={() => setShowNotification(false)}
    />
  `,

  adminPage: `
    // Full admin interface
    <AdminRewardsPage />
    // Accessible at /admin/rewards
  `
};

// Example 10: Integration with tier system
export async function exampleTierRewardIntegration(userId: string) {
  console.log('Tier-Reward Integration Example:');
  
  // When user reaches a new tier, rewards are automatically unlocked
  // This happens via database triggers, but you can also check manually:
  
  const { unlockedRewards } = await RewardSystem.getUserRewards(userId);
  
  // Get user's current tier (from tier system)
  // const tierInfo = await TierSystem.getUserTierInfo(userId);
  
  console.log('Integration points:');
  console.log('1. Database triggers automatically unlock rewards on tier upgrade');
  console.log('2. API endpoints provide reward data for UI components');
  console.log('3. Admin interface allows customization of tier rewards');
  console.log('4. User interface shows available and unlocked rewards');
  console.log('5. Reward usage tracking for analytics and limits');
}

// Example 11: Custom reward types
export function exampleCustomRewardTypes() {
  console.log('Custom Reward Type Examples:');
  
  const customRewards = [
    {
      reward_type: RewardType.FREE_PRODUCT,
      reward_title: 'Free Course Access',
      reward_description: 'Get free access to any course under $50',
      reward_data: {
        max_value: 50,
        valid_categories: ['beginner', 'intermediate'],
        expiry_days: 30
      }
    },
    {
      reward_type: RewardType.CUSTOM_BADGE,
      reward_title: 'Community Champion Badge',
      reward_description: 'Special badge displayed on your profile',
      reward_data: {
        badge_image: 'https://example.com/champion-badge.png',
        badge_color: '#FFD700',
        display_priority: 1
      }
    },
    {
      reward_type: RewardType.BETA_ACCESS,
      reward_title: 'Beta Tester Access',
      reward_description: 'Early access to new features and beta programs',
      reward_data: {
        beta_programs: ['mobile-app', 'ai-features', 'advanced-analytics'],
        access_level: 'full'
      }
    }
  ];

  customRewards.forEach(reward => {
    console.log(`${reward.reward_title}:`);
    console.log(`  Type: ${reward.reward_type}`);
    console.log(`  Data:`, reward.reward_data);
    console.log('---');
  });
}
