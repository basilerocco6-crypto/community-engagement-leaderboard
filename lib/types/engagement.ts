// TypeScript types for engagement leaderboard database tables

export interface UserEngagement {
  id: string;
  user_id: string;
  username: string;
  total_points: number;
  current_tier: string;
  created_at: string;
  updated_at: string;
}

export interface EngagementEvent {
  id: string;
  user_id: string;
  activity_type: string;
  points_awarded: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface TierReward {
  id: string;
  tier_name: string;
  min_points: number;
  reward_description: string;
  discount_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface UserReward {
  id: string;
  user_id: string;
  tier_name: string;
  unlocked_at: string;
}

// Enum for activity types (extend as needed)
export enum ActivityType {
  // Chat activities
  CHAT_MESSAGE = 'chat_message',
  CHAT_MESSAGE_QUALITY = 'chat_message_quality', // Bonus for high-quality messages
  
  // Forum activities
  FORUM_POST = 'forum_post',
  FORUM_REPLY = 'forum_reply',
  FORUM_POST_QUALITY = 'forum_post_quality', // Bonus for high-quality posts
  
  // Course activities
  COURSE_COMPLETED = 'course_completed',
  LESSON_COMPLETED = 'lesson_completed',
  QUIZ_PASSED = 'quiz_passed',
  
  // General engagement
  REACTION_GIVEN = 'reaction_given',
  THREAD_CREATED = 'thread_created',
  POLL_VOTED = 'poll_voted',
  EVENT_ATTENDED = 'event_attended',
  REFERRAL_MADE = 'referral_made',
  DAILY_LOGIN = 'daily_login',
  PROFILE_COMPLETED = 'profile_completed',
  CONTENT_SHARED = 'content_shared'
}

// Enum for tier names
export enum TierName {
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold',
  PLATINUM = 'Platinum',
  DIAMOND = 'Diamond'
}

// Type for leaderboard entries with additional computed fields
export interface LeaderboardEntry extends UserEngagement {
  rank: number;
  points_this_week?: number;
  points_this_month?: number;
}

// Type for engagement analytics
export interface EngagementAnalytics {
  total_users: number;
  total_points_awarded: number;
  most_active_users: LeaderboardEntry[];
  activity_breakdown: {
    activity_type: string;
    count: number;
    total_points: number;
  }[];
  tier_distribution: {
    tier_name: string;
    user_count: number;
  }[];
}

// Type for user engagement summary
export interface UserEngagementSummary {
  user: UserEngagement;
  recent_events: EngagementEvent[];
  unlocked_rewards: (UserReward & { reward: TierReward })[];
  next_tier?: TierReward;
  points_to_next_tier?: number;
  rank: number;
}

// Quality indicators for content analysis
export interface QualityIndicators {
  length: number;
  hasLinks?: boolean;
  hasMedia?: boolean;
  hasCodeBlocks?: boolean;
  hasQuestions?: boolean;
  hasEmojis?: boolean;
  mentionsCount?: number;
  threadLength?: number; // For forum posts
  upvotes?: number;
  replies?: number;
}

// Chat message specific data
export interface ChatMessageData {
  message_id: string;
  channel_id: string;
  content: string;
  length: number;
  quality_indicators: QualityIndicators;
}

// Forum post specific data
export interface ForumPostData {
  post_id: string;
  forum_id: string;
  title?: string;
  content: string;
  is_reply: boolean;
  parent_post_id?: string;
  quality_indicators: QualityIndicators;
}

// Course completion specific data
export interface CourseCompletionData {
  course_id: string;
  course_title: string;
  completion_percentage: number;
  time_spent_minutes?: number;
  quiz_score?: number;
  lesson_id?: string; // For individual lesson completions
}

// Request/Response types for API endpoints
export interface AddEngagementPointsRequest {
  user_id: string;
  username: string;
  activity_type: ActivityType | string;
  points?: number; // Optional - will be calculated if not provided
  metadata?: Record<string, any>;
  chat_data?: ChatMessageData;
  forum_data?: ForumPostData;
  course_data?: CourseCompletionData;
}

export interface AddEngagementPointsResponse {
  success: boolean;
  user_engagement: UserEngagement;
  new_tier?: string;
  unlocked_rewards?: TierReward[];
}

export interface GetLeaderboardRequest {
  limit?: number;
  offset?: number;
  time_period?: 'all_time' | 'this_month' | 'this_week';
}

export interface GetLeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  total_count: number;
  user_rank?: number;
}

export interface GetUserEngagementRequest {
  user_id: string;
}

export interface GetUserEngagementResponse {
  user_engagement: UserEngagementSummary;
}

export interface GetAnalyticsRequest {
  start_date?: string;
  end_date?: string;
}

export interface GetAnalyticsResponse {
  analytics: EngagementAnalytics;
}

// Tier change history
export interface TierChangeHistory {
  id: string;
  user_id: string;
  previous_tier: string;
  new_tier: string;
  points_at_change: number;
  changed_at: string;
  trigger_activity_id?: string;
}

// Tier information with progress
export interface TierInfo {
  current_tier: TierName;
  current_points: number;
  tier_min_points: number;
  tier_max_points: number | null;
  next_tier?: TierName;
  next_tier_min_points?: number;
  points_to_next_tier?: number;
  progress_percentage: number;
  tier_color: string;
  tier_icon: string;
}

// API types for tier endpoints
export interface GetUserTierRequest {
  user_id: string;
}

export interface GetUserTierResponse {
  success: boolean;
  tier_info: TierInfo;
  tier_history?: TierChangeHistory[];
}

export interface GetTierHistoryRequest {
  user_id: string;
  limit?: number;
  offset?: number;
}

export interface GetTierHistoryResponse {
  success: boolean;
  tier_history: TierChangeHistory[];
  pagination: {
    limit: number;
    offset: number;
    total_count: number;
    hasMore: boolean;
  };
}

// Reward system types
export enum RewardType {
  DISCOUNT_PERCENTAGE = 'discount_percentage',
  DISCOUNT_FIXED = 'discount_fixed',
  SPECIAL_ACCESS = 'special_access',
  CUSTOM_ROLE = 'custom_role',
  EXCLUSIVE_CONTENT = 'exclusive_content',
  PRIORITY_SUPPORT = 'priority_support',
  BETA_ACCESS = 'beta_access',
  CUSTOM_BADGE = 'custom_badge',
  FREE_PRODUCT = 'free_product',
  CUSTOM_REWARD = 'custom_reward'
}

export interface RewardConfiguration {
  id: string;
  community_id: string;
  tier_name: string;
  reward_type: RewardType;
  reward_title: string;
  reward_description: string;
  reward_value?: number; // For discounts, numeric values
  reward_data?: Record<string, any>; // Additional reward-specific data
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRewardUnlock {
  id: string;
  user_id: string;
  reward_config_id: string;
  tier_name: string;
  unlocked_at: string;
  used_at?: string;
  is_active: boolean;
  reward_configuration?: RewardConfiguration;
}

export interface RewardTemplate {
  reward_type: RewardType;
  default_title: string;
  default_description: string;
  requires_value: boolean;
  value_label?: string;
  value_type?: 'percentage' | 'fixed' | 'text' | 'boolean';
  icon: string;
  category: 'discount' | 'access' | 'content' | 'support' | 'custom';
}

// Admin reward configuration types
export interface CreateRewardConfigRequest {
  community_id: string;
  tier_name: string;
  reward_type: RewardType;
  reward_title: string;
  reward_description: string;
  reward_value?: number;
  reward_data?: Record<string, any>;
  is_active?: boolean;
}

export interface UpdateRewardConfigRequest {
  reward_title?: string;
  reward_description?: string;
  reward_value?: number;
  reward_data?: Record<string, any>;
  is_active?: boolean;
}

export interface GetRewardConfigsRequest {
  community_id: string;
  tier_name?: string;
  reward_type?: RewardType;
  is_active?: boolean;
}

export interface GetRewardConfigsResponse {
  success: boolean;
  reward_configurations: RewardConfiguration[];
  total_count: number;
}

export interface GetUserRewardsRequest {
  user_id: string;
  tier_name?: string;
  is_active?: boolean;
}

export interface GetUserRewardsResponse {
  success: boolean;
  user_rewards: UserRewardUnlock[];
  available_rewards: RewardConfiguration[];
  total_unlocked: number;
}

// Reward unlock notification
export interface RewardUnlockNotification {
  user_id: string;
  tier_name: string;
  newly_unlocked_rewards: RewardConfiguration[];
  total_rewards_unlocked: number;
}

// Database function types
export interface AddEngagementPointsFunction {
  p_user_id: string;
  p_username: string;
  p_activity_type: string;
  p_points: number;
  p_metadata?: Record<string, any>;
}

// Points configuration for different activities
export const ACTIVITY_POINTS: Record<ActivityType, number> = {
  // Chat activities (weighted by length and quality)
  [ActivityType.CHAT_MESSAGE]: 3, // Base points for chat message
  [ActivityType.CHAT_MESSAGE_QUALITY]: 7, // Bonus for quality indicators
  
  // Forum activities (posts worth more than replies)
  [ActivityType.FORUM_POST]: 15, // Original forum posts
  [ActivityType.FORUM_REPLY]: 8, // Forum replies
  [ActivityType.FORUM_POST_QUALITY]: 10, // Bonus for quality posts
  
  // Course activities (highest weight)
  [ActivityType.COURSE_COMPLETED]: 100, // Highest points for course completion
  [ActivityType.LESSON_COMPLETED]: 20, // Individual lesson completion
  [ActivityType.QUIZ_PASSED]: 25, // Quiz completion
  
  // General engagement
  [ActivityType.REACTION_GIVEN]: 2,
  [ActivityType.THREAD_CREATED]: 10,
  [ActivityType.POLL_VOTED]: 3,
  [ActivityType.EVENT_ATTENDED]: 20,
  [ActivityType.REFERRAL_MADE]: 50,
  [ActivityType.DAILY_LOGIN]: 5,
  [ActivityType.PROFILE_COMPLETED]: 25,
  [ActivityType.CONTENT_SHARED]: 15
};

// Tier thresholds (should match database values)
export const TIER_THRESHOLDS: Record<TierName, number> = {
  [TierName.BRONZE]: 0,
  [TierName.SILVER]: 101,
  [TierName.GOLD]: 501,
  [TierName.PLATINUM]: 1501,
  [TierName.DIAMOND]: 5000
};

// Tier ranges for display purposes
export const TIER_RANGES: Record<TierName, { min: number; max: number | null }> = {
  [TierName.BRONZE]: { min: 0, max: 100 },
  [TierName.SILVER]: { min: 101, max: 500 },
  [TierName.GOLD]: { min: 501, max: 1500 },
  [TierName.PLATINUM]: { min: 1501, max: 4999 },
  [TierName.DIAMOND]: { min: 5000, max: null }
};

// Tier colors for UI
export const TIER_COLORS: Record<TierName, string> = {
  [TierName.BRONZE]: '#CD7F32',
  [TierName.SILVER]: '#C0C0C0',
  [TierName.GOLD]: '#FFD700',
  [TierName.PLATINUM]: '#E5E4E2',
  [TierName.DIAMOND]: '#B9F2FF'
};

// Tier icons/emojis
export const TIER_ICONS: Record<TierName, string> = {
  [TierName.BRONZE]: '🥉',
  [TierName.SILVER]: '🥈',
  [TierName.GOLD]: '🥇',
  [TierName.PLATINUM]: '💎',
  [TierName.DIAMOND]: '💠'
};

