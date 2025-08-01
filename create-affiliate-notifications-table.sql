-- Create affiliate_notifications table for storing affiliate notifications
CREATE TABLE IF NOT EXISTS affiliate_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('new_referral', 'purchase', 'commission_paid', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  customer_email TEXT,
  customer_name TEXT,
  commission_earned DECIMAL(10,2) DEFAULT 0,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliate_notifications_affiliate_id ON affiliate_notifications(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_notifications_read ON affiliate_notifications(read);
CREATE INDEX IF NOT EXISTS idx_affiliate_notifications_created_at ON affiliate_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_notifications_type ON affiliate_notifications(notification_type);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_affiliate_notifications_updated_at 
    BEFORE UPDATE ON affiliate_notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE affiliate_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Affiliates can view their own notifications
CREATE POLICY "Affiliates can view their own notifications" ON affiliate_notifications
  FOR SELECT USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- Policy: Affiliates can update their own notifications (mark as read)
CREATE POLICY "Affiliates can update their own notifications" ON affiliate_notifications
  FOR UPDATE USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- Policy: System can insert notifications (for API)
CREATE POLICY "System can insert affiliate notifications" ON affiliate_notifications
  FOR INSERT WITH CHECK (true);

-- Add comments
COMMENT ON TABLE affiliate_notifications IS 'Stores notifications sent to affiliates about their referrals';
COMMENT ON COLUMN affiliate_notifications.notification_type IS 'Type of notification: new_referral, purchase, commission_paid, system';
COMMENT ON COLUMN affiliate_notifications.read IS 'Whether the affiliate has read this notification'; 