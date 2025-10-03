import { getSupabaseClient } from '@/lib/supabase';
import { 
  TierName, 
  TIER_THRESHOLDS, 
  TIER_RANGES, 
  TIER_COLORS, 
  TIER_ICONS,
  TierInfo,
  TierChangeHistory,
  UserEngagement
} from './types/engagement';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class TierSystem {
  /**
   * Calculate the current tier based on points
   */
  static calculateTier(points: number): TierName {
    if (points >= TIER_THRESHOLDS[TierName.DIAMOND]) return TierName.DIAMOND;
    if (points >= TIER_THRESHOLDS[TierName.PLATINUM]) return TierName.PLATINUM;
    if (points >= TIER_THRESHOLDS[TierName.GOLD]) return TierName.GOLD;
    if (points >= TIER_THRESHOLDS[TierName.SILVER]) return TierName.SILVER;
    return TierName.BRONZE;
  }

  /**
   * Get the next tier for a given tier
   */
  static getNextTier(currentTier: TierName): TierName | null {
    const tiers = [TierName.BRONZE, TierName.SILVER, TierName.GOLD, TierName.PLATINUM, TierName.DIAMOND];
    const currentIndex = tiers.indexOf(currentTier);
    
    if (currentIndex === -1 || currentIndex === tiers.length - 1) {
      return null; // Already at highest tier
    }
    
    return tiers[currentIndex + 1];
  }

  /**
   * Calculate tier progress information
   */
  static calculateTierProgress(points: number): TierInfo {
    const currentTier = this.calculateTier(points);
    const nextTier = this.getNextTier(currentTier);
    
    const tierRange = TIER_RANGES[currentTier];
    const tierMinPoints = tierRange.min;
    const tierMaxPoints = tierRange.max;
    
    let progressPercentage = 0;
    let pointsToNextTier: number | undefined;
    let nextTierMinPoints: number | undefined;

    if (nextTier) {
      nextTierMinPoints = TIER_THRESHOLDS[nextTier];
      pointsToNextTier = nextTierMinPoints - points;
      
      // Calculate progress within current tier range
      if (tierMaxPoints) {
        const tierRangeSize = tierMaxPoints - tierMinPoints + 1;
        const pointsInCurrentTier = points - tierMinPoints;
        progressPercentage = Math.min(100, (pointsInCurrentTier / tierRangeSize) * 100);
      } else {
        // Diamond tier - show progress beyond minimum
        const baseProgress = Math.min(points - tierMinPoints, 1000); // Cap display at 1000 extra points
        progressPercentage = Math.min(100, (baseProgress / 1000) * 100);
      }
    } else {
      // Already at max tier
      progressPercentage = 100;
    }

    return {
      current_tier: currentTier,
      current_points: points,
      tier_min_points: tierMinPoints,
      tier_max_points: tierMaxPoints,
      next_tier: nextTier || undefined,
      next_tier_min_points: nextTierMinPoints,
      points_to_next_tier: pointsToNextTier,
      progress_percentage: Math.round(progressPercentage * 100) / 100, // Round to 2 decimal places
      tier_color: TIER_COLORS[currentTier],
      tier_icon: TIER_ICONS[currentTier]
    };
  }

  /**
   * Get user's current tier information
   */
  static async getUserTierInfo(userId: string): Promise<TierInfo | null> {
    try {
      const { data: userEngagement, error } = await supabase
        .from('user_engagement')
        .select('total_points')
        .eq('user_id', userId)
        .single();

      if (error || !userEngagement) {
        return null;
      }

      return this.calculateTierProgress(userEngagement.total_points);
    } catch (error) {
      console.error('Error getting user tier info:', error);
      return null;
    }
  }

  /**
   * Check if user should be upgraded to a new tier
   */
  static async checkTierUpgrade(userId: string, newPoints: number, triggerActivityId?: string): Promise<boolean> {
    try {
      // Get current user data
      const { data: currentUser, error: userError } = await supabase
        .from('user_engagement')
        .select('current_tier, total_points')
        .eq('user_id', userId)
        .single();

      if (userError || !currentUser) {
        return false;
      }

      const currentTier = currentUser.current_tier as TierName;
      const newTier = this.calculateTier(newPoints);

      // Check if tier changed
      if (currentTier !== newTier) {
        // Record tier change in history
        await this.recordTierChange(
          userId, 
          currentTier, 
          newTier, 
          newPoints, 
          triggerActivityId
        );
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking tier upgrade:', error);
      return false;
    }
  }

  /**
   * Record a tier change in the history table
   */
  static async recordTierChange(
    userId: string,
    previousTier: TierName,
    newTier: TierName,
    pointsAtChange: number,
    triggerActivityId?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('tier_change_history')
        .insert({
          user_id: userId,
          previous_tier: previousTier,
          new_tier: newTier,
          points_at_change: pointsAtChange,
          trigger_activity_id: triggerActivityId
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error recording tier change:', error);
      throw error;
    }
  }

  /**
   * Get user's tier change history
   */
  static async getTierHistory(
    userId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<{ history: TierChangeHistory[]; totalCount: number }> {
    try {
      // Get total count
      const { count, error: countError } = await supabase
        .from('tier_change_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        throw countError;
      }

      // Get history records
      const { data: history, error: historyError } = await supabase
        .from('tier_change_history')
        .select('*')
        .eq('user_id', userId)
        .order('changed_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (historyError) {
        throw historyError;
      }

      return {
        history: history || [],
        totalCount: count || 0
      };
    } catch (error) {
      console.error('Error getting tier history:', error);
      return { history: [], totalCount: 0 };
    }
  }

  /**
   * Get tier statistics for all users
   */
  static async getTierDistribution(): Promise<Record<TierName, number>> {
    try {
      const { data, error } = await supabase
        .from('user_engagement')
        .select('current_tier');

      if (error) {
        throw error;
      }

      const distribution: Record<TierName, number> = {
        [TierName.BRONZE]: 0,
        [TierName.SILVER]: 0,
        [TierName.GOLD]: 0,
        [TierName.PLATINUM]: 0,
        [TierName.DIAMOND]: 0
      };

      data.forEach(user => {
        const tier = user.current_tier as TierName;
        if (tier in distribution) {
          distribution[tier]++;
        }
      });

      return distribution;
    } catch (error) {
      console.error('Error getting tier distribution:', error);
      return {
        [TierName.BRONZE]: 0,
        [TierName.SILVER]: 0,
        [TierName.GOLD]: 0,
        [TierName.PLATINUM]: 0,
        [TierName.DIAMOND]: 0
      };
    }
  }

  /**
   * Get users by tier
   */
  static async getUsersByTier(tier: TierName, limit: number = 50, offset: number = 0): Promise<UserEngagement[]> {
    try {
      const { data, error } = await supabase
        .from('user_engagement')
        .select('*')
        .eq('current_tier', tier)
        .order('total_points', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting users by tier:', error);
      return [];
    }
  }

  /**
   * Utility function to format tier display name
   */
  static formatTierDisplay(tier: TierName, includeIcon: boolean = true): string {
    const icon = includeIcon ? TIER_ICONS[tier] : '';
    return `${icon} ${tier}`.trim();
  }

  /**
   * Get tier requirements text
   */
  static getTierRequirements(tier: TierName): string {
    const range = TIER_RANGES[tier];
    if (range.max === null) {
      return `${range.min}+ points`;
    }
    return `${range.min}-${range.max} points`;
  }

  /**
   * Check if a tier upgrade notification should be sent
   */
  static shouldNotifyTierUpgrade(previousTier: TierName, newTier: TierName): boolean {
    const tiers = [TierName.BRONZE, TierName.SILVER, TierName.GOLD, TierName.PLATINUM, TierName.DIAMOND];
    const previousIndex = tiers.indexOf(previousTier);
    const newIndex = tiers.indexOf(newTier);
    
    return newIndex > previousIndex;
  }

  /**
   * Get tier upgrade rewards/benefits
   */
  static getTierBenefits(tier: TierName): string[] {
    const benefits: Record<TierName, string[]> = {
      [TierName.BRONZE]: [
        'Welcome to the community!',
        'Access to basic features',
        'Community chat access'
      ],
      [TierName.SILVER]: [
        'Enhanced community features',
        '5% discount on premium content',
        'Priority support',
        'Access to Silver-only channels'
      ],
      [TierName.GOLD]: [
        'Premium features unlocked',
        '10% discount on premium content',
        'Early access to new features',
        'Gold member badge',
        'Access to exclusive events'
      ],
      [TierName.PLATINUM]: [
        'VIP access and features',
        '15% discount on premium content',
        'Direct line to community managers',
        'Platinum member perks',
        'Beta testing opportunities'
      ],
      [TierName.DIAMOND]: [
        'Exclusive Diamond member status',
        '20% discount on premium content',
        'Personal community concierge',
        'Diamond-only exclusive content',
        'Influence on community direction',
        'Special recognition and rewards'
      ]
    };

    return benefits[tier] || [];
  }
}
