-- Create user_metadata table for storing Sharetribe user metadata
CREATE TABLE IF NOT EXISTS user_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sharetribe_user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  referral_code TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_metadata_sharetribe_user_id ON user_metadata(sharetribe_user_id);
CREATE INDEX IF NOT EXISTS idx_user_metadata_user_email ON user_metadata(user_email);
CREATE INDEX IF NOT EXISTS idx_user_metadata_referral_code ON user_metadata(referral_code);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_metadata_updated_at 
    BEFORE UPDATE ON user_metadata 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: System can insert/update metadata (for API)
CREATE POLICY "System can manage user metadata" ON user_metadata
  FOR ALL USING (true);

-- Add comments
COMMENT ON TABLE user_metadata IS 'Stores metadata for Sharetribe users including referral codes';
COMMENT ON COLUMN user_metadata.metadata IS 'JSON object containing user metadata like referralCode, referredAt, etc.'; 