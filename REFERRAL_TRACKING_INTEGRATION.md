# Referral Tracking Integration Guide

This document explains how to integrate referral tracking with your external systems (ShareTribe marketplace, signup forms, etc.).

## Overview

The affiliate marketing tool now supports two types of referral programs:

1. **Signup Programs** - Track when someone signs up using a referral link
2. **Purchase Programs** - Track when someone makes a purchase using a referral link

## Referral Link Formats

### Signup Programs
```
https://test.moto-garage.co.uk/signup?ref=REFERRALCODE
```

### Purchase Programs
```
https://your-marketplace.com/ref/REFERRALCODE
```

## How It Works

1. **User clicks referral link** → Goes to signup page with `?ref=CODE`
2. **Referral code captured** → Stored in localStorage and cookies
3. **User goes through verification** → Referral code persists in cookies
4. **User completes signup** → API automatically finds referral code in cookies
5. **Referral tracked** → Appears in referrals table with all data

## Cookie/Session Storage

The system automatically stores referral codes in:
- **localStorage** - For immediate access
- **Cookies** - For persistence across page loads and redirects
- **30-day expiration** - Codes expire after 30 days

## Integration Methods

### Method 1: Direct API Call

When a user completes a signup or purchase, call the tracking API:

```javascript
// Track a signup
const response = await fetch('https://your-domain.com/api/track-referral', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    referralCode: 'TYLERMADDREN604',
    customerEmail: 'customer@example.com',
    customerName: 'John Doe',
    action: 'signup',
    listingsCount: 1 // Optional: number of listings created
  })
});

// Track a purchase
const response = await fetch('https://your-domain.com/api/track-referral', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    referralCode: 'TYLERMADDREN604',
    customerEmail: 'customer@example.com',
    customerName: 'John Doe',
    action: 'purchase',
    amount: 150.00 // Purchase amount for commission calculation
  })
});
```

### Method 2: Webhook Integration

For more secure integration, use the webhook endpoint:

```javascript
const response = await fetch('https://your-domain.com/api/webhook/referral', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    referralCode: 'TYLERMADDREN604',
    customerEmail: 'customer@example.com',
    customerName: 'John Doe',
    action: 'signup',
    listingsCount: 1,
    webhookSecret: 'your-webhook-secret' // Set in environment variables
  })
});
```

## Implementation Examples

### Method 1: Using the Referral Tracker Utility (Recommended)

Include the referral tracker script in your HTML:

```html
<script src="https://your-domain.com/referral-tracking.js"></script>
```

Then use it in your forms:

```javascript
// In your signup form submission handler
function handleSignupFormSubmission(formData) {
  // The referral tracker automatically handles referral codes from URL/cookies
  window.referralTracker.trackSignup(
    formData.email,
    formData.name,
    1 // listingsCount
  ).then(result => {
    if (result.success) {
      console.log('Signup tracked successfully');
    }
  });
}

// In your purchase completion handler
function handlePurchaseCompletion(purchaseData) {
  window.referralTracker.trackPurchase(
    purchaseData.customerEmail,
    purchaseData.customerName,
    purchaseData.totalAmount
  ).then(result => {
    if (result.success) {
      console.log('Purchase tracked successfully');
    }
  });
}
```

### Method 2: Manual Integration

#### ShareTribe Marketplace Integration

Add this to your ShareTribe marketplace to track purchases:

```javascript
// In your purchase completion handler
function handlePurchaseCompletion(purchaseData) {
  // The API will automatically check cookies for referral codes
  fetch('https://your-domain.com/api/track-referral', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customerEmail: purchaseData.customerEmail,
      customerName: purchaseData.customerName,
      action: 'purchase',
      amount: purchaseData.totalAmount
      // No need to pass referralCode - it will be found in cookies
    })
  });
}
```

#### Signup Form Integration

Add this to your signup form to track signups:

```javascript
// In your signup form submission handler
function handleSignupFormSubmission(formData) {
  // The API will automatically check cookies for referral codes
  fetch('https://your-domain.com/api/track-referral', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customerEmail: formData.email,
      customerName: formData.name,
      action: 'signup',
      listingsCount: 0 // Update based on your signup flow
      // No need to pass referralCode - it will be found in cookies
    })
  });
}
```

## Environment Variables

Set these environment variables for webhook security:

```bash
REFERRAL_WEBHOOK_SECRET=your-secure-webhook-secret
```

## Response Format

Successful tracking returns:

```json
{
  "success": true,
  "referral": {
    "id": "uuid",
    "affiliate_name": "Tyler Maddren",
    "customer_name": "John Doe",
    "action": "signup",
    "commission_earned": 10.00,
    "status": "approved"
  }
}
```

## Error Handling

Common error responses:

- `400` - Missing required fields
- `401` - Unauthorized (webhook secret mismatch)
- `404` - Invalid referral code
- `409` - Customer already tracked
- `500` - Server error

## Commission Calculation

- **Percentage-based**: `commission = (amount * percentage) / 100`
- **Fixed amount**: `commission = fixed_amount`

## Status Values

- `pending` - Requires manual approval (typically purchases)
- `approved` - Automatically approved (typically signups)
- `rejected` - Manually rejected

## Testing

Test your integration with sample data:

```javascript
// Test signup tracking
const testSignup = {
  referralCode: 'TEST123',
  customerEmail: 'test@example.com',
  customerName: 'Test User',
  action: 'signup',
  listingsCount: 1
};

// Test purchase tracking
const testPurchase = {
  referralCode: 'TEST123',
  customerEmail: 'test@example.com',
  customerName: 'Test User',
  action: 'purchase',
  amount: 100.00
};
```

## Security Considerations

1. **Webhook Secret** - Always use the webhook endpoint with a secret for production
2. **Input Validation** - Validate all input data on your end
3. **Rate Limiting** - Implement rate limiting to prevent abuse
4. **HTTPS** - Always use HTTPS for API calls
5. **Error Logging** - Log errors for debugging and monitoring

## Support

For integration support, check the referral tracking logs in your application dashboard or contact your development team. 