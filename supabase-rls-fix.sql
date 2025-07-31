-- Fix RLS policies for the settings table
-- This script ensures proper authentication and authorization

-- First, let's check if the settings table exists and drop it if needed
DROP TABLE IF EXISTS public.settings CASCADE;

-- Create the settings table with proper structure
CREATE TABLE public.settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    setting_type TEXT NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
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

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON public.settings;

-- Create RLS policies with proper auth.uid() checks
CREATE POLICY "Users can view own settings" ON public.settings
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own settings" ON public.settings
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own settings" ON public.settings
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own settings" ON public.settings
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create a simple trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;
CREATE TRIGGER update_settings_updated_at 
    BEFORE UPDATE ON public.settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.settings TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show the RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'settings'; 