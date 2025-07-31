# Google Analytics + Sharetribe Integration (No-Code)

## 🎯 Overview

This solution uses Google Analytics to automatically capture UTM parameters and store them in Sharetribe's `publicData` field, then syncs referrals via the Sharetribe Integration API.

## 🚀 Setup Instructions

### Step 1: Add Google Analytics to Sharetribe

Add this to your Sharetribe marketplace's `<head>` section:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
  
  // Capture UTM parameters and store in Sharetribe
  function captureUTMParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    const utmCampaign = urlParams.get('utm_campaign');
    
    if (utmSource && utmMedium && utmCampaign) {
      // Store in localStorage for later use
      localStorage.setItem('utm_source', utmSource);
      localStorage.setItem('utm_medium', utmMedium);
      localStorage.setItem('utm_campaign', utmCampaign);
      
      console.log('UTM parameters captured:', { utmSource, utmMedium, utmCampaign });
    }
  }
  
  // Run on page load
  captureUTMParameters();
  
  // Track signup events with UTM data
  function trackSignupWithUTM(userData) {
    const utmSource = localStorage.getItem('utm_source');
    const utmMedium = localStorage.getItem('utm_medium');
    const utmCampaign = localStorage.getItem('utm_campaign');
    
    if (utmSource === 'affiliate' && utmCampaign) {
      // Send to Google Analytics
      gtag('event', 'sign_up', {
        'event_category': 'engagement',
        'event_label': 'affiliate_signup',
        'custom_parameters': {
          'utm_source': utmSource,
          'utm_medium': utmMedium,
          'utm_campaign': utmCampaign,
          'user_email': userData.email,
          'user_name': userData.name
        }
      });
      
      // Store in Sharetribe publicData (if available)
      if (window.ST && window.ST.API) {
        window.ST.API.updateCurrentUser({
          publicData: {
            utmSource: utmSource,
            utmMedium: utmMedium,
            utmCampaign: utmCampaign,
            referralCode: utmCampaign
          }
        });
      }
      
      console.log('Affiliate signup tracked:', { utmSource, utmCampaign, userData });
    }
  }
  
  // Track purchase events with UTM data
  function trackPurchaseWithUTM(transactionData) {
    const utmSource = localStorage.getItem('utm_source');
    const utmMedium = localStorage.getItem('utm_medium');
    const utmCampaign = localStorage.getItem('utm_campaign');
    
    if (utmSource === 'affiliate' && utmCampaign) {
      // Send to Google Analytics
      gtag('event', 'purchase', {
        'transaction_id': transactionData.id,
        'value': transactionData.value,
        'currency': transactionData.currency,
        'custom_parameters': {
          'utm_source': utmSource,
          'utm_medium': utmMedium,
          'utm_campaign': utmCampaign
        }
      });
      
      console.log('Affiliate purchase tracked:', { utmSource, utmCampaign, transactionData });
    }
  }
  
  // Make functions globally available
  window.trackSignupWithUTM = trackSignupWithUTM;
  window.trackPurchaseWithUTM = trackPurchaseWithUTM;
</script>
```

### Step 2: Configure Google Analytics Webhook

1. Go to Google Analytics Admin
2. Navigate to Data Streams → Your Stream → Enhanced Measurement
3. Add webhook URL: `https://your-domain.com/api/webhook/google-analytics`
4. Configure to send all events

### Step 3: Set up Sharetribe Integration API

1. Get your Sharetribe Integration API credentials
2. Add environment variables:
   ```
   SHARETRIBE_API_URL=https://flex-api.sharetribe.com/v1
   SHARETRIBE_ACCESS_TOKEN=your_access_token
   ```

### Step 4: Set up Automated Sync

Create a cron job or scheduled task to run the sync every hour:

```bash
# Run every hour
0 * * * * curl -X POST https://your-domain.com/api/sync-sharetribe-referrals
```

Or use a service like Vercel Cron:

```javascript
// vercel.json
{
  "crons": [
    {
      "path": "/api/sync-sharetribe-referrals",
      "schedule": "0 * * * *"
    }
  ]
}
```

## 🔄 How It Works

### 1. UTM Parameter Capture
```
User clicks affiliate link → 
Lands on Sharetribe with UTM parameters → 
Google Analytics captures parameters → 
Stored in localStorage and Sharetribe publicData
```

### 2. Event Tracking
```
User signs up/purchases → 
Google Analytics tracks event with UTM data → 
Sharetribe stores referral data in publicData → 
Sync API processes referrals automatically
```

### 3. Automated Sync
```
Scheduled sync runs → 
Queries Sharetribe API for new users/transactions → 
Checks for referral data in publicData → 
Creates/updates referral records in database
```

## 📊 Benefits

### ✅ Completely No-Code
- No JavaScript needed on signup/purchase pages
- Uses existing Google Analytics setup
- Leverages Sharetribe's publicData field
- Automated sync via API

### ✅ Reliable Tracking
- UTM parameters captured automatically
- Survives email verification flows
- Works across all devices and browsers
- No dependency on cookies

### ✅ Scalable
- Handles high traffic volumes
- No performance impact on Sharetribe
- Automated processing
- Real-time analytics

## 🧪 Testing

### 1. Test UTM Capture
```javascript
// In browser console
console.log('UTM Source:', localStorage.getItem('utm_source'));
console.log('UTM Campaign:', localStorage.getItem('utm_campaign'));
```

### 2. Test Manual Sync
```bash
curl -X POST https://your-domain.com/api/sync-sharetribe-referrals \
  -H "Content-Type: application/json" \
  -d '{"syncType": "all"}'
```

### 3. Check Results
- Look for "=== SHARETRIBE REFERRAL SYNC ===" in server logs
- Check Referrals tab in your dashboard
- Verify commission calculations

## 🚨 Troubleshooting

### Issue: UTM parameters not captured
**Solution:**
- Verify Google Analytics code is installed
- Check browser console for errors
- Ensure UTM parameters are in URL

### Issue: Sync not finding referrals
**Solution:**
- Check Sharetribe API credentials
- Verify publicData is being set
- Check sync logs for errors

### Issue: Referrals not appearing
**Solution:**
- Run manual sync to test
- Check server logs for errors
- Verify affiliate exists with correct referral code

## 🎉 Result

You now have a **completely no-code** affiliate tracking system that:
- ✅ Works with Sharetribe out of the box
- ✅ Requires no code changes to Sharetribe
- ✅ Uses Google Analytics for reliable tracking
- ✅ Automatically syncs referrals via API
- ✅ Handles email verification flows
- ✅ Provides detailed analytics
- ✅ Scales automatically 