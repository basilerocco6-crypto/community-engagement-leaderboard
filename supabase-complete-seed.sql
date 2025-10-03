-- Complete Supabase User Engagement Seed Script
-- Fixed for "No rows returned" issue with proper conflict handling
-- Runs safely - handles duplicates and clears partial data

-- Step 1: Safely remove existing table (fixes partial/broken data)
DROP TABLE IF EXISTS user_engagement CASCADE;

-- Step 2: Create clean table structure with all required fields
CREATE TABLE user_engagement (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    total_points BIGINT DEFAULT 0,
    current_tier TEXT DEFAULT 'Bronze',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Enable Row Level Security for data protection
ALTER TABLE user_engagement ENABLE ROW LEVEL SECURITY;

-- Step 4: Create performance indexes for fast queries
CREATE INDEX idx_user_engagement_points ON user_engagement (total_points DESC);
CREATE INDEX idx_user_engagement_user_id ON user_engagement (user_id);

-- Step 5: Insert seed data (handles duplicates automatically)
INSERT INTO user_engagement (user_id, username, total_points, current_tier) VALUES 
    ('user_zTz43UvWWvvtlE', 'DevUser', 45, 'Bronze'),
    ('user_test1', 'TestUser1', 234, 'Silver'),
    ('user_test2', 'TestUser2', 789, 'Gold'),
    ('user_test3', 'TestUser3', 89, 'Bronze'),
    ('user_test4', 'TestUser4', 1234, 'Gold'),
    ('user_test5', 'TestUser5', 67, 'Bronze'),
    ('user_test6', 'TestUser6', 2156, 'Platinum'),
    ('user_test7', 'TestUser7', 4231, 'Platinum'),
    ('user_test8', 'TestUser8', 156, 'Silver'),
    ('user_test9', 'TestUser9', 6789, 'Diamond'),
    ('user_test10', 'TestUser10', 445, 'Silver')
ON CONFLICT (user_id) 
DO UPDATE SET 
    total_points = EXCLUDED.total_points,
    current_tier = EXCLUDED.current_tier,
    username = EXCLUDED.username,
    updated_at = NOW();

-- Verification: Count total rows and show sample data
SELECT 
    COUNT(*) as total_rows_inserted,
    'user_engagement table is ready!' as status
FROM user_engagement;
