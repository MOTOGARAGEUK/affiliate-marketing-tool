# Google Analytics Setup for Referral Tracking

## 1. Set up Google Analytics 4 (GA4)

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new property for your marketplace
3. Get your Measurement ID (G-XXXXXXXXXX)

## 2. Add Google Analytics to your marketplace

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

## 3. Enhanced Ecommerce Tracking

Add this to track purchases and signups:

```html
<script>
// Track signup event
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

// Track purchase event
function trackPurchase(transactionId, value, currency) {
  gtag('event', 'purchase', {
    'transaction_id': transactionId,
    'value': value,
    'currency': currency
  });
}
</script>
```

## 4. UTM Parameter Tracking

Your referral links will automatically include UTM parameters:

```
https://test.moto-garage.co.uk/signup?utm_source=affiliate&utm_medium=referral&utm_campaign=TYLERMADDREN604
```

Google Analytics will automatically track these parameters and associate them with events. 