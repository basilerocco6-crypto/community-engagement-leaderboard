/**
 * Helper functions and constants for the engagement system
 */

import { ActivityType } from './supabase';

// Common activity types for easy reference
export const ACTIVITY_TYPES = {
  // Chat activities
  CHAT_MESSAGE: 'chat_message',
  CHAT_REACTION: 'chat_reaction',
  HELPFUL_RESPONSE: 'helpful_response',
  
  // Forum activities
  FORUM_POST: 'forum_post',
  FORUM_REPLY: 'forum_reply',
  FORUM_LIKE_RECEIVED: 'forum_like_received',
  
  // Learning activities
  COURSE_STARTED: 'course_started',
  COURSE_COMPLETED: 'course_completed',
  LESSON_COMPLETED: 'lesson_completed',
  QUIZ_PASSED: 'quiz_passed',
  
  // Community activities
  DAILY_LOGIN: 'daily_login',
  PROFILE_UPDATED: 'profile_updated',
  REFERRAL_SIGNUP: 'referral_signup',
  EVENT_ATTENDANCE: 'event_attendance',
  
  // Content creation
  CONTENT_SHARED: 'content_shared',
  TUTORIAL_CREATED: 'tutorial_created',
  RESOURCE_CONTRIBUTED: 'resource_contributed',
} as const;

// Tier names for easy reference
export const TIER_NAMES = {
  NEWCOMER: 'Newcomer',
  REGULAR: 'Regular',
  CONTRIBUTOR: 'Contributor',
  CHAMPION: 'Champion',
  LEGEND: 'Legend',
} as const;

// Reward types
export const REWARD_TYPES = {
  BADGE: 'badge',
  DISCOUNT: 'discount',
  ACCESS: 'access',
  PHYSICAL: 'physical',
  EXPERIENCE: 'experience',
} as const;

// Activity categories
export const ACTIVITY_CATEGORIES = {
  CHAT: 'chat',
  FORUM: 'forum',
  LEARNING: 'learning',
  ENGAGEMENT: 'engagement',
  REFERRAL: 'referral',
  EVENTS: 'events',
  CONTENT: 'content',
} as const;

/**
 * Helper to create activity metadata
 */
export function createActivityMetadata(data: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    timestamp: new Date().toISOString(),
    source: 'web_app',
    ...data,
  };
}

/**
 * Helper to format points display
 */
export function formatPoints(points: number): string {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M`;
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K`;
  }
  return points.toString();
}

/**
 * Helper to get tier color class for Tailwind
 */
export function getTierColorClass(tierName: string): string {
  const colorMap: Record<string, string> = {
    [TIER_NAMES.NEWCOMER]: 'text-gray-500 bg-gray-100',
    [TIER_NAMES.REGULAR]: 'text-blue-600 bg-blue-100',
    [TIER_NAMES.CONTRIBUTOR]: 'text-green-600 bg-green-100',
    [TIER_NAMES.CHAMPION]: 'text-yellow-600 bg-yellow-100',
    [TIER_NAMES.LEGEND]: 'text-purple-600 bg-purple-100',
  };
  
  return colorMap[tierName] || 'text-gray-500 bg-gray-100';
}

/**
 * Helper to get activity category icon
 */
export function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    [ACTIVITY_CATEGORIES.CHAT]: '💬',
    [ACTIVITY_CATEGORIES.FORUM]: '📝',
    [ACTIVITY_CATEGORIES.LEARNING]: '📚',
    [ACTIVITY_CATEGORIES.ENGAGEMENT]: '⚡',
    [ACTIVITY_CATEGORIES.REFERRAL]: '👥',
    [ACTIVITY_CATEGORIES.EVENTS]: '🎉',
    [ACTIVITY_CATEGORIES.CONTENT]: '🎨',
  };
  
  return iconMap[category] || '📊';
}

/**
 * Helper to calculate progress to next tier
 */
export function calculateTierProgress(
  currentPoints: number,
  currentTierMinPoints: number,
  nextTierMinPoints?: number
): { progress: number; pointsNeeded: number } {
  if (!nextTierMinPoints) {
    return { progress: 100, pointsNeeded: 0 };
  }
  
  const pointsInCurrentTier = currentPoints - currentTierMinPoints;
  const pointsNeededForNextTier = nextTierMinPoints - currentTierMinPoints;
  const progress = Math.min(100, (pointsInCurrentTier / pointsNeededForNextTier) * 100);
  const pointsNeeded = Math.max(0, nextTierMinPoints - currentPoints);
  
  return { progress, pointsNeeded };
}

/**
 * Helper to format streak display
 */
export function formatStreak(streak: number): string {
  if (streak === 0) return 'No streak';
  if (streak === 1) return '1 day';
  return `${streak} days`;
}

/**
 * Helper to get reward type icon
 */
export function getRewardTypeIcon(rewardType: string): string {
  const iconMap: Record<string, string> = {
    [REWARD_TYPES.BADGE]: '🏆',
    [REWARD_TYPES.DISCOUNT]: '💰',
    [REWARD_TYPES.ACCESS]: '🔓',
    [REWARD_TYPES.PHYSICAL]: '📦',
    [REWARD_TYPES.EXPERIENCE]: '✨',
  };
  
  return iconMap[rewardType] || '🎁';
}

