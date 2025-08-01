/**
 * Sharetribe Referral Tracking Script
 * 
 * This script captures referral codes from URL parameters and sends them to your affiliate tracking API
 * when users complete signup on your Sharetribe marketplace.
 * 
 * Installation:
 * 1. Go to your Sharetribe admin panel
 * 2. Navigate to Settings → Advanced → Custom code → Head
 * 3. Paste this entire script
 * 4. Update the API_URL below with your actual domain
 * 5. Save the settings
 */

(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    // API URL - Update this with your actual domain
    // Option 1: Use your custom domain (recommended)
    API_URL: 'https://your-affiliate-domain.com/api/track-referral',
    
    // Option 2: Use Vercel preview URL (if you have a custom domain set up)
    // API_URL: 'https://your-project-name.vercel.app/api/track-referral',
    
    // Option 3: Use localhost for testing
    // API_URL: 'http://localhost:3000/api/track-referral',
    
    REFERRAL_PARAMS: ['ref', 'referral', 'affiliate', 'code'],
    COOKIE_NAME: 'affiliate_referral_code',
    COOKIE_EXPIRY_DAYS: 30,
    DEBUG: false // Set to true for console logging
  };
  
  // Auto-detect API URL if not set
  if (CONFIG.API_URL === 'https://your-affiliate-domain.com/api/track-referral') {
    // Try to detect the correct URL
    const currentHost = window.location.hostname;
    
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      CONFIG.API_URL = 'http://localhost:3000/api/track-referral';
    } else if (currentHost.includes('vercel.app')) {
      // If this script is running on a Vercel domain, use the same domain for API
      CONFIG.API_URL = `https://${currentHost}/api/track-referral`;
    } else {
      // Use the current domain as fallback
      CONFIG.API_URL = `https://${currentHost}/api/track-referral`;
    }
    
    console.warn('[Affiliate Tracking] API_URL not configured, using auto-detected URL:', CONFIG.API_URL);
    console.warn('[Affiliate Tracking] Please update the API_URL in the script configuration for production use.');
  }
  
  // Debug logging
  function log(message, data = null) {
    if (CONFIG.DEBUG) {
      console.log('[Affiliate Tracking]', message, data || '');
    }
  }
  
  // Cookie utilities
  const CookieUtils = {
    set: function(name, value, days) {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    },
    
    get: function(name) {
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    },
    
    remove: function(name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }
  };
  
  // URL parameter utilities
  const URLUtils = {
    getParameter: function(name) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(name);
    },
    
    getAllParameters: function() {
      const urlParams = new URLSearchParams(window.location.search);
      const params = {};
      for (const [key, value] of urlParams) {
        params[key] = value;
      }
      return params;
    },
    
    removeParameter: function(name) {
      const url = new URL(window.location.href);
      url.searchParams.delete(name);
      window.history.replaceState({}, document.title, url.toString());
    }
  };
  
  // Referral tracking class
  class ReferralTracker {
    constructor() {
      this.referralCode = null;
      this.isTracking = false;
      this.init();
    }
    
    init() {
      log('Initializing referral tracker');
      
      // Try to get referral code from various sources
      this.referralCode = this.getReferralCode();
      
      if (this.referralCode) {
        log('Found referral code:', this.referralCode);
        this.storeReferralCode(this.referralCode);
        this.setupFormTracking();
        this.setupPageTracking();
      } else {
        log('No referral code found');
      }
    }
    
    getReferralCode() {
      // 1. Check URL parameters first
      for (const param of CONFIG.REFERRAL_PARAMS) {
        const code = URLUtils.getParameter(param);
        if (code) {
          log(`Found referral code in URL parameter '${param}':`, code);
          return code;
        }
      }
      
      // 2. Check localStorage
      const storedCode = localStorage.getItem('affiliate_referral_code');
      if (storedCode) {
        log('Found referral code in localStorage:', storedCode);
        return storedCode;
      }
      
      // 3. Check cookies
      const cookieCode = CookieUtils.get(CONFIG.COOKIE_NAME);
      if (cookieCode) {
        log('Found referral code in cookies:', cookieCode);
        return cookieCode;
      }
      
      return null;
    }
    
    storeReferralCode(code) {
      // Store in multiple places for persistence
      localStorage.setItem('affiliate_referral_code', code);
      CookieUtils.set(CONFIG.COOKIE_NAME, code, CONFIG.COOKIE_EXPIRY_DAYS);
      
      // Remove from URL to clean it up
      for (const param of CONFIG.REFERRAL_PARAMS) {
        URLUtils.removeParameter(param);
      }
      
      log('Stored referral code:', code);
    }
    
    setupFormTracking() {
      // Track form submissions
      document.addEventListener('submit', (e) => {
        this.handleFormSubmit(e);
      });
      
      // Track signup button clicks
      document.addEventListener('click', (e) => {
        if (this.isSignupButton(e.target)) {
          this.handleSignupClick(e);
        }
      });
      
      log('Form tracking setup complete');
    }
    
    setupPageTracking() {
      // Track page views with referral code
      if (this.referralCode) {
        this.trackPageView();
      }
      
      // Track successful signup completion
      this.trackSignupCompletion();
      
      log('Page tracking setup complete');
    }
    
    isSignupButton(element) {
      // Check if element is a signup button
      const text = element.textContent?.toLowerCase() || '';
      const classes = element.className?.toLowerCase() || '';
      const id = element.id?.toLowerCase() || '';
      
      const signupKeywords = ['sign up', 'signup', 'register', 'join', 'create account'];
      
      return signupKeywords.some(keyword => 
        text.includes(keyword) || 
        classes.includes(keyword) || 
        id.includes(keyword)
      );
    }
    
    handleFormSubmit(e) {
      if (this.isTracking) return;
      
      const form = e.target;
      if (this.isSignupForm(form)) {
        log('Signup form submitted');
        this.trackFormSubmission(form);
      }
    }
    
    handleSignupClick(e) {
      if (this.isTracking) return;
      
      log('Signup button clicked');
      this.trackSignupClick();
    }
    
    isSignupForm(form) {
      // Check if this is a signup/registration form
      const action = form.action?.toLowerCase() || '';
      const classes = form.className?.toLowerCase() || '';
      const id = form.id?.toLowerCase() || '';
      
      const signupKeywords = ['signup', 'register', 'join', 'create', 'account'];
      
      return signupKeywords.some(keyword => 
        action.includes(keyword) || 
        classes.includes(keyword) || 
        id.includes(keyword)
      );
    }
    
    trackPageView() {
      if (!this.referralCode) return;
      
      this.sendTrackingData({
        action: 'page_view',
        referralCode: this.referralCode,
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    }
    
    trackFormSubmission(form) {
      if (!this.referralCode) return;
      
      this.isTracking = true;
      
      // Get form data
      const formData = new FormData(form);
      const email = formData.get('email') || this.extractEmailFromForm(form);
      
      this.sendTrackingData({
        action: 'form_submit',
        referralCode: this.referralCode,
        email: email,
        timestamp: new Date().toISOString()
      });
    }
    
    trackSignupClick() {
      if (!this.referralCode) return;
      
      this.sendTrackingData({
        action: 'signup_click',
        referralCode: this.referralCode,
        timestamp: new Date().toISOString()
      });
    }
    
    trackSignupCompletion() {
      // Check for successful signup indicators
      const successIndicators = [
        'welcome',
        'dashboard',
        'profile',
        'account',
        'success'
      ];
      
      const currentPath = window.location.pathname.toLowerCase();
      const isSuccessPage = successIndicators.some(indicator => 
        currentPath.includes(indicator)
      );
      
      if (isSuccessPage && this.referralCode) {
        log('Detected signup completion');
        
        // Try to get user info from the page
        const userInfo = this.extractUserInfo();
        
        // Send tracking data to our API
        this.sendTrackingData({
          action: 'signup_complete',
          referralCode: this.referralCode,
          userInfo: userInfo,
          timestamp: new Date().toISOString()
        });
        
        // Also update Sharetribe user metadata
        this.updateSharetribeUserMetadata();
        
        // Clear stored referral code after successful tracking
        this.clearReferralCode();
      }
    }
    
    updateSharetribeUserMetadata() {
      if (!this.referralCode) return;
      
      log('Updating Sharetribe user metadata with referral code:', this.referralCode);
      
      // Try to find the current user's profile or settings page
      // This will depend on Sharetribe's specific implementation
      
      // Method 1: Try to update via Sharetribe's API if available
      this.updateViaAPI();
      
      // Method 2: Try to update via form submission if API not available
      this.updateViaForm();
      
      // Method 3: Store in localStorage for later processing
      this.storeForLaterUpdate();
    }
    
    updateViaAPI() {
      // This would require Sharetribe's client-side API
      // For now, we'll log what we would do
      log('Would update user metadata via API with referralCode:', this.referralCode);
      
      // Example of what this might look like:
      /*
      if (window.sharetribe && window.sharetribe.api) {
        window.sharetribe.api.updateUser({
          publicData: {
            referralCode: this.referralCode
          }
        });
      }
      */
    }
    
    updateViaForm() {
      // Look for profile update forms and inject the referral code
      const profileForms = document.querySelectorAll('form[action*="profile"], form[action*="account"], form[action*="settings"]');
      
      profileForms.forEach(form => {
        // Check if form already has referral code field
        let referralField = form.querySelector('input[name="referralCode"], input[name="referral_code"]');
        
        if (!referralField) {
          // Create hidden input for referral code
          referralField = document.createElement('input');
          referralField.type = 'hidden';
          referralField.name = 'referralCode';
          referralField.value = this.referralCode;
          form.appendChild(referralField);
          log('Added referral code field to profile form');
        } else {
          referralField.value = this.referralCode;
          log('Updated existing referral code field in profile form');
        }
      });
    }
    
    storeForLaterUpdate() {
      // Store referral code for later processing
      // This could be picked up by other scripts or processes
      localStorage.setItem('pending_referral_metadata', this.referralCode);
      log('Stored referral code for later metadata update:', this.referralCode);
      
      // Also try to trigger a custom event that other scripts can listen for
      const event = new CustomEvent('referralCodeCaptured', {
        detail: {
          referralCode: this.referralCode,
          timestamp: new Date().toISOString()
        }
      });
      document.dispatchEvent(event);
      log('Dispatched referralCodeCaptured event');
    }
    
    extractEmailFromForm(form) {
      // Try to find email field in form
      const emailField = form.querySelector('input[type="email"], input[name*="email"], input[id*="email"]');
      return emailField ? emailField.value : null;
    }
    
    extractUserInfo() {
      // Try to extract user information from the page
      const userInfo = {};
      
      // Look for common user info elements
      const nameElements = document.querySelectorAll('[data-user-name], .user-name, .profile-name');
      if (nameElements.length > 0) {
        userInfo.name = nameElements[0].textContent?.trim();
      }
      
      const emailElements = document.querySelectorAll('[data-user-email], .user-email, .profile-email');
      if (emailElements.length > 0) {
        userInfo.email = emailElements[0].textContent?.trim();
      }
      
      return userInfo;
    }
    
    sendTrackingData(data) {
      log('Sending tracking data:', data);
      
      fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (response.ok) {
          log('Tracking data sent successfully');
          return response.json();
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      })
      .then(result => {
        log('Tracking response:', result);
      })
      .catch(error => {
        log('Error sending tracking data:', error);
      });
    }
    
    clearReferralCode() {
      localStorage.removeItem('affiliate_referral_code');
      CookieUtils.remove(CONFIG.COOKIE_NAME);
      this.referralCode = null;
      log('Referral code cleared');
    }
  }
  
  // Initialize tracking when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new ReferralTracker();
    });
  } else {
    new ReferralTracker();
  }
  
  // Also track on page changes (for SPAs)
  let currentUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      log('Page changed, reinitializing tracker');
      setTimeout(() => {
        new ReferralTracker();
      }, 100);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
})(); 