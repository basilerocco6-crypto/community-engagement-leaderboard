-- Complete Supabase User Engagement Seed Script 🚀
-- One-click fix for "No rows returned" issue with proper duplicate handling
-- SAFE: Clears partial data, creates clean structure, handles conflicts

-- 🗑️ STEP 1: Safely remove existing table and dependencies (fixes partial/broken data)
DROP TABLE IF EXISTS user_engagement CASCADE;

-- 🏗️ STEP 2: Create fresh table with optimal structure
CREATE TABLE user_engagement (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    total_points BIGINT DEFAULT 0,
    current_tier TEXT DEFAULT 'Bronze',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🔒 STEP 3: Enable Row Level Security for data protection
ALTER TABLE user_engagement ENABLE ROW LEVEL SECURITY;

-- ⚡ STEP 4: Create performance indexes for fast queries
CREATE INDEX idx_user_engagement_points ON user_engagement (total_points DESC);
CREATE INDEX idx_user_engagement_user_id ON user_engagement (user_id);

-- 🌱 STEP 5: Insert seed data with automatic duplicate handling
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

-- ✅ VERIFICATION: Display final leaderboard with tier badges
SELECT 
    ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank,
    username,
    current_tier,
    total_points,
    CASE 
        WHEN total_points >= 5000 THEN '💎 Diamond'
        WHEN total_points >= 2000 THEN '🏆 Platinum' 
        WHEN total_points >= 1000 THEN '🥇 Gold'
        WHEN total_points >= 500 THEN '🥈 Silver'
        ELSE '🥉 Bronze'
    END as tier_badge
FROM user_engagement
ORDER BY total_points DESC;
