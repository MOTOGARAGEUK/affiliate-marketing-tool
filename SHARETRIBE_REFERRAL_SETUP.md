# Sharetribe Referral Tracking Setup Guide

## Overview
This guide will help you set up referral tracking on your Sharetribe marketplace so that affiliate signups are properly captured and tracked.

## Step 1: Set Up Google Analytics 4 (GA4)

### 1.1 Create a GA4 Property
1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property for your marketplace
3. Get your Measurement ID (format: G-XXXXXXXXXX)

### 1.2 Add GA4 to Your Sharetribe Marketplace
1. Go to your Sharetribe admin panel
2. Navigate to **Settings → SEO & Analytics**
3. Add your GA4 Measurement ID
4. Save the settings

## Step 2: Set Up UTM Tracking

### 2.1 Add UTM Parameters to Affiliate Links
Your affiliate links should include UTM parameters like this:
```
https://your-marketplace.sharetribe.com/?utm_source=affiliate&utm_medium=link&utm_campaign=AFFILIATE_CODE
```

### 2.2 Create a Custom JavaScript Snippet
Add this JavaScript to your Sharetribe marketplace to capture UTM data:

```javascript
// Add this to your Sharetribe marketplace custom code section
// Settings → Advanced → Custom code → Head

<script>
// Capture UTM parameters and send to GA4
(function() {
  // Get UTM parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');
  
  // If this is an affiliate referral
  if (utmSource === 'affiliate' && utmCampaign) {
    // Store UTM data in localStorage
    localStorage.setItem('affiliate_utm_source', utmSource);
    localStorage.setItem('affiliate_utm_medium', utmMedium);
    localStorage.setItem('affiliate_utm_campaign', utmCampaign);
    
    // Send to GA4
    if (typeof gtag !== 'undefined') {
      gtag('event', 'affiliate_visit', {
        'utm_source': utmSource,
        'utm_medium': utmMedium,
        'utm_campaign': utmCampaign
      });
    }
  }
})();

// Capture signup events
document.addEventListener('DOMContentLoaded', function() {
  // Listen for signup form submissions
  const signupForm = document.querySelector('form[action*="signup"], form[action*="register"]');
  if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
      const utmSource = localStorage.getItem('affiliate_utm_source');
      const utmMedium = localStorage.getItem('affiliate_utm_medium');
      const utmCampaign = localStorage.getItem('affiliate_utm_campaign');
      
      if (utmSource === 'affiliate' && utmCampaign) {
        // Add UTM data to form
        const utmInputs = [
          { name: 'utm_source', value: utmSource },
          { name: 'utm_medium', value: utmMedium },
          { name: 'utm_campaign', value: utmCampaign }
        ];
        
        utmInputs.forEach(function(input) {
          if (input.value) {
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = input.name;
            hiddenInput.value = input.value;
            signupForm.appendChild(hiddenInput);
          }
        });
        
        // Send to GA4
        if (typeof gtag !== 'undefined') {
          gtag('event', 'affiliate_signup', {
            'utm_source': utmSource,
            'utm_medium': utmMedium,
            'utm_campaign': utmCampaign
          });
        }
      }
    });
  }
});
</script>
```

## Step 3: Configure Webhook for UTM Data

### 3.1 Set Up Webhook in Sharetribe
1. Go to your Sharetribe admin panel
2. Navigate to **Settings → Advanced → Webhooks**
3. Add a new webhook with these settings:
   - **Event**: User created
   - **URL**: `https://your-affiliate-app.vercel.app/api/webhook/ga-utm-capture`
   - **Method**: POST

### 3.2 Alternative: Use Google Analytics Webhook
If you prefer to use Google Analytics:
1. Set up a Google Analytics webhook
2. Configure it to send data to: `https://your-affiliate-app.vercel.app/api/webhook/google-analytics`

## Step 4: Test the Setup

### 4.1 Test Affiliate Link
1. Create an affiliate link with UTM parameters
2. Visit the link in an incognito browser
3. Check that UTM data is captured in localStorage
4. Complete a signup
5. Check that the signup is tracked

### 4.2 Test in Your Affiliate App
1. Go to your affiliate app
2. Navigate to **Settings → Integrations**
3. Click **"Test Referral Flow"**
4. Check the results to see if data is being captured

## Step 5: Sync Data

### 5.1 Manual Sync
1. In your affiliate app, go to **Settings → Integrations**
2. Click **"Sync Recent Users"**
3. This will import recent signups from Sharetribe

### 5.2 Automatic Sync
The app will automatically sync data every 24 hours via cron job.

## Troubleshooting

### No Data Appearing
1. Check that GA4 is properly installed
2. Verify UTM parameters are being passed
3. Check webhook configuration
4. Test the referral flow in your affiliate app

### UTM Data Not Captured
1. Verify the JavaScript snippet is added to your marketplace
2. Check browser console for errors
3. Ensure UTM parameters are in the URL

### Webhook Not Working
1. Check webhook URL is correct
2. Verify webhook is active in Sharetribe
3. Check webhook logs in your affiliate app

## Support
If you need help with this setup, check the logs in your affiliate app or contact support. 