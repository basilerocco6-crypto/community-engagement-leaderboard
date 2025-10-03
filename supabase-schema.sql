-- Whop Community App Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (updated with tier information)
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  whop_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  current_tier_id UUID,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User tiers/status levels
CREATE TABLE user_tiers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  min_points INTEGER NOT NULL,
  color_hex TEXT DEFAULT '#6B7280',
  icon_name TEXT,
  benefits JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity types with point values
CREATE TABLE activity_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  points_value INTEGER NOT NULL DEFAULT 0,
  max_daily_count INTEGER, -- NULL means unlimited
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User engagement activities
CREATE TABLE user_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type_id UUID NOT NULL REFERENCES activity_types(id),
  points_earned INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}', -- Store additional activity data
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rewards/achievements
CREATE TABLE rewards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  reward_type TEXT NOT NULL DEFAULT 'badge', -- badge, discount, access, etc.
  unlock_condition JSONB NOT NULL, -- Conditions to unlock (points, activities, etc.)
  reward_data JSONB DEFAULT '{}', -- Reward-specific data (discount %, badge image, etc.)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User reward unlocks
CREATE TABLE user_rewards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id),
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, reward_id)
);

-- Leaderboard entries (updated)
DROP TABLE IF EXISTS leaderboard_entries CASCADE;
CREATE TABLE leaderboard_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  rank INTEGER,
  period_type TEXT NOT NULL DEFAULT 'all_time', -- all_time, monthly, weekly, daily
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, period_type, period_start)
);

-- Add foreign key constraint for user tiers
ALTER TABLE users ADD CONSTRAINT fk_users_tier 
  FOREIGN KEY (current_tier_id) REFERENCES user_tiers(id);

