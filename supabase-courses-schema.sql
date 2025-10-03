-- Whop Courses Integration Schema
-- Run this to add course tracking to your engagement system

-- Whop courses table (synced from Whop API)
CREATE TABLE IF NOT EXISTS whop_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    whop_course_id VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    duration_minutes INTEGER,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    category VARCHAR(100),
    instructor_name VARCHAR(255),
    instructor_avatar TEXT,
    total_modules INTEGER DEFAULT 0,
    points_value INTEGER DEFAULT 100,
    is_published BOOLEAN DEFAULT true,
    whop_created_at TIMESTAMP WITH TIME ZONE,
    whop_updated_at TIMESTAMP WITH TIME ZONE,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Whop course modules table
CREATE TABLE IF NOT EXISTS whop_course_modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    whop_module_id VARCHAR(255) NOT NULL UNIQUE,
    whop_course_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    content_type VARCHAR(20) CHECK (content_type IN ('video', 'text', 'quiz', 'assignment')),
    duration_minutes INTEGER,
    order_index INTEGER NOT NULL,
    points_value INTEGER DEFAULT 25,
    is_required BOOLEAN DEFAULT true,
    prerequisites JSONB DEFAULT '[]',
    content_url TEXT,
    quiz_data JSONB,
    whop_created_at TIMESTAMP WITH TIME ZONE,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (whop_course_id) REFERENCES whop_courses(whop_course_id) ON DELETE CASCADE
);

-- User course progress tracking
CREATE TABLE IF NOT EXISTS user_course_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    whop_course_id VARCHAR(255) NOT NULL,
    completed_modules JSONB DEFAULT '[]',
    current_module_id VARCHAR(255),
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    certificate_issued BOOLEAN DEFAULT false,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, whop_course_id),
    FOREIGN KEY (whop_course_id) REFERENCES whop_courses(whop_course_id) ON DELETE CASCADE
);

-- User module completions tracking
CREATE TABLE IF NOT EXISTS user_module_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    whop_course_id VARCHAR(255) NOT NULL,
    whop_module_id VARCHAR(255) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_spent_minutes INTEGER,
    score DECIMAL(5,2),
    attempts INTEGER DEFAULT 1,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, whop_module_id),
    FOREIGN KEY (whop_course_id) REFERENCES whop_courses(whop_course_id) ON DELETE CASCADE,
    FOREIGN KEY (whop_module_id) REFERENCES whop_course_modules(whop_module_id) ON DELETE CASCADE
);

