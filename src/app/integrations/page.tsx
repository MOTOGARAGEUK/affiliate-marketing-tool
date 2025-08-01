'use client';

import { useState } from 'react';
import { PlusIcon, CogIcon, CheckCircleIcon, XCircleIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

export default function Integrations() {
  const copyTrackingScript = () => {
    const scriptText = `<!-- Affiliate Referral Tracking Script for ShareTribe -->
<script>
(function() {
  // Get referral parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');
  
  // Check if this is an affiliate referral
  if (utmSource === 'affiliate' && utmMedium === 'referral' && utmCampaign) {
    // Store referral data in localStorage
    localStorage.setItem('affiliate_referral', JSON.stringify({
      source: utmSource,
      medium: utmMedium,
      campaign: utmCampaign,
      timestamp: new Date().toISOString(),
      page: window.location.href
    }));
    
    // Send referral data to your tracking endpoint
    fetch('https://affiliate-marketing-tool-jt268n7ck-scoopies-projects.vercel.app/api/track-referral', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: utmSource,
        medium: utmMedium,
        campaign: utmCampaign,
        page: window.location.href,
        userAgent: navigator.userAgent
      })
    }).catch(error => {
      console.log('Referral tracking error:', error);
    });
    
    console.log('Affiliate referral detected:', utmCampaign);
  }
})();
</script>`;
    
    navigator.clipboard.writeText(scriptText).then(() => {
      alert('ShareTribe tracking script copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy script. Please select and copy manually.');
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Connect your affiliate marketing tool with external platforms
          </p>
        </div>
        <button
          onClick={() => alert('Connect Platform functionality coming soon')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Connect Platform
        </button>
      </div>

      {/* SHARETRIBE TRACKING SCRIPT SECTION - ALWAYS VISIBLE */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-blue-900 mb-2">🚀 ShareTribe Referral Tracking</h2>
            <p className="text-blue-700">
              Copy this tracking script and add it to your ShareTribe signup page to enable affiliate referral tracking.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">📋 How to Add to ShareTribe:</h3>
          <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
            <li>Go to your <strong>ShareTribe admin panel</strong></li>
            <li>Navigate to <strong>Design → Theme editor</strong></li>
            <li>Find your <strong>signup page template</strong></li>
            <li>Locate the <strong>&lt;head&gt; section</strong></li>
            <li><strong>Paste the script below</strong> just before the closing &lt;/head&gt; tag</li>
            <li><strong>Save and publish</strong> your changes</li>
          </ol>
        </div>

        {/* Tracking Script */}
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-300">Tracking Script:</span>
            <button
              onClick={copyTrackingScript}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              <DocumentDuplicateIcon className="h-3 w-3 mr-1" />
              Copy Script
            </button>
          </div>
          <pre className="text-xs text-green-400 overflow-x-auto whitespace-pre-wrap">
{`<!-- Affiliate Referral Tracking Script for ShareTribe -->
<script>
(function() {
  // Get referral parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');
  
  // Check if this is an affiliate referral
  if (utmSource === 'affiliate' && utmMedium === 'referral' && utmCampaign) {
    // Store referral data in localStorage
    localStorage.setItem('affiliate_referral', JSON.stringify({
      source: utmSource,
      medium: utmMedium,
      campaign: utmCampaign,
      timestamp: new Date().toISOString(),
      page: window.location.href
    }));
    
    // Send referral data to your tracking endpoint
    fetch('https://affiliate-marketing-tool-jt268n7ck-scoopies-projects.vercel.app/api/track-referral', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: utmSource,
        medium: utmMedium,
        campaign: utmCampaign,
        page: window.location.href,
        userAgent: navigator.userAgent
      })
    }).catch(error => {
      console.log('Referral tracking error:', error);
    });
    
    console.log('Affiliate referral detected:', utmCampaign);
  }
})();
</script>`}
          </pre>
        </div>

        {/* Testing Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-yellow-900 mb-2">🧪 Test Your Integration:</h3>
          <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
            <li>Visit an affiliate link (e.g., <code className="bg-yellow-100 px-1 rounded">yoursite.com/signup?utm_source=affiliate&utm_medium=referral&utm_campaign=TEST123</code>)</li>
            <li>Check browser console for "Affiliate referral detected" message</li>
            <li>Verify data appears in your affiliate dashboard</li>
          </ol>
        </div>
      </div>

      {/* Available Integrations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Available Integrations</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: 'Sharetribe', type: 'sharetribe', description: 'Connect with Sharetribe marketplace' },
            { name: 'Shopify', type: 'shopify', description: 'Integrate with Shopify stores' },
            { name: 'WooCommerce', type: 'woocommerce', description: 'Connect with WooCommerce sites' },
          ].map((integration) => (
            <div key={integration.type} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{integration.name}</h4>
              <p className="text-sm text-gray-500 mt-1">{integration.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
