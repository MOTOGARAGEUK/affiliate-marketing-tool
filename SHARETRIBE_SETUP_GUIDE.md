# Sharetribe Integration Setup Guide

## 🎯 Overview

This guide will help you set up affiliate tracking with your Sharetribe marketplace using the Marketplace API (Client ID/Secret).

## 🚀 Step-by-Step Setup

### **Step 1: Create Sharetribe Marketplace API**

1. **Go to Sharetribe Flex Console**
   - Visit: [https://flex-console.sharetribe.com/](https://flex-console.sharetribe.com/)
   - Sign in with your Sharetribe account

2. **Select your marketplace**
   - Choose your marketplace from the list

3. **Navigate to API**
   - In the left sidebar, look for **"API"** or **"Marketplace API"**
   - Click on it

4. **Create new API credentials**
   - Click **"Create new"** or **"Add API"**
   - Give it a name (e.g., "Affiliate Tracking API")
   - Select the appropriate permissions (read access to users and transactions)
   - Save the credentials

5. **Copy your credentials**
   - **Client ID** (a long string)
   - **Client Secret** (a long string)
   - Keep these secure!

### **Step 2: Add Integration to Your Application**

1. **Go to your affiliate marketing dashboard**
   - Navigate to **Integrations** tab
   - Click **"Connect Platform"**

2. **Fill in the Sharetribe details**
   - **Platform**: Select "Sharetribe"
   - **Marketplace ID**: Your marketplace identifier (usually your marketplace name)
   - **Client ID**: The Client ID from Step 1
   - **Client Secret**: The Client Secret from Step 1

3. **Click "Connect"**
   - The system will save your credentials securely
   - You'll see a success message

### **Step 3: Create Database Tables**

Run these SQL scripts in your Supabase dashboard:

#### **UTM Tracking Table:**
```sql
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
```

#### **Integrations Table:**
```sql
-- Create integrations table to store platform integrations
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'sharetribe', 'shopify', 'woocommerce', etc.
    name TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, type)
);

-- Enable RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own integrations" ON public.integrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations" ON public.integrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations" ON public.integrations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations" ON public.integrations
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON public.integrations(type);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON public.integrations(status);

-- Create updated_at trigger
CREATE TRIGGER update_integrations_updated_at 
    BEFORE UPDATE ON public.integrations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### **Step 4: Test the Integration**

1. **Test the sync endpoint:**
   ```bash
   curl -X POST https://your-domain.com/api/manual-sync
   ```

2. **Check server logs** for:
   - "Sharetribe API Mode: Marketplace API"
   - "=== SHARETRIBE REFERRAL SYNC ==="

3. **Test with real data:**
   - Click a referral link from your affiliate dashboard
   - Sign up on your Sharetribe marketplace
   - Run manual sync to process the referral
   - Check the Referrals tab in your dashboard

## 🔄 How It Works

### **Automated Process:**
1. **User clicks referral link** → Lands on Sharetribe with UTM parameters
2. **Google Analytics captures** UTM parameters (if webhook is set up)
3. **Automated sync** (every hour) queries Sharetribe API using your credentials
4. **Matches UTM data** with Sharetribe users
5. **Creates referral records** automatically

### **Manual Process:**
1. **Run manual sync** → Queries Sharetribe API for recent users/transactions
2. **Processes UTM data** → Matches with affiliate referral codes
3. **Creates referrals** → Updates database with referral records

## 📊 Benefits

### ✅ **Completely No-Code**
- No JavaScript needed on Sharetribe pages
- No code modifications required
- Uses existing Sharetribe Marketplace API
- Works with any Sharetribe marketplace

### ✅ **Secure**
- Credentials stored securely in database
- Client Secret never exposed in frontend
- Row Level Security (RLS) enabled
- User-specific data isolation

### ✅ **Reliable**
- Survives email verification flows
- Works across all devices and browsers
- Automated processing
- Error handling and logging

## 🧪 Testing

### **Test Integration Connection:**
1. Go to Integrations tab
2. Connect your Sharetribe marketplace
3. Verify status shows "connected"

### **Test API Access:**
```bash
curl -X POST https://your-domain.com/api/manual-sync
```

### **Test Referral Tracking:**
1. Create an affiliate with a referral code
2. Click the referral link
3. Sign up on your Sharetribe marketplace
4. Run manual sync
5. Check Referrals tab for new entry

## 🚨 Troubleshooting

### **Issue: "Failed to connect integration"**
**Solutions:**
- Verify Client ID and Secret are correct
- Check that you have the right API permissions
- Ensure marketplace ID is correct

### **Issue: "Sharetribe API error"**
**Solutions:**
- Check API credentials are valid
- Verify marketplace is active
- Check API rate limits

### **Issue: "No referrals found"**
**Solutions:**
- Run manual sync to test
- Check server logs for errors
- Verify affiliate exists with correct referral code

## 📈 Monitoring

### **Server Logs:**
- Look for "=== SHARETRIBE REFERRAL SYNC ==="
- Check for "Sharetribe API Mode: Marketplace API"
- Monitor error messages and debugging info

### **Dashboard:**
- Check Integrations tab for connection status
- Monitor Referrals tab for new entries
- Verify commission calculations

### **API Endpoints:**
- `/api/manual-sync` - Test sync manually
- `/api/integrations/sharetribe` - Manage integration settings

## 🎉 Result

You now have a **completely no-code** affiliate tracking system that:
- ✅ Works with any Sharetribe marketplace
- ✅ Requires no code changes to Sharetribe
- ✅ Uses secure Marketplace API credentials
- ✅ Automatically syncs referrals via API
- ✅ Handles email verification flows
- ✅ Provides detailed analytics
- ✅ Scales automatically

## 🚀 Next Steps

1. **Monitor the system** for a few days
2. **Test with different referral links**
3. **Check commission calculations**
4. **Scale up with more affiliates**

**The system will automatically sync every hour and process new referrals!** 🎉 