-- Create indexes for better performance
CREATE INDEX idx_users_whop_user_id ON users(whop_user_id);
CREATE INDEX idx_users_total_points ON users(total_points DESC);
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_date ON user_activities(activity_date DESC);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type_id);
CREATE INDEX idx_leaderboard_points ON leaderboard_entries(points DESC);
CREATE INDEX idx_leaderboard_period ON leaderboard_entries(period_type, period_start);
CREATE INDEX idx_user_rewards_user ON user_rewards(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view all profiles but only update their own
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Everyone can view tiers and activity types
CREATE POLICY "Everyone can view tiers" ON user_tiers FOR SELECT USING (true);
CREATE POLICY "Everyone can view activity types" ON activity_types FOR SELECT USING (true);

-- Users can view all activities but only insert their own
CREATE POLICY "Everyone can view activities" ON user_activities FOR SELECT USING (true);
CREATE POLICY "Users can insert own activities" ON user_activities FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Everyone can view rewards
CREATE POLICY "Everyone can view rewards" ON rewards FOR SELECT USING (true);

-- Users can view all reward unlocks but only manage their own
CREATE POLICY "Everyone can view reward unlocks" ON user_rewards FOR SELECT USING (true);
CREATE POLICY "Users can manage own rewards" ON user_rewards FOR ALL USING (auth.uid()::text = user_id::text);

-- Everyone can view leaderboard
CREATE POLICY "Everyone can view leaderboard" ON leaderboard_entries FOR SELECT USING (true);

-- Insert default user tiers
INSERT INTO user_tiers (name, description, min_points, color_hex, icon_name, benefits) VALUES
('Newcomer', 'Just getting started in the community', 0, '#9CA3AF', 'user', '["Access to general channels"]'),
('Regular', 'Active community member', 100, '#3B82F6', 'users', '["Access to general channels", "Basic support"]'),
('Contributor', 'Valuable community contributor', 500, '#10B981', 'star', '["All Regular benefits", "Priority support", "Early access to content"]'),
('Champion', 'Community champion and leader', 1500, '#F59E0B', 'crown', '["All Contributor benefits", "Exclusive channels", "Monthly 1-on-1 calls"]'),
('Legend', 'Community legend and top performer', 5000, '#8B5CF6', 'trophy', '["All Champion benefits", "Custom role", "Lifetime access", "Revenue sharing"]');

-- Insert default activity types
INSERT INTO activity_types (name, description, points_value, max_daily_count, category) VALUES
-- Chat activities
('chat_message', 'Send a message in chat', 1, 50, 'chat'),
('chat_reaction', 'React to a message', 1, 100, 'chat'),
('helpful_response', 'Receive helpful reaction on message', 5, NULL, 'chat'),

-- Forum activities
('forum_post', 'Create a forum post', 10, 5, 'forum'),
('forum_reply', 'Reply to a forum post', 5, 20, 'forum'),
('forum_like_received', 'Receive a like on forum content', 2, NULL, 'forum'),

-- Learning activities
('course_started', 'Start a new course', 20, NULL, 'learning'),
('course_completed', 'Complete a course', 100, NULL, 'learning'),
('lesson_completed', 'Complete a lesson', 15, NULL, 'learning'),
('quiz_passed', 'Pass a quiz', 25, NULL, 'learning'),

-- Community activities
('daily_login', 'Log in to the platform', 5, 1, 'engagement'),
('profile_updated', 'Update profile information', 10, 1, 'engagement'),
('referral_signup', 'Successful referral signup', 50, NULL, 'referral'),
('event_attendance', 'Attend a community event', 30, NULL, 'events'),

-- Content creation
('content_shared', 'Share valuable content', 15, 10, 'content'),
('tutorial_created', 'Create a tutorial', 75, NULL, 'content'),
('resource_contributed', 'Contribute a resource', 25, NULL, 'content');

-- Insert default rewards
INSERT INTO rewards (name, description, reward_type, unlock_condition, reward_data) VALUES
('First Steps', 'Welcome to the community!', 'badge', '{"points": 10}', '{"badge_image": "first-steps.png", "color": "#3B82F6"}'),
('Chatterbox', 'Sent 100 chat messages', 'badge', '{"activity_count": {"chat_message": 100}}', '{"badge_image": "chatterbox.png", "color": "#10B981"}'),
('Knowledge Seeker', 'Completed first course', 'badge', '{"activity_count": {"course_completed": 1}}', '{"badge_image": "knowledge-seeker.png", "color": "#F59E0B"}'),
('Community Champion', 'Reached Champion tier', 'access', '{"tier": "Champion"}', '{"access_level": "premium_channels"}'),
('Early Bird', 'Login streak of 7 days', 'discount', '{"streak": 7}', '{"discount_percent": 10, "valid_days": 30}'),
('Point Collector', 'Earned 1000 total points', 'badge', '{"points": 1000}', '{"badge_image": "point-collector.png", "color": "#8B5CF6"}');

-- Create functions for common operations

-- Function to update user points and tier
CREATE OR REPLACE FUNCTION update_user_points_and_tier(p_user_id UUID, p_points INTEGER)
RETURNS VOID AS $$
DECLARE
  new_total INTEGER;
  new_tier_id UUID;
BEGIN
  -- Update total points
  UPDATE users 
  SET total_points = total_points + p_points,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Get new total
  SELECT total_points INTO new_total FROM users WHERE id = p_user_id;
  
  -- Find appropriate tier
  SELECT id INTO new_tier_id 
  FROM user_tiers 
  WHERE min_points <= new_total 
  ORDER BY min_points DESC 
  LIMIT 1;
  
  -- Update user tier if changed
  UPDATE users 
  SET current_tier_id = new_tier_id 
  WHERE id = p_user_id AND (current_tier_id IS NULL OR current_tier_id != new_tier_id);
END;
$$ LANGUAGE plpgsql;

-- Function to record user activity
CREATE OR REPLACE FUNCTION record_user_activity(
  p_user_id UUID,
  p_activity_type_name TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  activity_type_record RECORD;
  daily_count INTEGER;
  points_to_award INTEGER;
  activity_id UUID;
BEGIN
  -- Get activity type info
  SELECT * INTO activity_type_record 
  FROM activity_types 
  WHERE name = p_activity_type_name AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity type % not found or inactive', p_activity_type_name;
  END IF;
  
  -- Check daily limit if applicable
  IF activity_type_record.max_daily_count IS NOT NULL THEN
    SELECT COUNT(*) INTO daily_count
    FROM user_activities
    WHERE user_id = p_user_id 
      AND activity_type_id = activity_type_record.id
      AND activity_date = CURRENT_DATE;
    
    IF daily_count >= activity_type_record.max_daily_count THEN
      points_to_award := 0; -- No points if over daily limit
    ELSE
      points_to_award := activity_type_record.points_value;
    END IF;
  ELSE
    points_to_award := activity_type_record.points_value;
  END IF;
  
  -- Insert activity record
  INSERT INTO user_activities (user_id, activity_type_id, points_earned, metadata)
  VALUES (p_user_id, activity_type_record.id, points_to_award, p_metadata)
  RETURNING id INTO activity_id;
  
  -- Update user points and tier if points were awarded
  IF points_to_award > 0 THEN
    PERFORM update_user_points_and_tier(p_user_id, points_to_award);
  END IF;
  
  -- Update last activity date
  UPDATE users 
  SET last_activity_date = CURRENT_DATE,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update leaderboard
CREATE OR REPLACE FUNCTION update_leaderboard(p_period_type TEXT DEFAULT 'all_time')
RETURNS VOID AS $$
BEGIN
  -- Delete existing entries for this period
  DELETE FROM leaderboard_entries WHERE period_type = p_period_type;
  
  -- Insert updated leaderboard
  IF p_period_type = 'all_time' THEN
    INSERT INTO leaderboard_entries (user_id, points, rank, period_type)
    SELECT 
      id,
      total_points,
      ROW_NUMBER() OVER (ORDER BY total_points DESC),
      'all_time'
    FROM users
    WHERE total_points > 0
    ORDER BY total_points DESC;
  END IF;
  
  -- Add more period types as needed (monthly, weekly, daily)
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update leaderboard when user points change
CREATE OR REPLACE FUNCTION trigger_update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all-time leaderboard when user points change
  PERFORM update_leaderboard('all_time');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leaderboard_on_points_change
  AFTER UPDATE OF total_points ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_leaderboard();

-- Initial leaderboard population
SELECT update_leaderboard('all_time');

