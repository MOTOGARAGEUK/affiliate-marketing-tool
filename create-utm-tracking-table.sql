-- Create UTM tracking table to store Google Analytics UTM data
CREATE TABLE IF NOT EXISTS public.utm_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_pseudo_id TEXT NOT NULL,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    event_name TEXT,
    event_timestamp TIMESTAMPTZ,
    user_email TEXT,
    user_name TEXT,
    processed BOOLEAN DEFAULT FALSE,
    sharetribe_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.utm_tracking ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_utm_tracking_user_pseudo_id ON public.utm_tracking(user_pseudo_id);
CREATE INDEX IF NOT EXISTS idx_utm_tracking_utm_campaign ON public.utm_tracking(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_utm_tracking_processed ON public.utm_tracking(processed);
CREATE INDEX IF NOT EXISTS idx_utm_tracking_created_at ON public.utm_tracking(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_utm_tracking_updated_at 
    BEFORE UPDATE ON public.utm_tracking 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 