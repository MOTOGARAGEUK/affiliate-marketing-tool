# No-Code Sharetribe Affiliate Tracking Solution

## 🎯 Overview

This solution provides **completely no-code** affiliate tracking for Sharetribe marketplaces using only APIs and external services.

## 🚀 Available Options (No Code Changes Required)

### **Option 1: Google Analytics + Sharetribe API Sync (Recommended)**

This approach uses Google Analytics to capture UTM parameters and syncs with Sharetribe data via API.

#### **Setup Steps:**

1. **Set up Google Analytics on Sharetribe** (if not already done)
   - This is typically done through Sharetribe's admin panel
   - No code changes required

2. **Configure Google Analytics Webhook**
   - Go to Google Analytics Admin
   - Navigate to Data Streams → Your Stream → Enhanced Measurement
   - Add webhook URL: `https://your-domain.com/api/webhook/ga-utm-capture`
   - Configure to send all events

3. **Set up Sharetribe Integration API**
   - Get your Sharetribe Integration API credentials
   - Add environment variables:
     ```
     SHARETRIBE_API_URL=https://flex-api.sharetribe.com/v1
     SHARETRIBE_ACCESS_TOKEN=your_access_token
     ```

4. **Create UTM Tracking Table**
   - Run the SQL script: `create-utm-tracking-table.sql`
   - This stores UTM data for later sync

5. **Automated Sync**
   - The system automatically syncs every hour via Vercel cron
   - Matches UTM data with Sharetribe users
   - Creates referral records automatically

### **Option 2: Direct API Tracking**

This approach uses direct API calls to track referrals without Google Analytics.

#### **Setup Steps:**

1. **Use the Measurement Protocol Endpoint**
   - Endpoint: `https://your-domain.com/api/ga-measurement-protocol`
   - Call this endpoint when users sign up or make purchases
   - No code changes to Sharetribe required

2. **Integration via External Services**
   - Use Zapier, Make.com, or similar services
   - Trigger on Sharetribe webhooks (if available)
   - Send data to our tracking endpoint

### **Option 3: Manual Tracking via External Tools**

This approach uses external tools to capture and process referral data.

#### **Setup Steps:**

1. **Use Google Tag Manager (if available)**
   - Configure GTM in Sharetribe admin panel
   - Set up triggers for signup and purchase events
   - Send data to our tracking endpoints

2. **Use Webhook Services**
   - Services like webhook.site can capture UTM parameters
   - Forward data to our tracking endpoints
   - Process referrals automatically

## 🔄 How It Works

### **Option 1 Flow:**
```
User clicks affiliate link → 
Lands on Sharetribe with UTM parameters → 
Google Analytics captures parameters → 
Webhook stores UTM data → 
Automated sync matches with Sharetribe users → 
Creates referral records
```

### **Option 2 Flow:**
```
User signs up/purchases → 
External service detects event → 
Calls our tracking API → 
Creates referral record immediately
```

## 📊 Benefits

### ✅ Completely No-Code
- No JavaScript needed on Sharetribe pages
- No code modifications required
- Uses existing Google Analytics setup
- Works with any Sharetribe marketplace

### ✅ Reliable Tracking
- Multiple tracking methods available
- Survives email verification flows
- Works across all devices and browsers
- Automated processing

### ✅ Scalable
- Handles high traffic volumes
- No performance impact on Sharetribe
- Automated sync via API
- Real-time analytics

## 🧪 Testing

### **Test Option 1 (Google Analytics):**
1. Click a referral link
2. Check Google Analytics for UTM parameters
3. Run manual sync: `POST /api/manual-sync`
4. Check Referrals tab in dashboard

### **Test Option 2 (Direct API):**
```bash
curl -X POST https://your-domain.com/api/ga-measurement-protocol \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "sign_up",
    "userEmail": "test@example.com",
    "userName": "Test User",
    "utmSource": "affiliate",
    "utmMedium": "referral",
    "utmCampaign": "TYLERMADDREN604"
  }'
```

### **Test Manual Sync:**
```bash
curl -X POST https://your-domain.com/api/manual-sync
```

## 🛠️ Integration Examples

### **Zapier Integration:**
1. Create Zapier account
2. Set up trigger for Sharetribe user creation
3. Add action to call our tracking API
4. Include UTM parameters in the request

### **Make.com Integration:**
1. Create Make.com scenario
2. Monitor Sharetribe webhooks
3. Process UTM parameters
4. Send to our tracking endpoint

### **Google Tag Manager:**
1. Configure GTM in Sharetribe
2. Set up custom events
3. Send data to our endpoints
4. Process referrals automatically

## 🚨 Troubleshooting

### **Issue: UTM parameters not captured**
**Solutions:**
- Verify Google Analytics is properly configured
- Check webhook endpoint is receiving data
- Ensure UTM parameters are in referral links

### **Issue: Sync not finding referrals**
**Solutions:**
- Check Sharetribe API credentials
- Verify UTM data is being stored
- Run manual sync to test

### **Issue: Referrals not appearing**
**Solutions:**
- Check server logs for errors
- Verify affiliate exists with correct referral code
- Test with direct API calls

## 📈 Monitoring

### **Server Logs:**
- Look for "=== SHARETRIBE REFERRAL SYNC ==="
- Check for "=== GA UTM CAPTURE WEBHOOK ==="
- Monitor error messages and debugging info

### **Dashboard:**
- Check Referrals tab for new entries
- Monitor commission calculations
- Verify affiliate statistics

### **API Endpoints:**
- `/api/manual-sync` - Test sync manually
- `/api/ga-measurement-protocol` - Direct tracking
- `/api/sync-sharetribe-referrals` - Automated sync

## 🎉 Result

You now have a **completely no-code** affiliate tracking system that:
- ✅ Works with any Sharetribe marketplace
- ✅ Requires no code changes to Sharetribe
- ✅ Uses multiple tracking methods
- ✅ Automatically syncs referrals via API
- ✅ Handles email verification flows
- ✅ Provides detailed analytics
- ✅ Scales automatically
- ✅ Integrates with external services

## 🚀 Next Steps

1. **Choose your preferred option** (GA + API sync recommended)
2. **Set up Google Analytics** (if using Option 1)
3. **Configure Sharetribe API credentials**
4. **Test the tracking system**
5. **Monitor and scale up**

**This solution provides multiple no-code options for affiliate tracking with Sharetribe!** 🎉 