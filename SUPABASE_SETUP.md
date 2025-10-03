# Supabase Integration Setup Guide

This guide will walk you through setting up the complete Supabase integration for your Whop Community App with engagement tracking, user tiers, and rewards system.

## 📋 Prerequisites

- A Supabase account ([sign up here](https://supabase.com))
- Your Whop app already configured
- Basic understanding of SQL

## 🚀 Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `whop-community-app`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be ready (2-3 minutes)

## 🔧 Step 2: Configure Environment Variables

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key
   - **service_role** key (keep this secret!)

3. Update your `.env.local` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: For client-side usage
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 🗄️ Step 3: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click "Run" to execute the schema

This will create:
- **Users table** with tier and points tracking
- **User tiers** (Newcomer, Regular, Contributor, Champion, Legend)
- **Activity types** with point values
- **User activities** tracking
- **Rewards system** with unlock conditions
- **Leaderboard** with different time periods
- **Database functions** for automated point calculation
- **Row Level Security** policies

## 🔒 Step 4: Configure Row Level Security (RLS)

The schema automatically sets up RLS policies, but you can customize them:

1. Go to **Authentication** > **Policies**
2. Review the policies for each table
3. Modify as needed for your security requirements

### Default Policies:
- **Users**: Everyone can view, users can update their own profile
- **Activities**: Everyone can view, users can insert their own activities
- **Rewards**: Everyone can view rewards and unlocks
- **Leaderboard**: Everyone can view

## 📊 Step 5: Verify Database Setup

1. Go to **Table Editor** in Supabase
2. You should see these tables:
   - `users`
   - `user_tiers`
   - `activity_types`
   - `user_activities`
   - `rewards`
   - `user_rewards`
   - `leaderboard_entries`

3. Check that default data was inserted:
   - 5 user tiers (Newcomer to Legend)
   - 15+ activity types
   - 6 default rewards

## 🧪 Step 6: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test the API endpoints:

### Record an Activity
```bash
curl -X POST http://localhost:3000/api/engagement/activity \
  -H "Content-Type: application/json" \
  -d '{"activityType": "daily_login", "metadata": {"source": "web"}}'
```

### Get Leaderboard
```bash
curl http://localhost:3000/api/engagement/leaderboard
```

### Get User Analytics
```bash
curl http://localhost:3000/api/engagement/analytics?type=overview
```

## 🎯 Step 7: Understanding the System

### Activity Types & Points

| Activity | Points | Daily Limit | Category |
|----------|--------|-------------|----------|
| Chat Message | 1 | 50 | chat |
| Forum Post | 10 | 5 | forum |
| Course Completed | 100 | ∞ | learning |
| Daily Login | 5 | 1 | engagement |
| Tutorial Created | 75 | ∞ | content |

### User Tiers

| Tier | Min Points | Benefits |
|------|------------|----------|
| Newcomer | 0 | Basic access |
| Regular | 100 | Basic support |
| Contributor | 500 | Priority support, early access |
| Champion | 1,500 | Exclusive channels, 1-on-1 calls |
| Legend | 5,000 | Custom role, revenue sharing |

### Reward System

Rewards unlock based on conditions:
- **Points**: Total points earned
- **Activities**: Specific activity counts
- **Tiers**: Reaching certain tiers
- **Streaks**: Login streaks

## 🔧 Step 8: Customization

### Adding New Activity Types

```sql
INSERT INTO activity_types (name, description, points_value, max_daily_count, category) 
VALUES ('custom_activity', 'Description', 25, 10, 'custom');
```

### Creating New Rewards

```sql
INSERT INTO rewards (name, description, reward_type, unlock_condition, reward_data) 
VALUES (
  'Super User',
  'Reached 10,000 points!',
  'badge',
  '{"points": 10000}',
  '{"badge_image": "super-user.png", "color": "#FFD700"}'
);
```

### Adding New Tiers

```sql
INSERT INTO user_tiers (name, description, min_points, color_hex, benefits) 
VALUES (
  'Elite',
  'Elite community member',
  10000,
  '#FF6B6B',
  '["All Legend benefits", "Personal mentor", "Revenue sharing boost"]'
);
```

## 📈 Step 9: Monitoring & Analytics

### Database Functions Available:

1. **`record_user_activity(user_id, activity_type, metadata)`**
   - Records activity and awards points
   - Updates user tier automatically
   - Handles daily limits

2. **`update_user_points_and_tier(user_id, points)`**
   - Updates user points and tier
   - Called automatically by activity recording

3. **`update_leaderboard(period_type)`**
   - Refreshes leaderboard rankings
   - Triggered automatically on point changes

### Useful Queries:

```sql
-- Get top performers this month
SELECT u.username, u.total_points, ut.name as tier
FROM users u
LEFT JOIN user_tiers ut ON u.current_tier_id = ut.id
ORDER BY u.total_points DESC
LIMIT 10;

-- Get most popular activities
SELECT at.name, COUNT(*) as activity_count, SUM(ua.points_earned) as total_points
FROM user_activities ua
JOIN activity_types at ON ua.activity_type_id = at.id
WHERE ua.activity_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY at.name
ORDER BY activity_count DESC;

-- Get reward unlock stats
SELECT r.name, COUNT(*) as unlock_count
FROM user_rewards ur
JOIN rewards r ON ur.reward_id = r.id
GROUP BY r.name
ORDER BY unlock_count DESC;
```

## 🚨 Troubleshooting

### Common Issues:

1. **"Supabase not configured" error**
   - Check environment variables are set correctly
   - Restart your development server

2. **RLS policy errors**
   - Ensure policies allow the operations you're trying to perform
   - Check if you need to use the service role key for admin operations

3. **Function not found errors**
   - Verify the database schema was applied correctly
   - Check the SQL Editor for any errors during schema creation

4. **Points not updating**
   - Check if activity type exists and is active
   - Verify daily limits aren't exceeded
   - Look at database logs in Supabase dashboard

### Getting Help:

- Check Supabase logs in the dashboard
- Use the SQL Editor to run test queries
- Review the RLS policies if you get permission errors
- Check the browser console for client-side errors

## 🎉 Next Steps

Your Supabase integration is now ready! You can:

1. **Integrate with your Whop app** to track real user activities
2. **Customize the UI** to display user progress and leaderboards
3. **Add real-time features** using Supabase subscriptions
4. **Implement webhooks** to sync with external platforms
5. **Create admin dashboards** for community management

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)

---

**Need help?** Check the troubleshooting section above or create an issue in the repository.

