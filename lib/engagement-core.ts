import { createClient } from '@supabase/supabase-js';
import { 
  ActivityType, 
  ACTIVITY_POINTS, 
  QualityIndicators,
  ChatMessageData,
  ForumPostData,
  CourseCompletionData,
  AddEngagementPointsRequest,
  AddEngagementPointsResponse,
  UserEngagement,
  LeaderboardEntry
} from './types/engagement';
import { TierSystem } from './tier-system';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class EngagementTracker {
  /**
   * Analyzes content quality and returns quality indicators
   */
  static analyzeContentQuality(content: string, additionalData?: any): QualityIndicators {
    const indicators: QualityIndicators = {
      length: content.length,
      hasLinks: /https?:\/\/[^\s]+/.test(content),
      hasMedia: /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i.test(content),
      hasCodeBlocks: /```[\s\S]*?```|`[^`]+`/.test(content),
      hasQuestions: /\?/.test(content),
      hasEmojis: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(content),
      mentionsCount: (content.match(/@\w+/g) || []).length,
    };

    // Add additional data if provided
    if (additionalData) {
      indicators.upvotes = additionalData.upvotes || 0;
      indicators.replies = additionalData.replies || 0;
      indicators.threadLength = additionalData.threadLength || 0;
    }

    return indicators;
  }

  /**
   * Calculates points for chat messages based on length and quality
   */
  static calculateChatMessagePoints(data: ChatMessageData): { basePoints: number; qualityBonus: number } {
    const basePoints = ACTIVITY_POINTS[ActivityType.CHAT_MESSAGE];
    let qualityBonus = 0;

    const { quality_indicators } = data;

    // Length-based scoring
    if (quality_indicators.length > 100) qualityBonus += 2;
    if (quality_indicators.length > 300) qualityBonus += 3;

    // Quality indicators bonus
    if (quality_indicators.hasLinks) qualityBonus += 2;
    if (quality_indicators.hasMedia) qualityBonus += 3;
    if (quality_indicators.hasCodeBlocks) qualityBonus += 4;
    if (quality_indicators.hasQuestions) qualityBonus += 2;
    if (quality_indicators.mentionsCount && quality_indicators.mentionsCount > 0) {
      qualityBonus += Math.min(quality_indicators.mentionsCount * 1, 5); // Max 5 points for mentions
    }

    return { basePoints, qualityBonus };
  }

  /**
   * Calculates points for forum posts based on type and quality
   */
  static calculateForumPostPoints(data: ForumPostData): { basePoints: number; qualityBonus: number } {
    const basePoints = data.is_reply 
      ? ACTIVITY_POINTS[ActivityType.FORUM_REPLY]
      : ACTIVITY_POINTS[ActivityType.FORUM_POST];
    
    let qualityBonus = 0;
    const { quality_indicators } = data;

    // Length-based scoring (more important for forum posts)
    if (quality_indicators.length > 200) qualityBonus += 3;
    if (quality_indicators.length > 500) qualityBonus += 5;
    if (quality_indicators.length > 1000) qualityBonus += 7;

    // Quality indicators bonus
    if (quality_indicators.hasLinks) qualityBonus += 3;
    if (quality_indicators.hasMedia) qualityBonus += 4;
    if (quality_indicators.hasCodeBlocks) qualityBonus += 6;
    if (quality_indicators.hasQuestions) qualityBonus += 3;

    // Community engagement bonus
    if (quality_indicators.upvotes && quality_indicators.upvotes > 0) {
      qualityBonus += Math.min(quality_indicators.upvotes * 2, 20); // Max 20 points for upvotes
    }
    if (quality_indicators.replies && quality_indicators.replies > 0) {
      qualityBonus += Math.min(quality_indicators.replies * 3, 30); // Max 30 points for replies
    }

    return { basePoints, qualityBonus };
  }

  /**
   * Calculates points for course completions
   */
  static calculateCourseCompletionPoints(data: CourseCompletionData, activityType: ActivityType): number {
    let basePoints = ACTIVITY_POINTS[activityType];

    // Bonus for completion percentage (for partial completions)
    if (activityType === ActivityType.COURSE_COMPLETED && data.completion_percentage < 100) {
      basePoints = Math.floor(basePoints * (data.completion_percentage / 100));
    }

    // Quiz score bonus
    if (data.quiz_score && data.quiz_score > 80) {
      basePoints += Math.floor(basePoints * 0.2); // 20% bonus for high quiz scores
    }

    // Time spent bonus (for thorough engagement)
    if (data.time_spent_minutes && data.time_spent_minutes > 60) {
      basePoints += Math.floor(basePoints * 0.1); // 10% bonus for spending significant time
    }

    return basePoints;
  }

  /**
   * Main method to calculate points based on activity type and data
   */
  static calculatePoints(request: AddEngagementPointsRequest): number {
    // If points are explicitly provided, use them
    if (request.points !== undefined) {
      return request.points;
    }

    const activityType = request.activity_type as ActivityType;
    let totalPoints = 0;

    switch (activityType) {
      case ActivityType.CHAT_MESSAGE:
        if (request.chat_data) {
          const { basePoints, qualityBonus } = this.calculateChatMessagePoints(request.chat_data);
          totalPoints = basePoints + qualityBonus;
        } else {
          totalPoints = ACTIVITY_POINTS[ActivityType.CHAT_MESSAGE];
        }
        break;

      case ActivityType.FORUM_POST:
      case ActivityType.FORUM_REPLY:
        if (request.forum_data) {
          const { basePoints, qualityBonus } = this.calculateForumPostPoints(request.forum_data);
          totalPoints = basePoints + qualityBonus;
        } else {
          totalPoints = ACTIVITY_POINTS[activityType];
        }
        break;

      case ActivityType.COURSE_COMPLETED:
      case ActivityType.LESSON_COMPLETED:
      case ActivityType.QUIZ_PASSED:
        if (request.course_data) {
          totalPoints = this.calculateCourseCompletionPoints(request.course_data, activityType);
        } else {
          totalPoints = ACTIVITY_POINTS[activityType];
        }
        break;

      default:
        // For other activity types, use the configured points
        totalPoints = ACTIVITY_POINTS[activityType] || 0;
        break;
    }

    return Math.max(totalPoints, 0); // Ensure non-negative points
  }

  /**
   * Records an engagement event and updates user points
   */
  static async recordEngagement(request: AddEngagementPointsRequest): Promise<AddEngagementPointsResponse> {
    try {
      // Calculate points if not provided
      const points = this.calculatePoints(request);

      // Prepare metadata
      const metadata = {
        ...request.metadata,
        chat_data: request.chat_data,
        forum_data: request.forum_data,
        course_data: request.course_data,
        calculated_points: points,
        original_points: request.points
      };

      // Get user's current state before update
      const { data: currentUser } = await supabase
        .from('user_engagement')
        .select('current_tier')
        .eq('user_id', request.user_id)
        .single();

      // Use the database function to add points
      const { error: functionError } = await supabase
        .rpc('add_engagement_points', {
          p_user_id: request.user_id,
          p_username: request.username,
          p_activity_type: request.activity_type,
          p_points: points,
          p_metadata: metadata
        });

      if (functionError) {
        throw functionError;
      }

      // Get updated user engagement data
      const { data: updatedUser, error: userError } = await supabase
        .from('user_engagement')
        .select('*')
        .eq('user_id', request.user_id)
        .single();

      if (userError) {
        throw userError;
      }

      // Check if tier changed
      const newTier = currentUser?.current_tier !== updatedUser.current_tier 
        ? updatedUser.current_tier 
        : undefined;

      // Get newly unlocked rewards if tier changed
      let unlockedRewards: any[] = [];
      if (newTier) {
        const { data: rewards } = await supabase
          .from('user_rewards')
          .select(`
            *,
            tier_rewards (*)
          `)
          .eq('user_id', request.user_id)
          .eq('tier_name', newTier);

        unlockedRewards = rewards || [];
      }

      return {
        success: true,
        user_engagement: updatedUser,
        new_tier: newTier,
        unlocked_rewards: unlockedRewards.map(r => r.tier_rewards)
      };

    } catch (error) {
      console.error('Error recording engagement:', error);
      throw error;
    }
  }

  /**
   * Gets user's total points and engagement data
   */
  static async getUserEngagement(userId: string): Promise<UserEngagement | null> {
    try {
      const { data, error } = await supabase
        .from('user_engagement')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user engagement:', error);
      throw error;
    }
  }

  /**
   * Gets leaderboard rankings
   */
  static async getLeaderboard(limit: number = 50, offset: number = 0): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from('user_engagement')
        .select('*')
        .order('total_points', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      // Add rank to each entry
      const leaderboard: LeaderboardEntry[] = data.map((user, index) => ({
        ...user,
        rank: offset + index + 1
      }));

      return leaderboard;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  /**
   * Gets user's rank in the leaderboard
   */
  static async getUserRank(userId: string): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_rank', { p_user_id: userId });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user rank:', error);
      return null;
    }
  }

  /**
   * Helper method to create engagement events for different content types
   */
  static async trackChatMessage(
    userId: string,
    username: string,
    messageId: string,
    channelId: string,
    content: string,
    additionalData?: any
  ): Promise<AddEngagementPointsResponse> {
    const qualityIndicators = this.analyzeContentQuality(content, additionalData);
    
    const chatData: ChatMessageData = {
      message_id: messageId,
      channel_id: channelId,
      content,
      length: content.length,
      quality_indicators: qualityIndicators
    };

    return this.recordEngagement({
      user_id: userId,
      username,
      activity_type: ActivityType.CHAT_MESSAGE,
      chat_data: chatData
    });
  }

  static async trackForumPost(
    userId: string,
    username: string,
    postId: string,
    forumId: string,
    content: string,
    isReply: boolean = false,
    title?: string,
    parentPostId?: string,
    additionalData?: any
  ): Promise<AddEngagementPointsResponse> {
    const qualityIndicators = this.analyzeContentQuality(content, additionalData);
    
    const forumData: ForumPostData = {
      post_id: postId,
      forum_id: forumId,
      title,
      content,
      is_reply: isReply,
      parent_post_id: parentPostId,
      quality_indicators: qualityIndicators
    };

    return this.recordEngagement({
      user_id: userId,
      username,
      activity_type: isReply ? ActivityType.FORUM_REPLY : ActivityType.FORUM_POST,
      forum_data: forumData
    });
  }

  static async trackCourseCompletion(
    userId: string,
    username: string,
    courseId: string,
    courseTitle: string,
    completionPercentage: number = 100,
    timeSpentMinutes?: number,
    quizScore?: number,
    lessonId?: string
  ): Promise<AddEngagementPointsResponse> {
    const courseData: CourseCompletionData = {
      course_id: courseId,
      course_title: courseTitle,
      completion_percentage: completionPercentage,
      time_spent_minutes: timeSpentMinutes,
      quiz_score: quizScore,
      lesson_id: lessonId
    };

    const activityType = lessonId 
      ? ActivityType.LESSON_COMPLETED 
      : ActivityType.COURSE_COMPLETED;

    return this.recordEngagement({
      user_id: userId,
      username,
      activity_type: activityType,
      course_data: courseData
    });
  }
}
