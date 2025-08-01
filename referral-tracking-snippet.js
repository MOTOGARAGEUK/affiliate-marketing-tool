/**
 * Affiliate Referral Tracking Script
 * 
 * Add this script to the <head> section of your signup page to automatically 
 * capture referral data from affiliate links.
 * 
 * This script will:
 * 1. Detect affiliate referrals from UTM parameters
 * 2. Store referral data in localStorage
 * 3. Send referral data to your tracking endpoint
 * 4. Log referral detection for debugging
 */

(function() {
  'use strict';
  
  // Get referral parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');
  
  // Check if this is an affiliate referral
  if (utmSource === 'affiliate' && utmMedium === 'referral' && utmCampaign) {
    
    // Create referral data object
    const referralData = {
      source: utmSource,
      medium: utmMedium,
      campaign: utmCampaign,
      timestamp: new Date().toISOString(),
      page: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent
    };
    
    // Store referral data in localStorage
    try {
      localStorage.setItem('affiliate_referral', JSON.stringify(referralData));
      console.log('Affiliate referral data stored in localStorage');
    } catch (error) {
      console.warn('Could not store referral data in localStorage:', error);
    }
    
    // Send referral data to tracking endpoint
    fetch('/api/track-referral', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(referralData)
    })
    .then(response => {
      if (response.ok) {
        console.log('Affiliate referral tracked successfully');
      } else {
        console.warn('Failed to track referral:', response.status);
      }
    })
    .catch(error => {
      console.log('Referral tracking error:', error);
    });
    
    // Log referral detection for debugging
    console.log('Affiliate referral detected:', {
      campaign: utmCampaign,
      source: utmSource,
      medium: utmMedium
    });
    
    // Optional: Set a cookie for server-side tracking
    try {
      document.cookie = `affiliate_referral=${utmCampaign}; path=/; max-age=86400`; // 24 hours
    } catch (error) {
      console.warn('Could not set affiliate referral cookie:', error);
    }
  }
})(); 