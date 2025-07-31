// Simple Referral Tracking - Add this to your signup page

// Function to get UTM parameters from URL
function getUTMParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_source: urlParams.get('utm_source'),
    utm_medium: urlParams.get('utm_medium'),
    utm_campaign: urlParams.get('utm_campaign')
  };
}

// Function to track referral signup
async function trackReferralSignup(userEmail, userName) {
  const utmParams = getUTMParameters();
  
  console.log('=== REFERRAL TRACKING DEBUG ===');
  console.log('UTM Parameters:', utmParams);
  console.log('User Email:', userEmail);
  console.log('User Name:', userName);
  
  // Only track if this is an affiliate referral
  if (utmParams.utm_source !== 'affiliate' || !utmParams.utm_campaign) {
    console.log('Not an affiliate referral');
    return;
  }
  
  try {
    const response = await fetch('https://your-domain.com/api/track-referral', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        referralCode: utmParams.utm_campaign,
        customerEmail: userEmail,
        customerName: userName,
        action: 'signup',
        listingsCount: 1
      })
    });
    
    const result = await response.json();
    console.log('Tracking result:', result);
    
    if (result.success) {
      console.log('✅ Referral tracked successfully!');
    } else {
      console.log('❌ Failed to track referral:', result.message);
    }
  } catch (error) {
    console.error('❌ Error tracking referral:', error);
  }
}

// Function to track referral purchase
async function trackReferralPurchase(transactionId, value, currency = 'GBP') {
  const utmParams = getUTMParameters();
  
  console.log('=== REFERRAL PURCHASE TRACKING ===');
  console.log('UTM Parameters:', utmParams);
  console.log('Transaction ID:', transactionId);
  console.log('Value:', value);
  
  // Only track if this is an affiliate referral
  if (utmParams.utm_source !== 'affiliate' || !utmParams.utm_campaign) {
    console.log('Not an affiliate referral');
    return;
  }
  
  try {
    const response = await fetch('https://your-domain.com/api/track-referral', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        referralCode: utmParams.utm_campaign,
        action: 'purchase',
        amount: value,
        transactionId: transactionId,
        currency: currency
      })
    });
    
    const result = await response.json();
    console.log('Purchase tracking result:', result);
    
    if (result.success) {
      console.log('✅ Purchase referral tracked successfully!');
    } else {
      console.log('❌ Failed to track purchase referral:', result.message);
    }
  } catch (error) {
    console.error('❌ Error tracking purchase referral:', error);
  }
}

// Add to your signup form submission
function handleSignupFormSubmission(formData) {
  console.log('Signup form submitted:', formData);
  
  // Your existing signup logic here...
  
  // Track the referral
  trackReferralSignup(formData.email, formData.name);
}

// Add to your purchase confirmation page
function handlePurchaseConfirmation(transactionId, value, currency) {
  console.log('Purchase confirmed:', { transactionId, value, currency });
  
  // Track the referral purchase
  trackReferralPurchase(transactionId, value, currency);
}

// Test functions - call these in browser console
window.trackReferralSignup = trackReferralSignup;
window.trackReferralPurchase = trackReferralPurchase;
window.getUTMParameters = getUTMParameters;

console.log('Referral tracking functions loaded. Use:');
console.log('- trackReferralSignup(email, name) - Track signup');
console.log('- trackReferralPurchase(transactionId, value) - Track purchase');
console.log('- getUTMParameters() - Get UTM parameters'); 