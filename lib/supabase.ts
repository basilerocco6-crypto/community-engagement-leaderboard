import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client for general operations
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Admin client for server-side operations that need elevated permissions
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Database types
export interface User {
  id: string;
  whop_user_id: string;
  email: string;
  username: string;
  avatar_url?: string;
  current_tier_id?: string;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
  created_at: string;
  updated_at: string;
}

export interface UserTier {
  id: string;
  name: string;
  description?: string;
  min_points: number;
  color_hex: string;
  icon_name?: string;
  benefits: string[];
  created_at: string;
}

export interface ActivityType {
  id: string;
  name: string;
  description?: string;
  points_value: number;
  max_daily_count?: number;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type_id: string;
  points_earned: number;
  metadata: Record<string, unknown>;
  activity_date: string;
  created_at: string;
  activity_type?: ActivityType;
}

export interface Reward {
  id: string;
  name: string;
  description?: string;
  reward_type: string;
  unlock_condition: Record<string, unknown>;
  reward_data: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface UserReward {
  id: string;
  user_id: string;
  reward_id: string;
  unlocked_at: string;
  is_claimed: boolean;
  claimed_at?: string;
  reward?: Reward;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  points: number;
  rank: number;
  period_type: string;
  period_start?: string;
  period_end?: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

// Helper function to get the appropriate client
export function getSupabaseClient(useAdmin = false): SupabaseClient | null {
  if (useAdmin && supabaseAdmin) {
    return supabaseAdmin;
  }
  return supabase;
}

// Community/Experience related types and functions
export interface CommunityExperience {
  id: string;
  experience_id: string;
  name: string;
  description?: string;
  whop_company_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityMember {
  id: string;
  user_id: string;
  experience_id: string;
  joined_at: string;
  is_active: boolean;
  user?: User;
}

// Get community members for a specific experience
export async function getCommunityMembers(experienceId: string): Promise<CommunityMember[]> {
  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('community_members')
      .select(`
        *,
        user:users(*)
      `)
      .eq('experience_id', experienceId)
      .eq('is_active', true)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching community members:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCommunityMembers:', error);
    return [];
  }
}

// Get or create community experience
export async function getOrCreateExperience(experienceId: string): Promise<CommunityExperience | null> {
  if (!supabase) {
    console.warn('Supabase not configured');
    return null;
  }

  try {
    // First, try to get existing experience
    const { data: existingExperience, error: fetchError } = await supabase
      .from('community_experiences')
      .select('*')
      .eq('experience_id', experienceId)
      .single();

    if (existingExperience) {
      return existingExperience;
    }

    // If not found and error is not "not found", throw error
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // Create new experience
    const { data: newExperience, error: insertError } = await supabase
      .from('community_experiences')
      .insert({
        experience_id: experienceId,
        name: `Experience ${experienceId}`,
        description: `Community experience for ${experienceId}`,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return newExperience;
  } catch (error) {
    console.error('Error in getOrCreateExperience:', error);
    return null;
  }
}
