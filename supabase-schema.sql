-- Enable Row Level Security
-- Note: JWT secret is automatically managed by Supabase

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create programs table
CREATE TABLE public.programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('signup', 'purchase')) NOT NULL,
    commission DECIMAL(10,2) NOT NULL,
    commission_type TEXT CHECK (commission_type IN ('fixed', 'percentage')) NOT NULL,
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    description TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create affiliates table
CREATE TABLE public.affiliates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    status TEXT CHECK (status IN ('pending', 'active', 'inactive')) DEFAULT 'pending',
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
    referral_code TEXT UNIQUE NOT NULL,
    referral_link TEXT NOT NULL,
    total_referrals INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    bank_account_name TEXT,
    bank_account_number TEXT,
    bank_sort_code TEXT,
    bank_iban TEXT,
    bank_routing_number TEXT,
    bank_name TEXT
);

-- Create referrals table
CREATE TABLE public.referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    commission DECIMAL(10,2) NOT NULL,
    referral_code TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payouts table
CREATE TABLE public.payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
    method TEXT CHECK (method IN ('bank', 'paypal', 'stripe')) NOT NULL,
    reference TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Create integrations table
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

-- Create indexes for better performance
CREATE INDEX idx_programs_user_id ON public.programs(user_id);
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_program_id ON public.affiliates(program_id);
CREATE INDEX idx_referrals_user_id ON public.referrals(user_id);
CREATE INDEX idx_referrals_affiliate_id ON public.referrals(affiliate_id);
CREATE INDEX idx_referrals_program_id ON public.referrals(program_id);
CREATE INDEX idx_payouts_user_id ON public.payouts(user_id);
CREATE INDEX idx_payouts_affiliate_id ON public.payouts(affiliate_id);
CREATE INDEX idx_integrations_user_id ON public.integrations(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON public.affiliates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Programs policies
CREATE POLICY "Users can view own programs" ON public.programs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own programs" ON public.programs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own programs" ON public.programs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own programs" ON public.programs FOR DELETE USING (auth.uid() = user_id);

-- Affiliates policies
CREATE POLICY "Users can view own affiliates" ON public.affiliates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own affiliates" ON public.affiliates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own affiliates" ON public.affiliates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own affiliates" ON public.affiliates FOR DELETE USING (auth.uid() = user_id);

-- Referrals policies
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own referrals" ON public.referrals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own referrals" ON public.referrals FOR DELETE USING (auth.uid() = user_id);

-- Payouts policies
CREATE POLICY "Users can view own payouts" ON public.payouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payouts" ON public.payouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payouts" ON public.payouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payouts" ON public.payouts FOR DELETE USING (auth.uid() = user_id);

-- Integrations policies
CREATE POLICY "Users can view own integrations" ON public.integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own integrations" ON public.integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own integrations" ON public.integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own integrations" ON public.integrations FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 