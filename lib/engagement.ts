import { 
  getSupabaseClient,
  User, 
  UserTier, 
  ActivityType, 
  UserActivity, 
  Reward, 
  UserReward, 
  LeaderboardEntry 
} from './supabase';

// ==================== USER MANAGEMENT ====================

/**
 * Create or update a user in the database
 */
export async function upsertUser(userData: {
  whop_user_id: string;
  email: string;
  username: string;
  avatar_url?: string;
}): Promise<User | null> {
  const client = getSupabaseClient(true); // Use admin client
  if (!client) throw new Error('Supabase not configured');

  const { data, error } = await client
    .from('users')
    .upsert({
      whop_user_id: userData.whop_user_id,
      email: userData.email,
      username: userData.username,
      avatar_url: userData.avatar_url,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'whop_user_id'
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error upserting user:', error);
    return null;
  }

  return data;
}

/**
 * Get user by Whop user ID
 */
export async function getUserByWhopId(whopUserId: string): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const { data, error } = await client
    .from('users')
    .select(`
      *,
      user_tiers (*)
    `)
    .eq('whop_user_id', whopUserId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

/**
 * Get user by internal ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const { data, error } = await client
    .from('users')
    .select(`
      *,
      user_tiers (*)
    `)
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

// ==================== ACTIVITY TRACKING ====================

/**
 * Record a user activity and award points
 */
export async function recordActivity(
  userId: string,
  activityTypeName: string,
  metadata: Record<string, unknown> = {}
): Promise<UserActivity | null> {
  const client = getSupabaseClient(true); // Use admin client
  if (!client) throw new Error('Supabase not configured');

  try {
    // Call the database function to record activity
    const { data, error } = await client.rpc('record_user_activity', {
      p_user_id: userId,
      p_activity_type_name: activityTypeName,
      p_metadata: metadata
    });

    if (error) {
      console.error('Error recording activity:', error);
      return null;
    }

    // Fetch the created activity
    const { data: activity, error: fetchError } = await client
      .from('user_activities')
      .select(`
        *,
        activity_types (*)
      `)
      .eq('id', data)
      .single();

    if (fetchError) {
      console.error('Error fetching recorded activity:', fetchError);
      return null;
    }

    return activity;
  } catch (error) {
    console.error('Error in recordActivity:', error);
    return null;
  }
}

/**
 * Get user activities with pagination
 */
export async function getUserActivities(
  userId: string,
  limit = 50,
  offset = 0
): Promise<UserActivity[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const { data, error } = await client
    .from('user_activities')
    .select(`
      *,
      activity_types (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching user activities:', error);
    return [];
  }

  return data || [];
}

/**
 * Get activity summary for a user
 */
export async function getUserActivitySummary(userId: string): Promise<{
  totalActivities: number;
  totalPoints: number;
  activitiesByType: Record<string, number>;
  pointsByType: Record<string, number>;
}> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const { data, error } = await client
    .from('user_activities')
    .select(`
      points_earned,
      activity_types (name)
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching activity summary:', error);
    return {
      totalActivities: 0,
      totalPoints: 0,
      activitiesByType: {},
      pointsByType: {}
    };
  }

  const summary = {
    totalActivities: data?.length || 0,
    totalPoints: data?.reduce((sum, activity) => sum + activity.points_earned, 0) || 0,
    activitiesByType: {} as Record<string, number>,
    pointsByType: {} as Record<string, number>
  };

  data?.forEach(activity => {
    const activityTypes = activity.activity_types as unknown as { name: string } | undefined;
    const typeName = activityTypes?.name || 'unknown';
    summary.activitiesByType[typeName] = (summary.activitiesByType[typeName] || 0) + 1;
    summary.pointsByType[typeName] = (summary.pointsByType[typeName] || 0) + activity.points_earned;
  });

  return summary;
}

// ==================== TIER SYSTEM ====================

/**
 * Get all user tiers
 */
export async function getUserTiers(): Promise<UserTier[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const { data, error } = await client
    .from('user_tiers')
    .select('*')
    .order('min_points', { ascending: true });

  if (error) {
    console.error('Error fetching user tiers:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's current tier
 */
export async function getUserTier(userId: string): Promise<UserTier | null> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const { data, error } = await client
    .from('users')
    .select(`
      user_tiers (*)
    `)
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user tier:', error);
    return null;
  }

  return (data?.user_tiers as unknown as UserTier) || null;
}

// ==================== ACTIVITY TYPES ====================

/**
 * Get all activity types
 */
export async function getActivityTypes(): Promise<ActivityType[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const { data, error } = await client
    .from('activity_types')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true });

  if (error) {
    console.error('Error fetching activity types:', error);
    return [];
  }

  return data || [];
}

/**
 * Get activity types by category
 */
export async function getActivityTypesByCategory(): Promise<Record<string, ActivityType[]>> {
  const activityTypes = await getActivityTypes();
  
  return activityTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, ActivityType[]>);
}

