-- Additional Admin Tables for Whop Community App
-- Run this after the main schema to add admin functionality

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Point adjustments log
CREATE TABLE IF NOT EXISTS point_adjustments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    admin_user_id UUID NOT NULL,
    admin_username VARCHAR(255) NOT NULL,
    adjustment_type VARCHAR(20) NOT NULL, -- 'add', 'remove', 'set'
    points_change INTEGER NOT NULL,
    previous_points INTEGER NOT NULL,
    new_points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System events log
CREATE TABLE IF NOT EXISTS system_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    admin_user_id UUID NOT NULL,
    admin_username VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Point configuration table (for dynamic point values)
CREATE TABLE IF NOT EXISTS point_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_type VARCHAR(100) NOT NULL UNIQUE,
    points_value INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    updated_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tier configuration table (for dynamic tier thresholds)
CREATE TABLE IF NOT EXISTS tier_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tier_name VARCHAR(50) NOT NULL UNIQUE,
    min_points INTEGER NOT NULL,
    max_points INTEGER,
    color VARCHAR(7) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    updated_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for admin tables
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_point_adjustments_user_id ON point_adjustments(user_id);
CREATE INDEX idx_point_adjustments_admin_user_id ON point_adjustments(admin_user_id);
CREATE INDEX idx_point_adjustments_created_at ON point_adjustments(created_at);
CREATE INDEX idx_system_events_event_type ON system_events(event_type);
CREATE INDEX idx_system_events_created_at ON system_events(created_at);
CREATE INDEX idx_point_configurations_activity_type ON point_configurations(activity_type);
CREATE INDEX idx_tier_configurations_tier_name ON tier_configurations(tier_name);

-- Enable RLS for admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin tables
-- Only admins can access admin_users table
CREATE POLICY "Only admins can view admin users" ON admin_users FOR SELECT 
USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.role IN ('admin', 'owner')));

CREATE POLICY "Only owners can manage admin users" ON admin_users FOR ALL 
USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.role = 'owner'));

-- Admins can view point adjustments, only they can insert
CREATE POLICY "Admins can view point adjustments" ON point_adjustments FOR SELECT 
USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

CREATE POLICY "Admins can insert point adjustments" ON point_adjustments FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

-- Similar policies for system events
CREATE POLICY "Admins can view system events" ON system_events FOR SELECT 
USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

CREATE POLICY "Admins can insert system events" ON system_events FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

-- Configuration tables - admins can manage
CREATE POLICY "Admins can manage point configurations" ON point_configurations FOR ALL 
USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

CREATE POLICY "Admins can manage tier configurations" ON tier_configurations FOR ALL 
USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

-- Everyone can read configurations (for the app to function)
CREATE POLICY "Everyone can read point configurations" ON point_configurations FOR SELECT USING (true);
CREATE POLICY "Everyone can read tier configurations" ON tier_configurations FOR SELECT USING (true);

