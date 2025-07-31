// Referral tracking utility for client-side integration

class ReferralTracker {
  constructor() {
    this.referralCode = null;
    this.init();
  }

  init() {
    // Try to get referral code from localStorage first
    this.referralCode = localStorage.getItem('referralCode');
    
    // If not in localStorage, try to get from URL
    if (!this.referralCode) {
      const urlParams = new URLSearchParams(window.location.search);
      this.referralCode = urlParams.get('ref');
      
      if (this.referralCode) {
        // Store in localStorage for future use
        localStorage.setItem('referralCode', this.referralCode);
        
        // Also set cookie
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);
        document.cookie = `referralCode=${this.referralCode}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
      }
    }
  }

  getReferralCode() {
    return this.referralCode;
  }

  clearReferralCode() {
    this.referralCode = null;
    localStorage.removeItem('referralCode');
    
    // Remove cookie
    document.cookie = 'referralCode=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }

  async trackSignup(customerEmail, customerName, listingsCount = 0) {
    return this.trackReferral({
      customerEmail,
      customerName,
      action: 'signup',
      listingsCount
    });
  }

  async trackPurchase(customerEmail, customerName, amount) {
    return this.trackReferral({
      customerEmail,
      customerName,
      action: 'purchase',
      amount
    });
  }

  async trackReferral(data) {
    try {
      const response = await fetch('/api/track-referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          referralCode: this.referralCode,
          ...data
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Referral tracked successfully:', result);
        // Clear referral code after successful tracking
        this.clearReferralCode();
        return result;
      } else {
        console.error('Failed to track referral:', result.message);
        return result;
      }
    } catch (error) {
      console.error('Error tracking referral:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create global instance
window.referralTracker = new ReferralTracker();

// Export for module usage
export default ReferralTracker; 