// ==================== REWARDS SYSTEM ====================

/**
 * Get all available rewards
 */
export async function getRewards(): Promise<Reward[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const { data, error } = await client
    .from('rewards')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching rewards:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's unlocked rewards
 */
export async function getUserRewards(userId: string): Promise<UserReward[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const { data, error } = await client
    .from('user_rewards')
    .select(`
      *,
      rewards (*)
    `)
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });

  if (error) {
    console.error('Error fetching user rewards:', error);
    return [];
  }

  return data || [];
}

/**
 * Check and unlock rewards for a user
 */
export async function checkAndUnlockRewards(userId: string): Promise<UserReward[]> {
  const client = getSupabaseClient(true); // Use admin client
  if (!client) throw new Error('Supabase not configured');

  try {
    // Get user data
    const user = await getUserById(userId);
    if (!user) return [];

    // Get all rewards
    const rewards = await getRewards();
    
    // Get already unlocked rewards
    const unlockedRewards = await getUserRewards(userId);
    const unlockedRewardIds = new Set(unlockedRewards.map(ur => ur.reward_id));

    const newlyUnlocked: UserReward[] = [];

    for (const reward of rewards) {
      if (unlockedRewardIds.has(reward.id)) continue;

      // Check if user meets unlock conditions
      const meetsCondition = await checkRewardCondition(userId, reward.unlock_condition);
      
      if (meetsCondition) {
        // Unlock the reward
        const { data, error } = await client
          .from('user_rewards')
          .insert({
            user_id: userId,
            reward_id: reward.id
          })
          .select(`
            *,
            rewards (*)
          `)
          .single();

        if (!error && data) {
          newlyUnlocked.push(data);
        }
      }
    }

    return newlyUnlocked;
  } catch (error) {
    console.error('Error checking and unlocking rewards:', error);
    return [];
  }
}

/**
 * Check if user meets reward unlock condition
 */
