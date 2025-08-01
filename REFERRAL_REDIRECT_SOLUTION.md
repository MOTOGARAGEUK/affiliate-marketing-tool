# Referral Redirect Solution for Sharetribe

## 🎯 **Overview**

This solution implements your recommended approach for tracking affiliate referrals with Sharetribe:

1. **Affiliate link redirect page** stores referral code in your system
2. **User signs up** on Sharetribe
3. **Webhook/API polling** detects new user
4. **Your system** matches new user to referral click
5. **Calls Sharetribe's Integration API** to add metadata
6. **Optionally notify affiliate** of successful referral

## 🚀 **How It Works**

### **Step 1: Affiliate Link Redirect**
```
https://your-app.vercel.app/api/referral-redirect?ref=AFFILIATE_CODE&to=https://your-marketplace.sharetribe.com
```

**What happens:**
- Validates affiliate referral code
- Stores click in `referral_clicks` table
- Creates unique session token
- Redirects to Sharetribe with session token

### **Step 2: User Signs Up**
User completes signup on Sharetribe marketplace with session token in URL.

### **Step 3: API Polling Detects New User**
Automated sync process polls Sharetribe API for new users and matches them with referral clicks.

### **Step 4: System Matches User to Referral**
- Finds pending referral clicks
- Matches based on timing and session tokens
- Creates referral record
- Updates Sharetribe user metadata

### **Step 5: Affiliate Notification**
Sends notification to affiliate about successful referral.

## 📋 **Setup Instructions**

### **1. Database Setup**

Run these SQL scripts in your Supabase database:

```sql
-- Create referral clicks table
\i create-referral-clicks-table.sql

-- Create affiliate notifications table  
\i create-affiliate-notifications-table.sql
```

### **2. Environment Variables**

Add these to your `.env.local`:

```bash
# Sharetribe Configuration
SHARETRIBE_CLIENT_ID=your_client_id
SHARETRIBE_CLIENT_SECRET=your_client_secret
SHARETRIBE_MARKETPLACE_URL=https://your-marketplace.sharetribe.com

# Optional: Email notifications
ENABLE_EMAIL_NOTIFICATIONS=true
AFFILIATE_WEBHOOK_URL=https://your-webhook-endpoint.com
```

### **3. API Endpoints**

Your system now has these endpoints:

#### **Referral Redirect**
```
GET /api/referral-redirect?ref=AFFILIATE_CODE&to=SHARETRIBE_URL
```

#### **Match Referral User**
```
POST /api/match-referral-user
{
  "userEmail": "user@example.com",
  "userName": "User Name", 
  "sharetribeUserId": "user-id",
  "sessionToken": "ref_123_456",
  "referralCode": "AFFILIATE_CODE"
}
```

#### **Sync Sharetribe Referrals**
```
POST /api/sync-sharetribe-referrals
{
  "syncType": "recent" // or "all"
}
```

#### **Notify Affiliate**
```
POST /api/notify-affiliate
{
  "affiliateId": "affiliate-id",
  "referralId": "referral-id",
  "customerEmail": "user@example.com",
  "customerName": "User Name",
  "notificationType": "new_referral"
}
```

## 🔧 **Implementation Details**

### **Referral Click Tracking**

The `referral_clicks` table stores:
- **affiliate_id**: Which affiliate generated the click
- **referral_code**: The referral code used
- **ip_address**: User's IP for potential matching
- **user_agent**: Browser info for tracking
- **clicked_at**: When the click happened
- **session_token**: Unique token for this session
- **status**: pending_match, matched, expired, failed

### **User Matching Logic**

The system matches users to referral clicks using:

1. **Session Token Matching** (Primary)
   - Exact match using session token from URL
   - Most reliable method

2. **Timing-Based Matching** (Fallback)
   - Matches users who signed up within 1 hour of click
   - Uses referral code to identify affiliate

3. **IP-Based Matching** (Future Enhancement)
   - Could match by IP address for additional accuracy

### **Sharetribe Metadata Updates**

