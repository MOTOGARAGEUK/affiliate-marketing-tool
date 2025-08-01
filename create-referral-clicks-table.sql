-- Create referral_clicks table for tracking affiliate link clicks
CREATE TABLE IF NOT EXISTS referral_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  matched_user_id UUID,
  matched_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending_match' CHECK (status IN ('pending_match', 'matched', 'expired', 'failed')),
  session_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_clicks_affiliate_id ON referral_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_referral_code ON referral_clicks(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_status ON referral_clicks(status);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_clicked_at ON referral_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_session_token ON referral_clicks(session_token);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_referral_clicks_updated_at 
    BEFORE UPDATE ON referral_clicks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;

-- Policy: Affiliates can view their own clicks
CREATE POLICY "Affiliates can view their own clicks" ON referral_clicks
  FOR SELECT USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- Policy: System can insert clicks (for API)
CREATE POLICY "System can insert referral clicks" ON referral_clicks
  FOR INSERT WITH CHECK (true);

-- Policy: System can update clicks (for matching)
CREATE POLICY "System can update referral clicks" ON referral_clicks
  FOR UPDATE USING (true);

-- Add comments
COMMENT ON TABLE referral_clicks IS 'Tracks affiliate link clicks for matching with new user signups';
COMMENT ON COLUMN referral_clicks.status IS 'Status of the click: pending_match, matched, expired, failed';
COMMENT ON COLUMN referral_clicks.session_token IS 'Unique token for this click session';
COMMENT ON COLUMN referral_clicks.matched_user_id IS 'Sharetribe user ID when matched'; 