async function checkRewardCondition(
  userId: string, 
  condition: Record<string, unknown>
): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user) return false;

  // Check points condition
  if (typeof condition.points === 'number' && user.total_points < condition.points) {
    return false;
  }

  // Check tier condition
  if (typeof condition.tier === 'string') {
    const userTier = await getUserTier(userId);
    if (!userTier || userTier.name !== condition.tier) {
      return false;
    }
  }

  // Check streak condition
  if (typeof condition.streak === 'number' && user.current_streak < condition.streak) {
    return false;
  }

  // Check activity count conditions
  if (condition.activity_count && typeof condition.activity_count === 'object') {
    const activitySummary = await getUserActivitySummary(userId);
    const activityCount = condition.activity_count as Record<string, number>;
    for (const [activityType, requiredCount] of Object.entries(activityCount)) {
      if ((activitySummary.activitiesByType[activityType] || 0) < requiredCount) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Claim a reward
 */
export async function claimReward(userId: string, rewardId: string): Promise<boolean> {
  const client = getSupabaseClient(true); // Use admin client
  if (!client) throw new Error('Supabase not configured');

  const { error } = await client
    .from('user_rewards')
    .update({
      is_claimed: true,
      claimed_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('reward_id', rewardId);

  if (error) {
    console.error('Error claiming reward:', error);
    return false;
  }

  return true;
}

// ==================== LEADERBOARD ====================

/**
 * Get leaderboard entries
 */
export async function getLeaderboard(
  periodType = 'all_time',
  limit = 50,
  offset = 0
): Promise<LeaderboardEntry[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const { data, error } = await client
    .from('leaderboard_entries')
    .select(`
      *,
      users (
        id,
        username,
        avatar_url,
        user_tiers (name, color_hex, icon_name)
      )
    `)
    .eq('period_type', periodType)
    .order('rank', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's leaderboard position
 */
export async function getUserLeaderboardPosition(
  userId: string,
  periodType = 'all_time'
): Promise<LeaderboardEntry | null> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const { data, error } = await client
    .from('leaderboard_entries')
    .select(`
      *,
      users (
        id,
        username,
        avatar_url,
        user_tiers (name, color_hex, icon_name)
      )
    `)
    .eq('user_id', userId)
    .eq('period_type', periodType)
    .single();

  if (error) {
    console.error('Error fetching user leaderboard position:', error);
    return null;
  }

  return data;
}

/**
 * Update leaderboard (admin function)
 */
export async function updateLeaderboard(periodType = 'all_time'): Promise<boolean> {
  const client = getSupabaseClient(true); // Use admin client
  if (!client) throw new Error('Supabase not configured');

  try {
    const { error } = await client.rpc('update_leaderboard', {
      p_period_type: periodType
    });

    if (error) {
      console.error('Error updating leaderboard:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateLeaderboard:', error);
    return false;
  }
}

// ==================== ANALYTICS ====================

/**
 * Get engagement analytics for a user
 */
export async function getUserEngagementAnalytics(userId: string): Promise<{
  totalPoints: number;
  currentTier: UserTier | null;
  nextTier: UserTier | null;
  pointsToNextTier: number;
  currentStreak: number;
  longestStreak: number;
  activitiesThisWeek: number;
  activitiesThisMonth: number;
  topCategories: Array<{ category: string; points: number; count: number }>;
}> {
  const user = await getUserById(userId);
  const currentTier = await getUserTier(userId);
  const allTiers = await getUserTiers();

  // Find next tier
  const nextTier = allTiers.find(tier => 
    tier.min_points > (user?.total_points || 0)
  ) || null;

  const pointsToNextTier = nextTier 
    ? nextTier.min_points - (user?.total_points || 0)
    : 0;

  // Get recent activities
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const { data: recentActivities } = await client
    .from('user_activities')
    .select(`
      *,
      activity_types (category)
    `)
    .eq('user_id', userId)
    .gte('activity_date', oneMonthAgo.toISOString().split('T')[0]);

  const activitiesThisWeek = recentActivities?.filter(
    activity => activity.activity_date >= oneWeekAgo.toISOString().split('T')[0]
  ).length || 0;

  const activitiesThisMonth = recentActivities?.length || 0;

  // Calculate top categories
  const categoryStats: Record<string, { points: number; count: number }> = {};
  
  recentActivities?.forEach(activity => {
    const activityTypes = activity.activity_types as unknown as { category: string } | undefined;
    const category = activityTypes?.category || 'other';
    if (!categoryStats[category]) {
      categoryStats[category] = { points: 0, count: 0 };
    }
    categoryStats[category].points += activity.points_earned;
    categoryStats[category].count += 1;
  });

  const topCategories = Object.entries(categoryStats)
    .map(([category, stats]) => ({ category, ...stats }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  return {
    totalPoints: user?.total_points || 0,
    currentTier,
    nextTier,
    pointsToNextTier,
    currentStreak: user?.current_streak || 0,
    longestStreak: user?.longest_streak || 0,
    activitiesThisWeek,
    activitiesThisMonth,
    topCategories
  };
}
