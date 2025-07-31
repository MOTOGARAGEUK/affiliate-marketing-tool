-- Fix existing database schema - handles existing tables
-- This script will fix any missing columns or tables

-- First, let's check and fix the integrations table specifically
-- Drop the integrations table if it exists and recreate it properly
DROP TABLE IF EXISTS public.integrations CASCADE;

-- Recreate integrations table with correct structure
CREATE TABLE public.integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('sharetribe', 'shopify', 'woocommerce', 'custom')) NOT NULL,
    status TEXT CHECK (status IN ('connected', 'disconnected', 'error')) DEFAULT 'disconnected',
    config JSONB NOT NULL DEFAULT '{}',
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for integrations table
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON public.integrations(user_id);

-- Enable RLS on integrations table
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can insert own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can update own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can delete own integrations" ON public.integrations;

-- Create RLS policies for integrations table
CREATE POLICY "Users can view own integrations" ON public.integrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations" ON public.integrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations" ON public.integrations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations" ON public.integrations
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for integrations table
DROP TRIGGER IF EXISTS update_integrations_updated_at ON public.integrations;
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'integrations' 
AND table_schema = 'public'
ORDER BY ordinal_position; 