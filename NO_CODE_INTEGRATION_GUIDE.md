# No-Code Affiliate Marketing Integration Guide

## 🎯 Overview

This guide shows you how to integrate affiliate tracking with your marketplace using Google Analytics and webhooks - **NO CODE REQUIRED** on your signup/purchase pages!

## 📋 Prerequisites

1. Google Analytics 4 (GA4) account
2. Access to your marketplace's HTML head section
3. Webhook endpoint URL: `https://your-domain.com/api/webhook/google-analytics`

## 🚀 Step-by-Step Setup

### Step 1: Set up Google Analytics 4

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new property for your marketplace
3. Get your Measurement ID (G-XXXXXXXXXX)

### Step 2: Add Google Analytics to Your Marketplace

Add this to your marketplace's `<head>` section:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Step 3: Add Event Tracking (Optional - for enhanced tracking)

Add this to your signup and purchase pages:

```html
<script>
// Track signup event (add to your signup form submission)
function trackSignup(userEmail, userName) {
  gtag('event', 'sign_up', {
    'event_category': 'engagement',
    'event_label': 'user_registration',
    'custom_parameters': {
      'user_email': userEmail,
      'user_name': userName
    }
  });
}

// Track purchase event (add to your purchase confirmation page)
function trackPurchase(transactionId, value, currency) {
  gtag('event', 'purchase', {
    'transaction_id': transactionId,
    'value': value,
    'currency': currency
  });
}
</script>
```

### Step 4: Set up Google Analytics Webhook

1. Go to Google Analytics Admin
2. Navigate to Data Streams
3. Select your web stream
4. Go to "Enhanced Measurement" → "Events"
5. Add webhook URL: `https://your-domain.com/api/webhook/google-analytics`
6. Configure to send all events

### Step 5: Configure UTM Parameter Tracking

Google Analytics automatically tracks UTM parameters. Your referral links will look like:

```
https://test.moto-garage.co.uk/signup?utm_source=affiliate&utm_medium=referral&utm_campaign=TYLERMADDREN604
```

## 🔄 How It Works

### 1. Referral Link Flow
```
User clicks affiliate link → 
Lands on your signup page with UTM parameters → 
Google Analytics tracks the visit → 
User signs up/purchases → 
Google Analytics sends event to webhook → 
Webhook creates/updates referral in database
```

### 2. Event Tracking
- **Signup Events**: Tracked when users register
- **Purchase Events**: Tracked when users make purchases
- **UTM Parameters**: Automatically captured and associated with events

### 3. Webhook Processing
- Receives events from Google Analytics
- Extracts UTM campaign (referral code)
- Finds corresponding affiliate
- Creates/updates referral records
- Calculates commissions

## 📊 Benefits of This Approach

### ✅ No Code Required
- No JavaScript needed on signup/purchase pages
- Works with any platform (WordPress, Shopify, custom, etc.)
- No database modifications required

### ✅ Reliable Tracking
- Google Analytics handles all the heavy lifting
- Survives email verification redirects
- Works across different devices and browsers

### ✅ Scalable
- Handles high traffic volumes
- No performance impact on your site
- Google Analytics infrastructure is robust

### ✅ Analytics Integration
- Leverages existing Google Analytics setup
- Provides detailed analytics and reporting
- Integrates with other marketing tools

## 🛠️ Alternative: Plausible Analytics

If you prefer Plausible Analytics:

### 1. Set up Plausible
```html
<script defer data-domain="your-domain.com" src="https://plausible.io/js/script.js"></script>
```

### 2. Track Custom Events
```javascript
// Track signup
plausible('Signup', {props: {referral_code: 'TYLERMADDREN604'}});

// Track purchase
plausible('Purchase', {props: {referral_code: 'TYLERMADDREN604', value: 100}});
```

### 3. Use Plausible Webhooks
- Configure webhook in Plausible dashboard
- Send events to your webhook endpoint
- Process events similar to Google Analytics

## 🔧 Testing the Integration

### 1. Test Referral Link
```bash
# Click a referral link from your affiliate dashboard
# Should redirect to: https://test.moto-garage.co.uk/signup?utm_source=affiliate&utm_medium=referral&utm_campaign=CODE
```

### 2. Check Google Analytics
- Go to Google Analytics Real-Time reports
- Look for events with UTM parameters
- Verify events are being tracked

### 3. Check Webhook Logs
- Look for "=== GOOGLE ANALYTICS WEBHOOK ===" in server logs
- Verify referral records are being created

### 4. Check Affiliate Dashboard
- Go to Referrals tab
- Verify new referrals appear
- Check commission calculations

## 🚨 Troubleshooting

### Issue: Events not appearing in Google Analytics
**Solution:**
- Verify Google Analytics code is installed correctly
- Check browser console for errors
- Ensure UTM parameters are present in URLs

### Issue: Webhook not receiving events
**Solution:**
- Verify webhook URL is correct in Google Analytics
- Check server logs for webhook requests
- Ensure webhook endpoint is accessible

### Issue: Referrals not being created
**Solution:**
- Check webhook logs for errors
- Verify affiliate exists with correct referral code
- Ensure UTM campaign matches affiliate referral code

## 📈 Next Steps

1. **Deploy the webhook endpoint** to your server
2. **Set up Google Analytics** on your marketplace
3. **Configure webhook** in Google Analytics
4. **Test with a referral link**
5. **Monitor logs** for successful tracking
6. **Scale up** with more affiliates

## 🎉 Result

You now have a **completely no-code** affiliate tracking system that:
- ✅ Works with any platform
- ✅ Requires no code changes to your signup/purchase pages
- ✅ Handles email verification flows
- ✅ Provides detailed analytics
- ✅ Scales automatically
- ✅ Integrates with existing tools 