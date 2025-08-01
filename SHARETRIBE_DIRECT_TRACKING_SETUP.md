# Sharetribe Direct Tracking Setup

## 🎯 **Overview**

This solution adds a custom tracking script directly to your Sharetribe marketplace to capture referral codes and track affiliate signups in real-time.

## 🚀 **How It Works**

1. **User clicks affiliate link** → Lands on Sharetribe with referral code in URL
2. **Tracking script captures code** → Stores in localStorage and cookies
3. **User completes signup** → Script detects completion and sends data to your API
4. **Referral is created** → Affiliate gets notified and earns commission

## 📋 **Setup Instructions**

### **Step 1: Add Tracking Script to Sharetribe**

1. **Go to your Sharetribe admin panel**
2. **Navigate to**: Settings → Advanced → Custom code → Head
3. **Paste the tracking script** from `sharetribe-referral-tracking.js`
4. **Update the API URL** in the script:
   ```javascript
   const CONFIG = {
     API_URL: 'https://your-affiliate-app.vercel.app/api/track-referral',
     // ... other config
   };
   ```
5. **Save the settings**

### **Step 2: Configure Your Affiliate App**

Make sure your affiliate app has the tracking endpoint:

```
POST https://your-affiliate-app.vercel.app/api/track-referral
```

This endpoint is already implemented and handles:
- ✅ Page view tracking
- ✅ Form submission tracking  
- ✅ Signup completion tracking
- ✅ Affiliate notification
- ✅ Referral record creation

### **Step 3: Test the Setup**

#### **Test 1: Page View Tracking**
1. Visit: `https://your-marketplace.sharetribe.com?ref=TEST_AFFILIATE`
2. Check browser console for tracking logs
3. Verify API receives page view data

#### **Test 2: Signup Completion**
1. Complete a signup with referral code
2. Check that referral appears in your affiliate dashboard
3. Verify affiliate receives notification

## 🔧 **Script Features**

### **Automatic Referral Code Detection**
The script looks for referral codes in:
- URL parameters: `?ref=CODE`, `?referral=CODE`, `?affiliate=CODE`
- localStorage (persistent across sessions)
- Cookies (persistent across browser sessions)

### **Multi-Stage Tracking**
1. **Page View** - Tracks when user lands with referral code
2. **Form Submit** - Tracks when user submits signup form
3. **Signup Click** - Tracks when user clicks signup button
4. **Signup Complete** - Tracks successful signup completion

### **Smart Detection**
- Automatically detects signup forms and buttons
- Works with Sharetribe's SPA navigation
- Handles email verification flows
- Cleans up URL after capturing referral code

### **Persistence**
- Stores referral code for 30 days
- Survives page refreshes and navigation
- Works across different browsers and devices

## 🧪 **Testing Guide**

### **Enable Debug Mode**
Set `DEBUG: true` in the script configuration to see detailed logs:

```javascript
const CONFIG = {
  API_URL: 'https://your-affiliate-app.vercel.app/api/track-referral',
  DEBUG: true // Enable console logging
};
```

### **Test Scenarios**

#### **Scenario 1: Direct Signup**
1. Click affiliate link: `https://your-marketplace.sharetribe.com?ref=AFFILIATE_CODE`
2. Complete signup process
3. Check affiliate dashboard for new referral

#### **Scenario 2: Email Verification Flow**
1. Click affiliate link
2. Start signup but don't verify email
3. Return later and verify email
4. Check that referral is still tracked

#### **Scenario 3: Multiple Affiliate Codes**
1. Test with different affiliate codes
2. Verify each affiliate gets their own referrals
3. Check no cross-contamination between affiliates

### **Browser Console Logs**
Look for these log messages:
```
[Affiliate Tracking] Initializing referral tracker
[Affiliate Tracking] Found referral code: AFFILIATE_CODE
[Affiliate Tracking] Stored referral code: AFFILIATE_CODE
[Affiliate Tracking] Form tracking setup complete
[Affiliate Tracking] Signup form submitted
[Affiliate Tracking] Detected signup completion
[Affiliate Tracking] Tracking data sent successfully
```

## 📊 **Monitoring**

### **API Endpoint Logs**
Check your affiliate app logs for:
```
=== REFERRAL TRACKING DEBUG ===
📄 Page view tracked: { referralCode: 'AFFILIATE_CODE', page: '/signup' }
📝 Form submission tracked: { referralCode: 'AFFILIATE_CODE', email: 'user@example.com' }
✅ Signup completion tracked: { referralCode: 'AFFILIATE_CODE', userInfo: {...} }
✅ Referral tracked successfully
```

### **Database Monitoring**
Check your referrals table for new entries:
```sql
SELECT * FROM referrals 
WHERE created_at >= NOW() - INTERVAL '1 day' 
ORDER BY created_at DESC;
```

### **Affiliate Dashboard**
- Check Referrals tab for new entries
- Monitor commission calculations
- Verify affiliate notifications

## 🚨 **Troubleshooting**

### **Issue: Referral codes not being captured**
**Solutions:**
1. Check script is properly added to Sharetribe
2. Verify API URL is correct
3. Enable debug mode to see console logs
4. Check browser console for errors

### **Issue: Signups not being tracked**
**Solutions:**
1. Verify signup completion detection
2. Check API endpoint is responding
3. Review form detection logic
4. Test with debug mode enabled

### **Issue: Duplicate referrals**
**Solutions:**
1. Check duplicate prevention logic
2. Verify email matching
3. Review referral code storage
4. Check API response handling

### **Issue: Affiliate notifications not sending**
**Solutions:**
1. Check notification endpoint
2. Verify affiliate email addresses
3. Review notification configuration
4. Check API logs for errors

## 🔒 **Security Considerations**

### **Data Protection**
- Referral codes are stored locally only
- No sensitive data sent to tracking API
- HTTPS required for all API calls
- CORS properly configured

### **Rate Limiting**
- API includes rate limiting
- Duplicate prevention built-in
- Error handling for failed requests
- Graceful degradation

## 🎉 **Benefits**

This direct tracking approach provides:
- ✅ **Real-time tracking** - No delays or polling needed
- ✅ **High accuracy** - Direct integration with signup process
- ✅ **User-friendly** - No redirects or complex flows
- ✅ **Reliable** - Works with all Sharetribe features
- ✅ **Scalable** - Handles multiple affiliates easily
- ✅ **Maintainable** - Single script, easy to update

## 🚀 **Next Steps**

1. **Add the tracking script** to your Sharetribe marketplace
2. **Update the API URL** to point to your affiliate app
3. **Test with a sample affiliate** to verify tracking works
4. **Monitor the first few signups** to ensure accuracy
5. **Scale up** to multiple affiliates

**This direct tracking solution provides the most reliable and user-friendly approach to affiliate tracking with Sharetribe!** 🎉 