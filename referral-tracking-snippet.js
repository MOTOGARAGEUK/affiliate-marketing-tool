// Add this to your signup page to test referral tracking

// Function to get referral code from cookies
function getReferralCodeFromCookies() {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});
  
  return cookies.referralCode;
}

// Function to test referral tracking
async function testReferralTracking() {
  const referralCode = getReferralCodeFromCookies();
  
  console.log('=== REFERRAL TRACKING TEST ===');
  console.log('Referral code from cookies:', referralCode);
  
  if (!referralCode) {
    console.log('❌ No referral code found in cookies');
    return;
  }
  
  // Test the tracking API
  try {
    const response = await fetch('https://your-domain.com/api/track-referral', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerEmail: 'test@example.com',
        customerName: 'Test User',
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
    console.error('❌ Error testing referral tracking:', error);
  }
}

// Function to clear referral code (for testing)
function clearReferralCode() {
  document.cookie = 'referralCode=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  localStorage.removeItem('referralCode');
  console.log('Referral code cleared');
}

// Add these to your signup form submission
function handleSignupFormSubmission(formData) {
  console.log('Signup form submitted:', formData);
  
  // Track the referral
  fetch('https://your-domain.com/api/track-referral', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customerEmail: formData.email,
      customerName: formData.name,
      action: 'signup',
      listingsCount: 1
    })
  }).then(response => response.json())
    .then(result => {
      if (result.success) {
        console.log('✅ Referral tracked successfully!');
        // Clear the referral code after successful tracking
        clearReferralCode();
      } else {
        console.log('❌ Failed to track referral:', result.message);
      }
    })
    .catch(error => {
      console.error('❌ Error tracking referral:', error);
    });
}

// Test functions - call these in browser console
window.testReferralTracking = testReferralTracking;
window.clearReferralCode = clearReferralCode;
window.getReferralCodeFromCookies = getReferralCodeFromCookies;

console.log('Referral tracking functions loaded. Use:');
console.log('- testReferralTracking() - Test referral tracking');
console.log('- clearReferralCode() - Clear referral code');
console.log('- getReferralCodeFromCookies() - Get referral code from cookies'); 