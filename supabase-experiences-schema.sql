-- Community Experiences Schema
-- This extends the existing schema to support Whop experiences/communities

-- Community experiences table
CREATE TABLE IF NOT EXISTS community_experiences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    experience_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    whop_company_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Community members table (links users to experiences)
CREATE TABLE IF NOT EXISTS community_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    experience_id TEXT NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Ensure unique user per experience
    UNIQUE(user_id, experience_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_experiences_experience_id ON community_experiences(experience_id);
CREATE INDEX IF NOT EXISTS idx_community_experiences_active ON community_experiences(is_active);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_experience_id ON community_members(experience_id);
CREATE INDEX IF NOT EXISTS idx_community_members_active ON community_members(is_active);

-- RLS (Row Level Security) policies
ALTER TABLE community_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- Allow read access to community experiences for authenticated users
CREATE POLICY "Users can view community experiences" ON community_experiences
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow read access to community members for authenticated users
CREATE POLICY "Users can view community members" ON community_members
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to insert themselves as community members
CREATE POLICY "Users can join communities" ON community_members
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Allow users to update their own membership status
CREATE POLICY "Users can update their own membership" ON community_members
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on community_experiences
CREATE TRIGGER update_community_experiences_updated_at 
    BEFORE UPDATE ON community_experiences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE community_experiences IS 'Stores Whop community/experience configurations';
COMMENT ON TABLE community_members IS 'Links users to specific community experiences';
COMMENT ON COLUMN community_experiences.experience_id IS 'The Whop experience/community identifier';
COMMENT ON COLUMN community_experiences.whop_company_id IS 'Optional Whop company ID for additional context';
COMMENT ON COLUMN community_members.experience_id IS 'References the experience_id from community_experiences';