When a match is found, the system:
- Creates referral record in your database
- Attempts to update Sharetribe user metadata
- Stores referral information for future reference

## 🧪 **Testing**

### **Test 1: Referral Redirect**
```bash
curl "https://your-app.vercel.app/api/referral-redirect?ref=TEST_AFFILIATE&to=https://your-marketplace.sharetribe.com"
```

**Expected Result:**
- Redirects to Sharetribe with session token
- Creates record in `referral_clicks` table

### **Test 2: Manual User Matching**
```bash
curl -X POST https://your-app.vercel.app/api/match-referral-user \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "userName": "Test User",
    "sharetribeUserId": "test-user-id",
    "sessionToken": "ref_123_456",
    "referralCode": "TEST_AFFILIATE"
  }'
```

**Expected Result:**
- Creates referral record
- Sends affiliate notification
- Updates click status to "matched"

### **Test 3: Automated Sync**
```bash
curl -X POST https://your-app.vercel.app/api/sync-sharetribe-referrals \
  -H "Content-Type: application/json" \
  -d '{"syncType": "recent"}'
```

**Expected Result:**
- Polls Sharetribe for new users
- Attempts to match with pending clicks
- Creates referrals for matches

## 📊 **Monitoring**

### **Dashboard Metrics**
- **Pending Clicks**: Number of unmatched referral clicks
- **Match Rate**: Percentage of clicks that result in signups
- **Average Time to Match**: How long it takes to match users
- **Failed Matches**: Clicks that expired without matching

### **Log Monitoring**
Look for these log patterns:
```
=== REFERRAL REDIRECT HANDLER ===
=== MATCH REFERRAL USER ===
=== SHARETRIBE REFERRAL SYNC ===
=== AFFILIATE NOTIFICATION ===
```

### **Database Queries**

**Check pending clicks:**
```sql
SELECT COUNT(*) FROM referral_clicks WHERE status = 'pending_match';
```

**Check match rate:**
```sql
SELECT 
  COUNT(*) as total_clicks,
  COUNT(CASE WHEN status = 'matched' THEN 1 END) as matched_clicks,
  ROUND(COUNT(CASE WHEN status = 'matched' THEN 1 END) * 100.0 / COUNT(*), 2) as match_rate
FROM referral_clicks 
WHERE clicked_at >= NOW() - INTERVAL '7 days';
```

## 🔄 **Automation Setup**

### **Vercel Cron Job**

Add this to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/sync-sharetribe-referrals",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

This runs every 6 hours to sync new users.

### **Manual Sync Trigger**

You can also trigger sync manually:
```bash
curl -X POST https://your-app.vercel.app/api/manual-sync
```

## 🚨 **Troubleshooting**

### **Issue: No referrals being created**
**Solutions:**
1. Check Sharetribe API credentials
2. Verify referral codes exist in database
3. Check sync logs for errors
4. Test manual matching

### **Issue: Low match rate**
**Solutions:**
1. Check timing window (currently 1 hour)
2. Verify session tokens are being passed
3. Review click expiration settings
4. Check for duplicate clicks

### **Issue: Notifications not sending**
**Solutions:**
1. Check notification endpoint logs
2. Verify affiliate email addresses
3. Test webhook endpoints
4. Check environment variables

## 🎉 **Benefits**

This solution provides:
- ✅ **Reliable tracking** without Sharetribe code changes
- ✅ **Session-based matching** for accuracy
- ✅ **Automatic sync** via API polling
- ✅ **Affiliate notifications** for engagement
- ✅ **Scalable architecture** for multiple affiliates
- ✅ **Comprehensive logging** for debugging
- ✅ **Database storage** for all tracking data

## 🚀 **Next Steps**

1. **Deploy the database changes**
2. **Set up environment variables**
3. **Test the referral redirect flow**
4. **Configure automated sync**
5. **Set up affiliate notifications**
6. **Monitor and optimize**

**This solution provides a robust, no-code approach to affiliate tracking with Sharetribe!** 🎉 