-- Course engagement statistics
CREATE TABLE IF NOT EXISTS course_engagement_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    whop_course_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    enrollments_count INTEGER DEFAULT 0,
    completions_count INTEGER DEFAULT 0,
    average_completion_time_days DECIMAL(10,2),
    average_score DECIMAL(5,2),
    total_points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(whop_course_id, date),
    FOREIGN KEY (whop_course_id) REFERENCES whop_courses(whop_course_id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_whop_courses_category ON whop_courses(category);
CREATE INDEX idx_whop_courses_difficulty ON whop_courses(difficulty_level);
CREATE INDEX idx_whop_courses_published ON whop_courses(is_published);
CREATE INDEX idx_whop_course_modules_course_id ON whop_course_modules(whop_course_id);
CREATE INDEX idx_whop_course_modules_order ON whop_course_modules(whop_course_id, order_index);
CREATE INDEX idx_user_course_progress_user_id ON user_course_progress(user_id);
CREATE INDEX idx_user_course_progress_course_id ON user_course_progress(whop_course_id);
CREATE INDEX idx_user_course_progress_completed ON user_course_progress(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_user_module_completions_user_id ON user_module_completions(user_id);
CREATE INDEX idx_user_module_completions_course_id ON user_module_completions(whop_course_id);
CREATE INDEX idx_user_module_completions_completed_at ON user_module_completions(completed_at);
CREATE INDEX idx_course_engagement_stats_course_date ON course_engagement_stats(whop_course_id, date);

-- Enable RLS for course tables
ALTER TABLE whop_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE whop_course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_engagement_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Everyone can view published courses and modules
CREATE POLICY "Everyone can view published courses" ON whop_courses FOR SELECT 
USING (is_published = true);

CREATE POLICY "Everyone can view course modules" ON whop_course_modules FOR SELECT 
USING (EXISTS (SELECT 1 FROM whop_courses wc WHERE wc.whop_course_id = whop_course_modules.whop_course_id AND wc.is_published = true));

-- Users can view their own progress
CREATE POLICY "Users can view own course progress" ON user_course_progress FOR SELECT 
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view own module completions" ON user_module_completions FOR SELECT 
USING (user_id = auth.uid()::text);

-- Admins can view all data
CREATE POLICY "Admins can view all courses" ON whop_courses FOR SELECT 
USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

CREATE POLICY "Admins can manage courses" ON whop_courses FOR ALL 
USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

CREATE POLICY "Admins can view all progress" ON user_course_progress FOR SELECT 
USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

CREATE POLICY "Admins can view all completions" ON user_module_completions FOR SELECT 
USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

CREATE POLICY "Admins can view course stats" ON course_engagement_stats FOR SELECT 
USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

-- Functions for course engagement

-- Function to calculate course progress percentage
CREATE OR REPLACE FUNCTION calculate_course_progress(
  p_user_id UUID,
  p_course_id VARCHAR(255)
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_modules INTEGER;
  completed_modules INTEGER;
  progress_percentage DECIMAL(5,2);
BEGIN
  -- Get total modules for the course
  SELECT COUNT(*) INTO total_modules
  FROM whop_course_modules
  WHERE whop_course_id = p_course_id AND is_required = true;
  
  -- Get completed modules for the user
  SELECT COUNT(*) INTO completed_modules
  FROM user_module_completions umc
  JOIN whop_course_modules wcm ON wcm.whop_module_id = umc.whop_module_id
  WHERE umc.user_id = p_user_id 
    AND umc.whop_course_id = p_course_id 
    AND wcm.is_required = true;
  
  -- Calculate percentage
  IF total_modules > 0 THEN
    progress_percentage := (completed_modules::DECIMAL / total_modules::DECIMAL) * 100;
  ELSE
    progress_percentage := 0;
  END IF;
  
  RETURN ROUND(progress_percentage, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get user's course dashboard
CREATE OR REPLACE FUNCTION get_user_course_dashboard(p_user_id UUID)
RETURNS TABLE (
  course_id VARCHAR(255),
  course_title VARCHAR(500),
  course_category VARCHAR(100),
  difficulty_level VARCHAR(20),
  thumbnail_url TEXT,
  progress_percentage DECIMAL(5,2),
  completed_modules INTEGER,
  total_modules INTEGER,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  certificate_issued BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wc.whop_course_id,
    wc.title,
    wc.category,
    wc.difficulty_level,
    wc.thumbnail_url,
    COALESCE(ucp.progress_percentage, 0) as progress_percentage,
    (
      SELECT COUNT(*)::INTEGER 
      FROM user_module_completions umc 
      WHERE umc.user_id = p_user_id AND umc.whop_course_id = wc.whop_course_id
    ) as completed_modules,
    wc.total_modules,
    ucp.last_accessed_at,
    ucp.completed_at,
    COALESCE(ucp.certificate_issued, false) as certificate_issued
  FROM whop_courses wc
  LEFT JOIN user_course_progress ucp ON ucp.whop_course_id = wc.whop_course_id AND ucp.user_id = p_user_id
  WHERE wc.is_published = true
    AND (ucp.user_id IS NOT NULL OR EXISTS (
      SELECT 1 FROM user_module_completions umc 
      WHERE umc.user_id = p_user_id AND umc.whop_course_id = wc.whop_course_id
    ))
  ORDER BY ucp.last_accessed_at DESC NULLS LAST, wc.title;
END;
$$ LANGUAGE plpgsql;

-- Function to get course leaderboard
CREATE OR REPLACE FUNCTION get_course_leaderboard(
  p_course_id VARCHAR(255),
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  username VARCHAR(255),
  progress_percentage DECIMAL(5,2),
  completed_modules INTEGER,
  total_points INTEGER,
  completion_time_days INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ue.user_id,
    ue.username,
    COALESCE(ucp.progress_percentage, 0) as progress_percentage,
    (
      SELECT COUNT(*)::INTEGER 
      FROM user_module_completions umc 
      WHERE umc.user_id = ue.user_id AND umc.whop_course_id = p_course_id
    ) as completed_modules,
    (
      SELECT COALESCE(SUM(ee.points_awarded), 0)::INTEGER
      FROM engagement_events ee
      WHERE ee.user_id = ue.user_id 
        AND ee.metadata->>'course_id' = p_course_id
    ) as total_points,
    CASE 
      WHEN ucp.completed_at IS NOT NULL AND ucp.started_at IS NOT NULL THEN
        EXTRACT(DAYS FROM ucp.completed_at - ucp.started_at)::INTEGER
      ELSE NULL
    END as completion_time_days,
    ROW_NUMBER() OVER (
      ORDER BY 
        COALESCE(ucp.progress_percentage, 0) DESC,
        (SELECT COALESCE(SUM(ee.points_awarded), 0) FROM engagement_events ee WHERE ee.user_id = ue.user_id AND ee.metadata->>'course_id' = p_course_id) DESC,
        ucp.completed_at ASC NULLS LAST
    )::INTEGER as rank
  FROM user_engagement ue
  LEFT JOIN user_course_progress ucp ON ucp.user_id = ue.user_id AND ucp.whop_course_id = p_course_id
  WHERE EXISTS (
    SELECT 1 FROM user_module_completions umc 
    WHERE umc.user_id = ue.user_id AND umc.whop_course_id = p_course_id
  )
  ORDER BY rank
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update course engagement statistics
CREATE OR REPLACE FUNCTION update_course_engagement_stats(p_course_id VARCHAR(255), p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
  enrollments_count INTEGER;
  completions_count INTEGER;
  avg_completion_time DECIMAL(10,2);
  avg_score DECIMAL(5,2);
  total_points INTEGER;
BEGIN
  -- Calculate statistics
  SELECT COUNT(DISTINCT user_id) INTO enrollments_count
  FROM user_course_progress
  WHERE whop_course_id = p_course_id AND DATE(started_at) = p_date;
  
  SELECT COUNT(*) INTO completions_count
  FROM user_course_progress
  WHERE whop_course_id = p_course_id AND DATE(completed_at) = p_date;
  
  SELECT AVG(EXTRACT(DAYS FROM completed_at - started_at)) INTO avg_completion_time
  FROM user_course_progress
  WHERE whop_course_id = p_course_id AND completed_at IS NOT NULL AND started_at IS NOT NULL;
  
  SELECT AVG(score) INTO avg_score
  FROM user_module_completions
  WHERE whop_course_id = p_course_id AND score IS NOT NULL AND DATE(completed_at) = p_date;
  
  SELECT COALESCE(SUM(points_awarded), 0) INTO total_points
  FROM engagement_events
  WHERE metadata->>'course_id' = p_course_id AND DATE(created_at) = p_date;
  
  -- Upsert statistics
  INSERT INTO course_engagement_stats (
    whop_course_id, date, enrollments_count, completions_count,
    average_completion_time_days, average_score, total_points_awarded
  ) VALUES (
    p_course_id, p_date, enrollments_count, completions_count,
    avg_completion_time, avg_score, total_points
  )
  ON CONFLICT (whop_course_id, date) DO UPDATE SET
    enrollments_count = EXCLUDED.enrollments_count,
    completions_count = EXCLUDED.completions_count,
    average_completion_time_days = EXCLUDED.average_completion_time_days,
    average_score = EXCLUDED.average_score,
    total_points_awarded = EXCLUDED.total_points_awarded;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update course progress when module is completed
CREATE OR REPLACE FUNCTION trigger_update_course_progress()
RETURNS TRIGGER AS $$
DECLARE
  new_progress DECIMAL(5,2);
  total_required_modules INTEGER;
  completed_required_modules INTEGER;
BEGIN
  -- Calculate new progress percentage
  SELECT COUNT(*) INTO total_required_modules
  FROM whop_course_modules
  WHERE whop_course_id = NEW.whop_course_id AND is_required = true;
  
  SELECT COUNT(*) INTO completed_required_modules
  FROM user_module_completions umc
  JOIN whop_course_modules wcm ON wcm.whop_module_id = umc.whop_module_id
  WHERE umc.user_id = NEW.user_id 
    AND umc.whop_course_id = NEW.whop_course_id 
    AND wcm.is_required = true;
  
  IF total_required_modules > 0 THEN
    new_progress := (completed_required_modules::DECIMAL / total_required_modules::DECIMAL) * 100;
  ELSE
    new_progress := 0;
  END IF;
  
  -- Update or insert course progress
  INSERT INTO user_course_progress (
    user_id, whop_course_id, progress_percentage, started_at, last_accessed_at,
    completed_at, completed_modules
  ) VALUES (
    NEW.user_id, NEW.whop_course_id, new_progress, 
    COALESCE((SELECT started_at FROM user_course_progress WHERE user_id = NEW.user_id AND whop_course_id = NEW.whop_course_id), NOW()),
    NOW(),
    CASE WHEN new_progress >= 100 THEN NOW() ELSE NULL END,
    ARRAY[NEW.whop_module_id]::JSONB
  )
  ON CONFLICT (user_id, whop_course_id) DO UPDATE SET
    progress_percentage = new_progress,
    last_accessed_at = NOW(),
    completed_at = CASE WHEN new_progress >= 100 AND user_course_progress.completed_at IS NULL THEN NOW() ELSE user_course_progress.completed_at END,
    completed_modules = (
      SELECT jsonb_agg(whop_module_id)
      FROM user_module_completions
      WHERE user_id = NEW.user_id AND whop_course_id = NEW.whop_course_id
    ),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_progress_on_module_completion
  AFTER INSERT ON user_module_completions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_course_progress();

-- Create views for easy querying

-- View for course overview with statistics
CREATE OR REPLACE VIEW course_overview AS
SELECT 
  wc.*,
  COUNT(DISTINCT ucp.user_id) as total_enrolled,
  COUNT(DISTINCT CASE WHEN ucp.completed_at IS NOT NULL THEN ucp.user_id END) as total_completed,
  CASE 
    WHEN COUNT(DISTINCT ucp.user_id) > 0 THEN
      ROUND((COUNT(DISTINCT CASE WHEN ucp.completed_at IS NOT NULL THEN ucp.user_id END)::DECIMAL / COUNT(DISTINCT ucp.user_id)::DECIMAL) * 100, 2)
    ELSE 0
  END as completion_rate,
  AVG(CASE WHEN ucp.completed_at IS NOT NULL THEN EXTRACT(DAYS FROM ucp.completed_at - ucp.started_at) END) as avg_completion_days
FROM whop_courses wc
LEFT JOIN user_course_progress ucp ON ucp.whop_course_id = wc.whop_course_id
GROUP BY wc.id, wc.whop_course_id, wc.title, wc.description, wc.thumbnail_url, wc.duration_minutes, 
         wc.difficulty_level, wc.category, wc.instructor_name, wc.instructor_avatar, wc.total_modules, 
         wc.points_value, wc.is_published, wc.whop_created_at, wc.whop_updated_at, wc.synced_at, wc.created_at;

-- Grant necessary permissions
-- GRANT SELECT ON course_overview TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_user_course_dashboard TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_course_leaderboard TO authenticated;
-- GRANT EXECUTE ON FUNCTION calculate_course_progress TO authenticated;