-- Insert default point configurations (matching the engagement system)
INSERT INTO point_configurations (activity_type, points_value, description, category, updated_by) VALUES
('CHAT_MESSAGE', 3, 'Points for sending chat messages', 'chat', '00000000-0000-0000-0000-000000000000'),
('FORUM_POST', 15, 'Points for creating forum posts', 'forum', '00000000-0000-0000-0000-000000000000'),
('FORUM_REPLY', 8, 'Points for replying to forum posts', 'forum', '00000000-0000-0000-0000-000000000000'),
('COURSE_COMPLETED', 100, 'Points for completing courses', 'learning', '00000000-0000-0000-0000-000000000000'),
('LESSON_COMPLETED', 25, 'Points for completing lessons', 'learning', '00000000-0000-0000-0000-000000000000'),
('QUIZ_PASSED', 35, 'Points for passing quizzes', 'learning', '00000000-0000-0000-0000-000000000000'),
('REACTION_GIVEN', 1, 'Points for giving reactions', 'general', '00000000-0000-0000-0000-000000000000'),
('DAILY_LOGIN', 5, 'Points for daily login', 'general', '00000000-0000-0000-0000-000000000000'),
('PROFILE_COMPLETED', 20, 'Points for completing profile', 'general', '00000000-0000-0000-0000-000000000000'),
('CONTENT_SHARED', 12, 'Points for sharing content', 'general', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (activity_type) DO NOTHING;

-- Insert default tier configurations
INSERT INTO tier_configurations (tier_name, min_points, max_points, color, icon, description, updated_by) VALUES
('Bronze', 0, 100, '#CD7F32', '🥉', 'Welcome tier for new community members', '00000000-0000-0000-0000-000000000000'),
('Silver', 101, 500, '#C0C0C0', '🥈', 'Active members with consistent engagement', '00000000-0000-0000-0000-000000000000'),
('Gold', 501, 1500, '#FFD700', '🥇', 'Dedicated members with significant contributions', '00000000-0000-0000-0000-000000000000'),
('Platinum', 1501, 4999, '#E5E4E2', '💎', 'VIP members with exceptional engagement', '00000000-0000-0000-0000-000000000000'),
('Diamond', 5000, NULL, '#B9F2FF', '💠', 'Elite members with outstanding community impact', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (tier_name) DO NOTHING;

-- Function to sync point configurations with activity types
CREATE OR REPLACE FUNCTION sync_point_configurations()
RETURNS VOID AS $$
BEGIN
  -- Update activity_types table with values from point_configurations
  UPDATE activity_types 
  SET points_value = pc.points_value,
      is_active = pc.is_active,
      description = COALESCE(pc.description, activity_types.description)
  FROM point_configurations pc
  WHERE activity_types.name = pc.activity_type;
END;
$$ LANGUAGE plpgsql;

-- Function to get admin analytics
CREATE OR REPLACE FUNCTION get_admin_analytics(
  p_time_range TEXT DEFAULT '30d'
)
RETURNS TABLE (
  total_users INTEGER,
  active_users INTEGER,
  total_points BIGINT,
  total_activities BIGINT,
  top_activities JSONB,
  tier_distribution JSONB
) AS $$
DECLARE
  date_filter TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set date filter based on time range
  CASE p_time_range
    WHEN '7d' THEN date_filter := NOW() - INTERVAL '7 days';
    WHEN '30d' THEN date_filter := NOW() - INTERVAL '30 days';
    WHEN '90d' THEN date_filter := NOW() - INTERVAL '90 days';
    ELSE date_filter := '1970-01-01'::TIMESTAMP WITH TIME ZONE;
  END CASE;

  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM users) as total_users,
    (SELECT COUNT(DISTINCT user_id)::INTEGER 
     FROM user_activities 
     WHERE created_at >= date_filter) as active_users,
    (SELECT COALESCE(SUM(total_points), 0) FROM users) as total_points,
    (SELECT COUNT(*)::BIGINT 
     FROM user_activities 
     WHERE created_at >= date_filter) as total_activities,
    (SELECT jsonb_agg(
       jsonb_build_object(
         'activity_type', at.name,
         'count', activity_counts.count,
         'points', activity_counts.total_points
       )
     )
     FROM (
       SELECT 
         ua.activity_type_id,
         COUNT(*) as count,
         SUM(ua.points_earned) as total_points
       FROM user_activities ua
       WHERE ua.created_at >= date_filter
       GROUP BY ua.activity_type_id
       ORDER BY COUNT(*) DESC
       LIMIT 10
     ) activity_counts
     JOIN activity_types at ON at.id = activity_counts.activity_type_id
    ) as top_activities,
    (SELECT jsonb_agg(
       jsonb_build_object(
         'tier', tier_name,
         'count', user_count
       )
     )
     FROM (
       SELECT 
         ut.name as tier_name,
         COUNT(*) as user_count
       FROM users u
       LEFT JOIN user_tiers ut ON ut.id = u.current_tier_id
       GROUP BY ut.name, ut.min_points
       ORDER BY ut.min_points
     ) tier_counts
    ) as tier_distribution;
END;
$$ LANGUAGE plpgsql;

-- Create a view for easy admin dashboard queries
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM users WHERE last_activity_date >= CURRENT_DATE - INTERVAL '30 days') as active_users_30d,
  (SELECT SUM(total_points) FROM users) as total_points_awarded,
  (SELECT COUNT(*) FROM user_activities WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as activities_30d,
  (SELECT COUNT(*) FROM point_adjustments WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as adjustments_30d;

-- Grant necessary permissions
-- Note: In production, you should create specific roles and grant permissions accordingly
-- GRANT SELECT ON admin_dashboard_stats TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_admin_analytics TO authenticated;
