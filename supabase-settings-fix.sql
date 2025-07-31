-- Create a dedicated settings table to handle all application settings
-- This avoids the schema cache issues with the integrations table

-- Drop the existing integrations table if it exists
DROP TABLE IF EXISTS public.integrations CASCADE;

-- Create a new settings table that's more flexible
CREATE TABLE public.settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    setting_type TEXT NOT NULL, -- 'general', 'sharetribe', 'notifications', etc.
    setting_key TEXT NOT NULL, -- 'companyName', 'defaultCommission', 'clientId', etc.
    setting_value JSONB NOT NULL, -- The actual setting value
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, setting_type, setting_key)
);

-- Create indexes for better performance
CREATE INDEX idx_settings_user_id ON public.settings(user_id);
CREATE INDEX idx_settings_type ON public.settings(setting_type);
CREATE INDEX idx_settings_user_type ON public.settings(user_id, setting_type);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own settings" ON public.settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON public.settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'settings' 
AND table_schema = 'public'
ORDER BY ordinal_position; 