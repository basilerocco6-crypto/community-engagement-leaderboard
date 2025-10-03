-- Seed script for user_engagement table
-- Insert fake users and dev user for testing

INSERT INTO user_engagement (user_id, username, total_points, current_tier) VALUES 
-- Dev user (from OAuth token)
('user_zTz43UvWWvvtlE', 'DevUser', 45, 'Bronze'),

-- Test users with random points and appropriate tiers
('user_test1', 'TestUser1', 234, 'Silver'),
('user_test2', 'TestUser2', 789, 'Gold'),
('user_test3', 'TestUser3', 89, 'Bronze'),
('user_test4', 'TestUser4', 1234, 'Gold'),
('user_test5', 'TestUser5', 67, 'Bronze'),
('user_test6', 'TestUser6', 2156, 'Platinum'),
('user_test7', 'TestUser7', 4231, 'Platinum'),
('user_test8', 'TestUser8', 156, 'Bronze'),
('user_test9', 'TestUser9', 6789, 'Diamond'),
('user_test10', 'TestUser10', 445, 'Silver');
