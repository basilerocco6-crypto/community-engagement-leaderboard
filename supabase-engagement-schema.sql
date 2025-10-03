-- Engagement Leaderboard Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_engagement table
CREATE TABLE IF NOT EXISTS user_engagement (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL,
    total_points INTEGER DEFAULT 0 NOT NULL,
    current_tier VARCHAR(50) DEFAULT 'Bronze' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create engagement_events table
CREATE TABLE IF NOT EXISTS engagement_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    points_awarded INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Foreign key constraint
    CONSTRAINT fk_engagement_events_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES user_engagement(user_id) 
        ON DELETE CASCADE
);

-- Create tier_rewards table
CREATE TABLE IF NOT EXISTS tier_rewards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tier_name VARCHAR(50) NOT NULL UNIQUE,
    min_points INTEGER NOT NULL,
    reward_description TEXT NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_rewards table
CREATE TABLE IF NOT EXISTS user_rewards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    tier_name VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Foreign key constraints
    CONSTRAINT fk_user_rewards_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES user_engagement(user_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_user_rewards_tier_name 
        FOREIGN KEY (tier_name) 
        REFERENCES tier_rewards(tier_name) 
        ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate rewards
    UNIQUE(user_id, tier_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_engagement_total_points ON user_engagement(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_engagement_current_tier ON user_engagement(current_tier);
CREATE INDEX IF NOT EXISTS idx_engagement_events_user_id ON engagement_events(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_activity_type ON engagement_events(activity_type);
CREATE INDEX IF NOT EXISTS idx_engagement_events_created_at ON engagement_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tier_rewards_min_points ON tier_rewards(min_points);
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_unlocked_at ON user_rewards(unlocked_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_engagement_updated_at 
    BEFORE UPDATE ON user_engagement 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tier_rewards_updated_at 
    BEFORE UPDATE ON tier_rewards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create tier_change_history table for tracking tier upgrades
CREATE TABLE IF NOT EXISTS tier_change_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    previous_tier VARCHAR(50) NOT NULL,
    new_tier VARCHAR(50) NOT NULL,
    points_at_change INTEGER NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    trigger_activity_id UUID,
    
    -- Foreign key constraints
    CONSTRAINT fk_tier_history_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES user_engagement(user_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_tier_history_previous_tier 
        FOREIGN KEY (previous_tier) 
        REFERENCES tier_rewards(tier_name) 
        ON DELETE CASCADE,
    CONSTRAINT fk_tier_history_new_tier 
        FOREIGN KEY (new_tier) 
        REFERENCES tier_rewards(tier_name) 
        ON DELETE CASCADE,
    CONSTRAINT fk_tier_history_trigger_activity 
        FOREIGN KEY (trigger_activity_id) 
        REFERENCES engagement_events(id) 
        ON DELETE SET NULL
);

-- Create indexes for tier_change_history
CREATE INDEX IF NOT EXISTS idx_tier_history_user_id ON tier_change_history(user_id);
CREATE INDEX IF NOT EXISTS idx_tier_history_changed_at ON tier_change_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_tier_history_new_tier ON tier_change_history(new_tier);

-- Insert default tier rewards with updated thresholds
INSERT INTO tier_rewards (tier_name, min_points, reward_description, discount_percentage) VALUES
    ('Bronze', 0, 'Welcome tier with basic community access', 0),
    ('Silver', 101, 'Enhanced community features and 5% discount', 5),
    ('Gold', 501, 'Premium features and 10% discount', 10),
    ('Platinum', 1501, 'VIP access and 15% discount', 15),
    ('Diamond', 5000, 'Exclusive content and 20% discount', 20)
ON CONFLICT (tier_name) DO UPDATE SET
    min_points = EXCLUDED.min_points,
    reward_description = EXCLUDED.reward_description,
    discount_percentage = EXCLUDED.discount_percentage;

-- Create function to automatically update user tier based on points
CREATE OR REPLACE FUNCTION update_user_tier()
RETURNS TRIGGER AS $$
DECLARE
    old_tier VARCHAR(50);
    new_tier VARCHAR(50);
    latest_activity_id UUID;
BEGIN
    -- Get the user's current tier before update
    old_tier := OLD.current_tier;
    
    -- Calculate the new tier based on points
    SELECT tier_name INTO new_tier
    FROM tier_rewards 
    WHERE min_points <= NEW.total_points 
    ORDER BY min_points DESC 
    LIMIT 1;
    
    -- Update the user's tier
    UPDATE user_engagement 
    SET current_tier = new_tier
    WHERE user_id = NEW.user_id;
    
    -- If tier changed, record the change in history
    IF old_tier != new_tier THEN
        -- Get the most recent activity that might have triggered this change
        SELECT id INTO latest_activity_id
        FROM engagement_events
        WHERE user_id = NEW.user_id
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- Record tier change
        INSERT INTO tier_change_history (
            user_id, 
            previous_tier, 
            new_tier, 
            points_at_change,
            trigger_activity_id
        ) VALUES (
            NEW.user_id, 
            old_tier, 
            new_tier, 
            NEW.total_points,
            latest_activity_id
        );
    END IF;
    
    -- Check if user unlocked a new tier reward
    INSERT INTO user_rewards (user_id, tier_name)
    SELECT NEW.user_id, tier_name
    FROM tier_rewards
    WHERE min_points <= NEW.total_points
    AND tier_name NOT IN (
        SELECT tier_name 
        FROM user_rewards 
        WHERE user_id = NEW.user_id
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update tier when points change
CREATE TRIGGER update_user_tier_trigger
    AFTER UPDATE OF total_points ON user_engagement
    FOR EACH ROW EXECUTE FUNCTION update_user_tier();

-- Create function to add engagement points
CREATE OR REPLACE FUNCTION add_engagement_points(
    p_user_id VARCHAR(255),
    p_username VARCHAR(255),
    p_activity_type VARCHAR(100),
    p_points INTEGER,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    -- Insert or update user engagement
    INSERT INTO user_engagement (user_id, username, total_points)
    VALUES (p_user_id, p_username, p_points)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        total_points = user_engagement.total_points + p_points,
        username = p_username,
        updated_at = NOW();
    
    -- Record the engagement event
    INSERT INTO engagement_events (user_id, activity_type, points_awarded, metadata)
    VALUES (p_user_id, p_activity_type, p_points, p_metadata);
END;
$$ language 'plpgsql';

-- Create function to get user rank
CREATE OR REPLACE FUNCTION get_user_rank(p_user_id VARCHAR(255))
RETURNS INTEGER AS $$
DECLARE
    user_rank INTEGER;
BEGIN
    SELECT rank_number INTO user_rank
    FROM (
        SELECT user_id, 
               ROW_NUMBER() OVER (ORDER BY total_points DESC, updated_at ASC) as rank_number
        FROM user_engagement
    ) ranked_users
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(user_rank, 0);
END;
$$ language 'plpgsql';

-- Enable Row Level Security (RLS) for better security
ALTER TABLE user_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication setup)
-- These are basic policies - you may want to customize based on your auth requirements

-- Allow users to read their own engagement data
CREATE POLICY "Users can view their own engagement data" ON user_engagement
    FOR SELECT USING (auth.uid()::text = user_id);

-- Allow users to read their own events
CREATE POLICY "Users can view their own events" ON engagement_events
    FOR SELECT USING (auth.uid()::text = user_id);

-- Allow everyone to read tier rewards (public information)
CREATE POLICY "Everyone can view tier rewards" ON tier_rewards
    FOR SELECT USING (true);

-- Allow users to read their own rewards
CREATE POLICY "Users can view their own rewards" ON user_rewards
    FOR SELECT USING (auth.uid()::text = user_id);

-- Create reward_configurations table for customizable tier rewards
CREATE TABLE IF NOT EXISTS reward_configurations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    community_id VARCHAR(255) NOT NULL,
    tier_name VARCHAR(50) NOT NULL,
    reward_type VARCHAR(50) NOT NULL,
    reward_title VARCHAR(255) NOT NULL,
    reward_description TEXT NOT NULL,
    reward_value DECIMAL(10,2),
    reward_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Foreign key constraint
    CONSTRAINT fk_reward_configs_tier_name 
        FOREIGN KEY (tier_name) 
        REFERENCES tier_rewards(tier_name) 
        ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate reward configs
    UNIQUE(community_id, tier_name, reward_type, reward_title)
);

-- Create user_reward_unlocks table for tracking unlocked rewards
CREATE TABLE IF NOT EXISTS user_reward_unlocks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    reward_config_id UUID NOT NULL,
    tier_name VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Foreign key constraints
    CONSTRAINT fk_user_reward_unlocks_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES user_engagement(user_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_user_reward_unlocks_reward_config 
        FOREIGN KEY (reward_config_id) 
        REFERENCES reward_configurations(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_user_reward_unlocks_tier_name 
        FOREIGN KEY (tier_name) 
        REFERENCES tier_rewards(tier_name) 
        ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate unlocks
    UNIQUE(user_id, reward_config_id)
);

-- Create indexes for reward system
CREATE INDEX IF NOT EXISTS idx_reward_configs_community_id ON reward_configurations(community_id);
CREATE INDEX IF NOT EXISTS idx_reward_configs_tier_name ON reward_configurations(tier_name);
CREATE INDEX IF NOT EXISTS idx_reward_configs_reward_type ON reward_configurations(reward_type);
CREATE INDEX IF NOT EXISTS idx_reward_configs_is_active ON reward_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_user_reward_unlocks_user_id ON user_reward_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reward_unlocks_reward_config_id ON user_reward_unlocks(reward_config_id);
CREATE INDEX IF NOT EXISTS idx_user_reward_unlocks_tier_name ON user_reward_unlocks(tier_name);
CREATE INDEX IF NOT EXISTS idx_user_reward_unlocks_unlocked_at ON user_reward_unlocks(unlocked_at DESC);

-- Create trigger for reward_configurations updated_at
CREATE TRIGGER update_reward_configurations_updated_at 
    BEFORE UPDATE ON reward_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default reward configurations for each tier
INSERT INTO reward_configurations (community_id, tier_name, reward_type, reward_title, reward_description, reward_value, is_active) VALUES
    ('default', 'Bronze', 'special_access', 'Community Access', 'Welcome to the community with basic access to all channels', NULL, true),
    ('default', 'Silver', 'discount_percentage', 'Silver Member Discount', 'Get 5% off all premium content and products', 5, true),
    ('default', 'Silver', 'priority_support', 'Priority Support', 'Get faster response times from our support team', NULL, true),
    ('default', 'Gold', 'discount_percentage', 'Gold Member Discount', 'Get 10% off all premium content and products', 10, true),
    ('default', 'Gold', 'exclusive_content', 'Exclusive Content Access', 'Access to Gold-only content and resources', NULL, true),
    ('default', 'Gold', 'beta_access', 'Beta Features', 'Early access to new features and beta testing', NULL, true),
    ('default', 'Platinum', 'discount_percentage', 'Platinum Member Discount', 'Get 15% off all premium content and products', 15, true),
    ('default', 'Platinum', 'custom_role', 'VIP Role', 'Special VIP role with enhanced permissions', NULL, true),
    ('default', 'Platinum', 'priority_support', 'Premium Support', 'Direct line to community managers and priority support', NULL, true),
    ('default', 'Diamond', 'discount_percentage', 'Diamond Member Discount', 'Get 20% off all premium content and products', 20, true),
    ('default', 'Diamond', 'exclusive_content', 'Diamond Exclusive Content', 'Access to the most exclusive Diamond-only content', NULL, true),
    ('default', 'Diamond', 'custom_badge', 'Diamond Badge', 'Exclusive Diamond member badge and recognition', NULL, true),
    ('default', 'Diamond', 'priority_support', 'Personal Concierge', 'Personal community concierge service', NULL, true)
ON CONFLICT (community_id, tier_name, reward_type, reward_title) DO NOTHING;

-- Create function to automatically unlock rewards when user reaches new tier
CREATE OR REPLACE FUNCTION unlock_tier_rewards()
RETURNS TRIGGER AS $$
DECLARE
    reward_config RECORD;
    community_id_val VARCHAR(255) := 'default'; -- Default community, can be customized
BEGIN
    -- Only process if this is a tier upgrade (not downgrade)
    IF NEW.new_tier != OLD.previous_tier THEN
        -- Get all active reward configurations for the new tier
        FOR reward_config IN 
            SELECT * FROM reward_configurations 
            WHERE tier_name = NEW.new_tier 
            AND community_id = community_id_val 
            AND is_active = true
        LOOP
            -- Insert reward unlock if not already unlocked
            INSERT INTO user_reward_unlocks (user_id, reward_config_id, tier_name)
            VALUES (NEW.user_id, reward_config.id, NEW.new_tier)
            ON CONFLICT (user_id, reward_config_id) DO NOTHING;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to unlock rewards when tier changes
CREATE TRIGGER unlock_tier_rewards_trigger
    AFTER INSERT ON tier_change_history
    FOR EACH ROW EXECUTE FUNCTION unlock_tier_rewards();

-- Create function to get user's available rewards
CREATE OR REPLACE FUNCTION get_user_rewards(p_user_id VARCHAR(255), p_community_id VARCHAR(255) DEFAULT 'default')
RETURNS TABLE (
    reward_id UUID,
    reward_title VARCHAR(255),
    reward_description TEXT,
    reward_type VARCHAR(50),
    reward_value DECIMAL(10,2),
    reward_data JSONB,
    tier_name VARCHAR(50),
    unlocked_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rc.id as reward_id,
        rc.reward_title,
        rc.reward_description,
        rc.reward_type,
        rc.reward_value,
        rc.reward_data,
        uru.tier_name,
        uru.unlocked_at,
        uru.used_at,
        uru.is_active
    FROM user_reward_unlocks uru
    JOIN reward_configurations rc ON uru.reward_config_id = rc.id
    WHERE uru.user_id = p_user_id 
    AND rc.community_id = p_community_id
    AND uru.is_active = true
    ORDER BY uru.unlocked_at DESC;
END;
$$ language 'plpgsql';

-- Create function to mark reward as used
CREATE OR REPLACE FUNCTION use_reward(p_user_id VARCHAR(255), p_reward_config_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    reward_exists BOOLEAN := false;
BEGIN
    -- Check if user has this reward unlocked
    SELECT EXISTS(
        SELECT 1 FROM user_reward_unlocks 
        WHERE user_id = p_user_id 
        AND reward_config_id = p_reward_config_id 
        AND is_active = true 
        AND used_at IS NULL
    ) INTO reward_exists;
    
    IF reward_exists THEN
        -- Mark reward as used
        UPDATE user_reward_unlocks 
        SET used_at = NOW() 
        WHERE user_id = p_user_id 
        AND reward_config_id = p_reward_config_id;
        
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ language 'plpgsql';

-- Enable Row Level Security for reward tables
ALTER TABLE reward_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reward_unlocks ENABLE ROW LEVEL SECURITY;

-- Create policies for reward system
-- Allow community owners to manage their reward configurations
CREATE POLICY "Community owners can manage reward configs" ON reward_configurations
    FOR ALL USING (true); -- Adjust based on your auth system

-- Allow users to view their own unlocked rewards
CREATE POLICY "Users can view their own rewards" ON user_reward_unlocks
    FOR SELECT USING (auth.uid()::text = user_id);

-- Allow service role to manage rewards (for API operations)
CREATE POLICY "Service role can manage rewards" ON user_reward_unlocks
    FOR ALL USING (true); -- This will be restricted by service role usage

-- Allow service role to insert/update (for your API endpoints)
-- Note: You'll need to use the service role key for API operations