# GA4 Referral Tracking Setup (No Code Required)

## Overview
This guide shows you how to set up referral tracking using **only your Google Analytics 4 (GA4) Measurement ID** without adding any code to your Sharetribe marketplace.

## Your GA4 Measurement ID
**G-BFWE6JSWZ1**

## Step 1: Create Affiliate Links with UTM Parameters

Your affiliate links should include UTM parameters like this:
```
https://test.moto-garage.co.uk/?utm_source=affiliate&utm_medium=link&utm_campaign=AFFILIATE_CODE
```

**Example:**
```
https://test.moto-garage.co.uk/?utm_source=affiliate&utm_medium=link&utm_campaign=JOHN123
```

## Step 2: Set Up GA4 Webhook (No Code Required)

### Option A: Use Google Analytics 4 Webhook Service

1. **Go to Google Analytics 4**
2. **Navigate to Admin → Data Streams**
3. **Click on your web stream**
4. **Set up a webhook** with these settings:
   - **URL**: `https://affiliate-marketing-tool-albc7yj7p-scoopies-projects.vercel.app/api/webhook/ga-utm-capture`
   - **Method**: POST
   - **Events**: All events (or specific events like `page_view`, `sign_up`)

### Option B: Use Google Tag Manager (if you have it)

1. **Go to Google Tag Manager**
2. **Create a new trigger** for affiliate events
3. **Create a new tag** that sends data to:
   ```
   https://affiliate-marketing-tool-albc7yj7p-scoopies-projects.vercel.app/api/webhook/ga-utm-capture
   ```

### Option C: Use a Third-Party Webhook Service

You can use services like:
- **Zapier** (connects GA4 to webhooks)
- **Make.com** (formerly Integromat)
- **n8n.io**

## Step 3: Test the Setup

### 3.1 Test Affiliate Link
1. Create an affiliate link with UTM parameters
2. Visit the link in an incognito browser
3. Complete a signup
4. Check that the event appears in GA4

### 3.2 Test in Your Affiliate App
1. Go to your affiliate app: `https://affiliate-marketing-tool-albc7yj7p-scoopies-projects.vercel.app`
2. Navigate to **Settings → Integrations**
3. Click **"Test Referral Flow"**
4. Check the results

## Step 4: Create Affiliates in Your App

1. **Go to Affiliates tab** in your app
2. **Create an affiliate account** with:
   - Name
   - Email
   - Referral code (this will be used in UTM campaign)
3. **Get the referral code** and use it in your affiliate links

## Step 5: Monitor Results

### Check GA4 Events
1. Go to **Reports → Engagement → Events**
2. Look for events with UTM parameters
3. Verify affiliate events are being tracked

### Check Your Affiliate App
1. Go to **Referrals tab** to see tracked referrals
2. Go to **Settings → Integrations → Test Referral Flow** to see database status

## Troubleshooting

### No Events in GA4
1. Verify your GA4 Measurement ID is correct
2. Check that UTM parameters are in the URL
3. Ensure GA4 is properly installed on your marketplace

### No Data in Affiliate App
1. Check webhook URL is correct
2. Verify webhook is active
3. Test the referral flow in your app

### UTM Parameters Not Captured
1. Ensure UTM parameters are in the affiliate link URL
2. Check GA4 is capturing the parameters
3. Verify webhook is receiving the data

## Example Affiliate Link Structure

```
https://test.moto-garage.co.uk/?utm_source=affiliate&utm_medium=link&utm_campaign=AFFILIATE_CODE
```

Where `AFFILIATE_CODE` is the referral code you create in your affiliate app.

## Support

If you need help:
1. Check the **Test Referral Flow** button in your app
2. Look at the console logs for detailed information
3. Verify your GA4 setup is working correctly 