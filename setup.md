# Quick Setup Guide

## 🚀 Quick Start (5 minutes)

### 1. Environment Setup
```bash
# Copy the environment template
cp .env.local .env.example

# Edit your environment variables
# Add your Whop and Supabase credentials to .env.local
```

### 2. Whop App Configuration
1. Visit [Whop Developer Dashboard](https://dev.whop.com)
2. Create new app or select existing
3. Set redirect URI: `http://localhost:3000/auth/callback`
4. Copy Client ID, Client Secret, and API Key to `.env.local`

### 3. Supabase Database Setup
```sql
-- Run this in your Supabase SQL Editor
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  whop_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE leaderboard_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_whop_user_id ON users(whop_user_id);
CREATE INDEX idx_leaderboard_points ON leaderboard_entries(points DESC);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Everyone can view leaderboard" ON leaderboard_entries FOR SELECT USING (true);
```

### 4. Start Development
```bash
npm run dev
```

Visit `http://localhost:3000` and test the login flow!

## 📝 Environment Variables Checklist

Make sure your `.env.local` has all these values:

- [ ] `NEXT_PUBLIC_WHOP_CLIENT_ID`
- [ ] `WHOP_CLIENT_SECRET`  
- [ ] `WHOP_API_KEY`
- [ ] `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`

## 🎯 Next Steps

1. **Test Authentication**: Click "Login with Whop" on homepage
2. **Verify Database**: Check if user data appears in Supabase
3. **Customize UI**: Edit components and styling
4. **Add Features**: Implement point tracking and leaderboards

## 🆘 Need Help?

- Check the full README.md for detailed instructions
- Verify your Whop app settings match the redirect URI
- Ensure Supabase tables are created correctly
- Check browser console for any errors