/**
 * Helper to validate activity metadata
 */
export function validateActivityMetadata(
  activityType: string,
  metadata: Record<string, unknown>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Common validations
  if (metadata.source && typeof metadata.source !== 'string') {
    errors.push('Source must be a string');
  }
  
  // Activity-specific validations
  switch (activityType) {
    case ACTIVITY_TYPES.COURSE_COMPLETED:
      if (!metadata.course_id) {
        errors.push('Course ID is required for course completion');
      }
      break;
      
    case ACTIVITY_TYPES.QUIZ_PASSED:
      if (!metadata.quiz_id) {
        errors.push('Quiz ID is required for quiz completion');
      }
      if (metadata.score !== undefined && (typeof metadata.score !== 'number' || metadata.score < 0 || metadata.score > 100)) {
        errors.push('Score must be a number between 0 and 100');
      }
      break;
      
    case ACTIVITY_TYPES.REFERRAL_SIGNUP:
      if (!metadata.referred_user_id) {
        errors.push('Referred user ID is required for referral signup');
      }
      break;
      
    case ACTIVITY_TYPES.EVENT_ATTENDANCE:
      if (!metadata.event_id) {
        errors.push('Event ID is required for event attendance');
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Helper to generate activity description
 */
export function generateActivityDescription(
  activityType: string,
  metadata: Record<string, unknown> = {}
): string {
  const descriptions: Record<string, (meta: Record<string, unknown>) => string> = {
    [ACTIVITY_TYPES.CHAT_MESSAGE]: () => 'Sent a chat message',
    [ACTIVITY_TYPES.CHAT_REACTION]: () => 'Reacted to a message',
    [ACTIVITY_TYPES.HELPFUL_RESPONSE]: () => 'Received helpful reaction',
    [ACTIVITY_TYPES.FORUM_POST]: (meta) => meta.title ? `Created post: ${meta.title}` : 'Created a forum post',
    [ACTIVITY_TYPES.FORUM_REPLY]: () => 'Replied to a forum post',
    [ACTIVITY_TYPES.FORUM_LIKE_RECEIVED]: () => 'Received a like on forum content',
    [ACTIVITY_TYPES.COURSE_STARTED]: (meta) => meta.course_name ? `Started course: ${meta.course_name}` : 'Started a course',
    [ACTIVITY_TYPES.COURSE_COMPLETED]: (meta) => meta.course_name ? `Completed course: ${meta.course_name}` : 'Completed a course',
    [ACTIVITY_TYPES.LESSON_COMPLETED]: (meta) => meta.lesson_name ? `Completed lesson: ${meta.lesson_name}` : 'Completed a lesson',
    [ACTIVITY_TYPES.QUIZ_PASSED]: (meta) => {
      const score = meta.score ? ` (${meta.score}%)` : '';
      return meta.quiz_name ? `Passed quiz: ${meta.quiz_name}${score}` : `Passed a quiz${score}`;
    },
    [ACTIVITY_TYPES.DAILY_LOGIN]: () => 'Logged in today',
    [ACTIVITY_TYPES.PROFILE_UPDATED]: () => 'Updated profile',
    [ACTIVITY_TYPES.REFERRAL_SIGNUP]: () => 'Successful referral signup',
    [ACTIVITY_TYPES.EVENT_ATTENDANCE]: (meta) => meta.event_name ? `Attended: ${meta.event_name}` : 'Attended an event',
    [ACTIVITY_TYPES.CONTENT_SHARED]: (meta) => meta.content_title ? `Shared: ${meta.content_title}` : 'Shared content',
    [ACTIVITY_TYPES.TUTORIAL_CREATED]: (meta) => meta.tutorial_title ? `Created tutorial: ${meta.tutorial_title}` : 'Created a tutorial',
    [ACTIVITY_TYPES.RESOURCE_CONTRIBUTED]: (meta) => meta.resource_name ? `Contributed: ${meta.resource_name}` : 'Contributed a resource',
  };
  
  const generator = descriptions[activityType];
  return generator ? generator(metadata) : `Completed activity: ${activityType}`;
}

/**
 * Helper to check if user can perform activity (rate limiting)
 */
export async function canPerformActivity(
  userId: string,
  activityType: string,
  activityTypes: ActivityType[]
): Promise<{ canPerform: boolean; reason?: string }> {
  const activityTypeConfig = activityTypes.find(at => at.name === activityType);
  
  if (!activityTypeConfig) {
    return { canPerform: false, reason: 'Activity type not found' };
  }
  
  if (!activityTypeConfig.is_active) {
    return { canPerform: false, reason: 'Activity type is not active' };
  }
  
  // If no daily limit, always allow
  if (!activityTypeConfig.max_daily_count) {
    return { canPerform: true };
  }
  
  // Check daily count (this would need to be implemented with a database query)
  // For now, we'll assume it's allowed and let the database function handle the limit
  return { canPerform: true };
}

/**
 * Helper to format time ago
 */
export function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
}
