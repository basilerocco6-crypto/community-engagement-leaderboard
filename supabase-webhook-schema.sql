-- Webhook-related tables for Whop Community App
-- Run this to add webhook logging and purchase tracking

-- Webhook events log
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processing_result JSONB,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase events tracking
CREATE TABLE IF NOT EXISTS purchase_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    purchase_id VARCHAR(255) NOT NULL UNIQUE,
    product_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    discount_applied JSONB,
    reward_used_id UUID,
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to user_engagement for webhook integration
ALTER TABLE user_engagement 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS discord_id TEXT,
ADD COLUMN IF NOT EXISTS whop_user_id TEXT UNIQUE;

-- Create indexes for webhook tables
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed_at ON webhook_events(processed_at);
CREATE INDEX idx_webhook_events_success ON webhook_events(success);
CREATE INDEX idx_purchase_events_user_id ON purchase_events(user_id);
CREATE INDEX idx_purchase_events_purchase_id ON purchase_events(purchase_id);
CREATE INDEX idx_purchase_events_created_at ON purchase_events(created_at);
CREATE INDEX idx_user_engagement_whop_user_id ON user_engagement(whop_user_id);
CREATE INDEX idx_user_engagement_is_active ON user_engagement(is_active);

-- Enable RLS for webhook tables
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook tables
-- Only admins can view webhook events
CREATE POLICY "Admins can view webhook events" ON webhook_events FOR SELECT 
USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

-- Users can view their own purchase events
CREATE POLICY "Users can view own purchases" ON purchase_events FOR SELECT 
USING (user_id = auth.uid()::text);

-- Admins can view all purchase events
CREATE POLICY "Admins can view all purchases" ON purchase_events FOR SELECT 
USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid()));

-- Function to clean up old webhook events (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_webhook_events()
RETURNS VOID AS $$
BEGIN
  DELETE FROM webhook_events 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to get webhook statistics
CREATE OR REPLACE FUNCTION get_webhook_stats(
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  total_events BIGINT,
  successful_events BIGINT,
  failed_events BIGINT,
  success_rate DECIMAL,
  events_by_type JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE success = true) as successful_events,
    COUNT(*) FILTER (WHERE success = false) as failed_events,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE success = true)::DECIMAL / COUNT(*)) * 100, 2)
      ELSE 0
    END as success_rate,
    jsonb_agg(
      jsonb_build_object(
        'event_type', event_type,
        'count', type_count,
        'success_count', success_count
      )
    ) as events_by_type
  FROM (
    SELECT 
      event_type,
      COUNT(*) as type_count,
      COUNT(*) FILTER (WHERE success = true) as success_count
    FROM webhook_events
    WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY event_type
    ORDER BY type_count DESC
  ) type_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to retry failed webhooks
CREATE OR REPLACE FUNCTION retry_failed_webhooks(
  p_max_retries INTEGER DEFAULT 3
)
RETURNS INTEGER AS $$
DECLARE
  retry_count INTEGER := 0;
  webhook_record RECORD;
BEGIN
  FOR webhook_record IN 
    SELECT * FROM webhook_events 
    WHERE success = false 
    AND retry_count < p_max_retries
    AND created_at >= NOW() - INTERVAL '24 hours'
  LOOP
    -- Update retry count
    UPDATE webhook_events 
    SET retry_count = retry_count + 1,
        processed_at = NOW()
    WHERE id = webhook_record.id;
    
    retry_count := retry_count + 1;
  END LOOP;
  
  RETURN retry_count;
END;
$$ LANGUAGE plpgsql;

-- Create a view for webhook dashboard
CREATE OR REPLACE VIEW webhook_dashboard AS
SELECT 
  DATE(created_at) as date,
  event_type,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE success = true) as successful_events,
  COUNT(*) FILTER (WHERE success = false) as failed_events,
  ROUND(AVG(CASE WHEN success THEN 1 ELSE 0 END) * 100, 2) as success_rate
FROM webhook_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), event_type
ORDER BY date DESC, event_type;

-- Insert sample webhook configuration
INSERT INTO system_events (event_type, admin_user_id, admin_username, description, metadata) VALUES
('WEBHOOK_SETUP', '00000000-0000-0000-0000-000000000000', 'System', 'Webhook system initialized', 
 jsonb_build_object(
   'endpoints', jsonb_build_array(
     '/api/webhooks/whop',
     '/api/webhooks/whop/test'
   ),
   'events_supported', jsonb_build_array(
     'membership.created',
     'course.completed', 
     'membership.cancelled',
     'payment.succeeded'
   )
 )
)
ON CONFLICT DO NOTHING;

-- Grant permissions for webhook functions
-- GRANT EXECUTE ON FUNCTION cleanup_webhook_events TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_webhook_stats TO authenticated;
-- GRANT SELECT ON webhook_dashboard TO authenticated;
