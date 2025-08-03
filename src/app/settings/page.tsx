'use client';

import { useState, useEffect } from 'react';
import { CogIcon, UserIcon, BellIcon, ShieldCheckIcon, LinkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [allSettings, setAllSettings] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'integrations', name: 'Integrations', icon: LinkIcon },
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  ];

  // Load all settings once for the entire page
  useEffect(() => {
    const loadAllSettings = async () => {
      try {
        console.log('Loading all settings...');
        
        // Get the current session
        const { data: { session } } = await supabase().auth.getSession();
        console.log('Session found:', !!session);
        
        const headers: Record<string, string> = {};
        
        // Add authorization header if user is authenticated
        if (session?.access_token) {
          headers['authorization'] = `Bearer ${session.access_token}`;
          console.log('Added auth header');
        } else {
          console.log('No auth header - user not authenticated');
        }
        
        console.log('Making request to /api/settings');
        const response = await fetch('/api/settings', { headers });
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          console.error('Settings API error:', response.status, response.statusText);
          return;
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
          setAllSettings(data.settings);
          
          // If referral links were updated, trigger a refresh
          if (data.referralLinksUpdated) {
            console.log('Referral links updated, triggering refresh...');
            // Trigger a custom event to refresh affiliate data
            window.dispatchEvent(new CustomEvent('referral-links-updated'));
            // Also set a storage event for cross-tab communication
            localStorage.setItem('settings-updated', Date.now().toString());
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setSettingsLoading(false);
      }
    };
    
    loadAllSettings();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="bg-white shadow rounded-lg settings-card">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 inline mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {settingsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading settings...</p>
            </div>
          ) : (
            <>
              {activeTab === 'general' && <GeneralSettings settings={allSettings?.general} onSettingsUpdate={setAllSettings} />}
              {activeTab === 'integrations' && <IntegrationSettings settings={allSettings?.sharetribe} onSettingsUpdate={setAllSettings} />}
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'notifications' && <NotificationSettings />}
              {activeTab === 'security' && <SecuritySettings />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface GeneralSettingsProps {
  settings?: any;
  onSettingsUpdate?: (settings: any) => void;
}

function GeneralSettings({ settings: initialSettings, onSettingsUpdate }: GeneralSettingsProps) {
  const [settings, setSettings] = useState({
    companyName: 'My Affiliate Program',
    defaultCommission: 10,
    currency: 'USD',
    timezone: 'UTC',
    autoApproveReferrals: true,
    minimumPayout: 50,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  // Update settings when props change
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveResult(null);

    try {
      // Get the current session
      const { data: { session } } = await supabase().auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if user is authenticated
      if (session?.access_token) {
        headers['authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'general',
          settings: settings
        }),
      });
      
      const result = await response.json();
      setSaveResult(result);
      
      // Update local state with the returned settings if save was successful
      if (result.success && result.settings?.general) {
        setSettings(result.settings.general);
        // Update parent state if callback is provided
        if (onSettingsUpdate) {
          onSettingsUpdate(result.settings);
        }
      }
    } catch (error) {
      setSaveResult({
        success: false,
        message: 'Failed to save settings. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company Name</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              className="mt-1 block w-full form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Default Commission (%)</label>
            <input
              type="number"
              value={settings.defaultCommission}
              onChange={(e) => setSettings({ ...settings, defaultCommission: parseFloat(e.target.value) })}
              className="mt-1 block w-full form-input"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="mt-1 block w-full form-select"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="mt-1 block w-full form-select"
            >
              <option value="UTC">UTC</option>
              <option value="EST">EST</option>
              <option value="PST">PST</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Minimum Payout Amount</label>
            <input
              type="number"
              value={settings.minimumPayout}
              onChange={(e) => setSettings({ ...settings, minimumPayout: parseFloat(e.target.value) })}
              className="mt-1 block w-full form-input"
              min="0"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.autoApproveReferrals}
              onChange={(e) => setSettings({ ...settings, autoApproveReferrals: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Auto-approve referrals
            </label>
          </div>
        </div>
      </div>
      
      {saveResult && (
        <div className={`text-sm ${saveResult.success ? 'text-green-600' : 'text-red-600'}`}>
          {saveResult.message}
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}

interface IntegrationSettingsProps {
  settings?: any;
  onSettingsUpdate?: (settings: any) => void;
}

function IntegrationSettings({ settings: initialSettings, onSettingsUpdate }: IntegrationSettingsProps) {
  const [sharetribeConfig, setSharetribeConfig] = useState({
    marketplaceClientId: '',
    marketplaceClientSecret: '',
    integrationClientId: '',
    integrationClientSecret: '',
    marketplaceUrl: '',
  });
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingReferralFlow, setIsTestingReferralFlow] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [referralFlowResult, setReferralFlowResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);


  // Update settings when props change
  useEffect(() => {
    if (initialSettings) {
      console.log('Loading initial settings:', initialSettings);
      console.log('Initial settings keys:', Object.keys(initialSettings));
      setSharetribeConfig(initialSettings);
    }
  }, [initialSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveResult(null);
    
    try {
      // Get the current session
      const { data: { session } } = await supabase().auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if user is authenticated
      if (session?.access_token) {
        headers['authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'sharetribe',
          settings: sharetribeConfig
        }),
      });
      
      const result = await response.json();
      setSaveResult(result);
      
      // Update local state with the returned settings if save was successful
      if (result.success && result.settings?.sharetribe) {
        setSharetribeConfig(result.settings.sharetribe);
        // Update parent state if callback is provided
        if (onSettingsUpdate) {
          onSettingsUpdate(result.settings);
        }
      }
      
      if (result.success) {
        // Clear any previous test results when saving new settings
        setTestResult(null);
        setSyncResult(null);
      }
    } catch (error) {
      setSaveResult({
        success: false,
        message: 'Failed to save settings. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const finalTest = async () => {
    console.log('Final test button clicked!');
    console.log('Config:', sharetribeConfig);
    console.log('Config keys:', Object.keys(sharetribeConfig));
    console.log('Config values:', {
      marketplaceClientId: sharetribeConfig.marketplaceClientId ? 'SET' : 'NOT SET',
      marketplaceClientSecret: sharetribeConfig.marketplaceClientSecret ? 'SET' : 'NOT SET',
      integrationClientId: sharetribeConfig.integrationClientId ? 'SET' : 'NOT SET',
      integrationClientSecret: sharetribeConfig.integrationClientSecret ? 'SET' : 'NOT SET',
    });
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/simple-sharetribe-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sharetribeConfig),
      });
      
      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('API Response:', result);
      setTestResult(result);
    } catch (error) {
      console.error('Final test error:', error);
      setTestResult({
        success: false,
        message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const testReferralFlow = async () => {
    setIsTestingReferralFlow(true);
    setReferralFlowResult(null);
    
    try {
      const response = await fetch('/api/test-referral-flow', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Referral flow test response status:', response.status);
      
      const result = await response.json();
      console.log('Referral flow test result:', result);
      setReferralFlowResult(result);
    } catch (error) {
      console.error('Referral flow test error:', error);
      setReferralFlowResult({
        success: false,
        message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsTestingReferralFlow(false);
    }
  };

  const syncUsers = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      const response = await fetch('/api/sync-sharetribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...sharetribeConfig,
          hours: 24, // Sync last 24 hours
        }),
      });
      
      const result = await response.json();
      setSyncResult(result);
    } catch (error) {
      setSyncResult({
        success: false,
        message: 'Failed to sync users. Please check your settings.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sharetribe Integration</h3>
        <p className="text-sm text-gray-600 mb-6">
          Connect your Sharetribe marketplace to automatically track affiliate signups and purchases.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-md mb-6">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Marketplace API Credentials</h4>
            <p className="text-sm text-blue-800 mb-4">
              Used for accessing marketplace data (users, transactions, listings)
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Marketplace Client ID</label>
                <input
                  type="text"
                  value={sharetribeConfig.marketplaceClientId}
                  onChange={(e) => setSharetribeConfig({ ...sharetribeConfig, marketplaceClientId: e.target.value })}
                  className="mt-1 block w-full form-input"
                  placeholder="e.g., 2af9ca56-b055-4568-96e8-bf356a5085e1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Found in Sharetribe Admin → Advanced → Applications → Marketplace API
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Marketplace Client Secret</label>
                <input
                  type="password"
                  value={sharetribeConfig.marketplaceClientSecret}
                  onChange={(e) => setSharetribeConfig({ ...sharetribeConfig, marketplaceClientSecret: e.target.value })}
                  className="mt-1 block w-full form-input"
                  placeholder="e.g., 5bafb1946783560ae9d93760550194467fcbf61e"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Generated when you create a Marketplace API application
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-md mb-6">
            <h4 className="text-sm font-medium text-green-900 mb-2">Integration API Credentials</h4>
            <p className="text-sm text-green-800 mb-4">
              Used for webhooks and marketplace management
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Integration Client ID</label>
                <input
                  type="text"
                  value={sharetribeConfig.integrationClientId}
                  onChange={(e) => setSharetribeConfig({ ...sharetribeConfig, integrationClientId: e.target.value })}
                  className="mt-1 block w-full form-input"
                  placeholder="e.g., 3bf8db67-c166-4569-97f9-cf467b5085e2"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Found in Sharetribe Admin → Advanced → Applications → Integration API
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Integration Client Secret</label>
                <input
                  type="password"
                  value={sharetribeConfig.integrationClientSecret}
                  onChange={(e) => setSharetribeConfig({ ...sharetribeConfig, integrationClientSecret: e.target.value })}
                  className="mt-1 block w-full form-input"
                  placeholder="e.g., 6cafc2957894671bf0e04871660295578gdcf72f"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Generated when you create an Integration API application
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Marketplace URL (Optional)</label>
            <input
              type="url"
              value={sharetribeConfig.marketplaceUrl}
              onChange={(e) => setSharetribeConfig({ ...sharetribeConfig, marketplaceUrl: e.target.value })}
              className="mt-1 block w-full form-input"
              placeholder="https://your-marketplace.sharetribe.com"
            />
            <p className="mt-1 text-xs text-gray-500">
              Your marketplace URL for generating affiliate links
            </p>
          </div>

          {/* Test Connection Section */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Test Connection</h4>
            <p className="text-sm text-gray-600 mb-4">
              Test your Sharetribe API connection to ensure everything is working correctly.
            </p>
            
            <div className="flex items-center space-x-4">
                          <button
              type="button"
              onClick={() => {
                console.log('Final test button clicked!');
                finalTest();
              }}
              disabled={isTesting || (!sharetribeConfig.marketplaceClientId || !sharetribeConfig.marketplaceClientSecret)}
              className="btn-primary bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? 'Testing...' : 'Test Sharetribe Connection'}
            </button>
              
              {testResult && (
                <div className={`text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult.message}
                </div>
              )}
            </div>
          </div>

          {/* Referral Flow Test Section */}
          <div className="bg-yellow-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-yellow-900 mb-2">Test Referral Flow</h4>
            <p className="text-sm text-yellow-800 mb-4">
              Check if referral tracking is working and see what data is in your database.
            </p>
            
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={testReferralFlow}
                disabled={isTestingReferralFlow}
                className="btn-primary bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTestingReferralFlow ? 'Testing...' : 'Test Referral Flow'}
              </button>
              
              {referralFlowResult && (
                <div className={`text-sm ${referralFlowResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {referralFlowResult.message}
                </div>
              )}
            </div>
          </div>

          {/* Sync Users Section */}
          <div className="bg-green-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-green-900 mb-2">Sync Users</h4>
            <p className="text-sm text-green-800 mb-4">
              Manually sync recent users from your Sharetribe marketplace to track affiliate referrals.
            </p>
            
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={syncUsers}
                disabled={isSyncing || (!sharetribeConfig.marketplaceClientId || !sharetribeConfig.marketplaceClientSecret)}
                className="btn-primary bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSyncing ? 'Syncing...' : 'Sync Recent Users'}
              </button>
              
              {syncResult && (
                <div className={`text-sm ${syncResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {syncResult.message}
                  {syncResult.data && (
                    <div className="mt-1 text-xs">
                      Processed: {syncResult.data.processedUsers} users, 
                      New referrals: {syncResult.data.newReferrals}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ShareTribe Tracking Script Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 p-4 rounded-md">
            <h4 className="text-lg font-bold text-indigo-900 mb-3">🚀 Simple Installation Guide - External Website Integration</h4>
            <p className="text-indigo-700 mb-4">
              Follow these simple steps to integrate affiliate tracking with your external website.
            </p>

            {/* Quick Setup Steps */}
            <div className="bg-white border border-indigo-200 rounded-lg p-4 mb-4">
              <h5 className="font-semibold text-gray-900 mb-3">Quick Setup Steps</h5>
              
              <div className="space-y-4">
                <div>
                  <h6 className="font-medium text-gray-800 mb-2">Step 1: API Setup Verification</h6>
                  <p className="text-sm text-gray-700 mb-2">
                    Ensure your Marketplace API and Integration API are set up and successfully connecting to your Sharetribe marketplace.
                  </p>
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-blue-900 mb-1">Check these in your Sharetribe Console:</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Marketplace API is active</li>
                      <li>• Integration API is configured</li>
                      <li>• API keys are properly set up</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h6 className="font-medium text-gray-800 mb-2">Step 2: Marketplace URL Configuration</h6>
                  <p className="text-sm text-gray-700 mb-2">
                    Enter your marketplace URL in the configuration above:
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Marketplace URL</span>
                        {sharetribeConfig.marketplaceUrl ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✅ Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⚠️ Not Set
                          </span>
                        )}
                      </div>
                      {sharetribeConfig.marketplaceUrl && (
                        <p className="text-sm text-gray-600 mt-1 font-mono">{sharetribeConfig.marketplaceUrl}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    <strong>Note:</strong> Enter your marketplace URL in the "Marketplace URL" field above.
                  </p>
                </div>

                <div>
                  <h6 className="font-medium text-gray-800 mb-2">Step 3: Download Tracking Script (current version v1.6)</h6>
                  <p className="text-sm text-gray-700 mb-2">
                    Download the <code>affiliate-tracking.js</code> file:
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const scriptText = `// Affiliate Referral Tracking Script - Version 1.6
(function() {
  // Get referral parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');
  
  // Check if this is an affiliate referral
  if (utmSource === 'affiliate' && utmMedium === 'referral' && utmCampaign) {
    console.log('Affiliate referral detected:', utmCampaign);
    
    // Store referral data in localStorage
    localStorage.setItem('affiliate_referral', JSON.stringify({
      source: utmSource,
      medium: utmMedium,
      campaign: utmCampaign,
      timestamp: new Date().toISOString(),
      page: window.location.href
    }));
    
    // Send initial page view tracking
    fetch('https://affiliate-marketing-tool.vercel.app/api/track-referral', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'page_view',
        referralCode: utmCampaign,
        page: window.location.href
      })
    }).catch(error => {
      console.log('Referral tracking error:', error);
    });
    
    // Store referral data for later use
    const referralData = {
      referralCode: utmCampaign,
      timestamp: new Date().toISOString(),
      page: window.location.href
    };
    
    // Store in localStorage for cross-page access
    localStorage.setItem('affiliate_referral_data', JSON.stringify(referralData));
    
    // Function to track signup completion
    function trackSignupCompletion(email, name) {
      console.log('Tracking signup completion for:', email, 'with referral:', utmCampaign);
      
      fetch('https://affiliate-marketing-tool.vercel.app/api/track-referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'signup_complete',
          referralCode: utmCampaign,
          email: email,
          userInfo: {
            email: email,
            name: name || 'New User'
          }
        })
      }).then(response => {
        console.log('Signup completion tracked successfully for affiliate:', utmCampaign);
        return response.json();
      }).catch(error => {
        console.log('Signup completion tracking error:', error);
      });
    }
    
    // Function to track signup initiation
    function trackSignupInitiation(email, name) {
      console.log('Tracking signup initiation for:', email, 'with referral:', utmCampaign);
      
      // Store email for verification completion
      localStorage.setItem('affiliate_signup_email', email);
      localStorage.setItem('affiliate_signup_name', name);
      
      fetch('https://affiliate-marketing-tool.vercel.app/api/track-referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'signup_initiated',
          referralCode: utmCampaign,
          email: email,
          userInfo: {
            email: email,
            name: name
          }
        })
      }).then(response => {
        console.log('Signup initiation tracked successfully for affiliate:', utmCampaign);
        return response.json();
      }).catch(error => {
        console.log('Signup initiation tracking error:', error);
      });
    }
    
    // Monitor for ShareTribe signup events
    document.addEventListener('DOMContentLoaded', function() {
      console.log('DOM loaded, setting up ShareTribe-specific tracking...');
      
      // Method 1: Monitor for ShareTribe SDK calls (intercept fetch/XHR)
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const url = args[0];
        const options = args[1] || {};
        
        // Check if this is a ShareTribe user creation API call
        if (typeof url === 'string' && url.includes('/api/current-user') && options.method === 'POST') {
          console.log('ShareTribe user creation API call detected!');
          
          try {
            const body = JSON.parse(options.body);
            if (body.email) {
              const name = (body.firstName || '') + ' ' + (body.lastName || '').trim();
              console.log('ShareTribe signup detected - Email:', body.email, 'Name:', name);
              trackSignupInitiation(body.email, name || 'New User');
            }
          } catch (e) {
            console.log('Could not parse ShareTribe API body:', e);
          }
        }
        
        return originalFetch.apply(this, args);
      };
      
      // Method 2: Monitor for ShareTribe form submissions
      const signupForm = document.querySelector('form.SignupForm_root__LcKFm');
      
      if (signupForm) {
        console.log('ShareTribe signup form found and monitoring...');
        
        signupForm.addEventListener('submit', function(e) {
          console.log('ShareTribe form submission detected!');
          
          const emailInput = document.querySelector('input#email');
          const fnameInput = document.querySelector('input#fname');
          const lnameInput = document.querySelector('input#lname');
          
          const email = emailInput ? emailInput.value : '';
          const firstName = fnameInput ? fnameInput.value : '';
          const lastName = lnameInput ? lnameInput.value : '';
          const name = (firstName + ' ' + lastName).trim() || 'New User';
          
          console.log('ShareTribe form data - Email:', email, 'Name:', name);
          
          if (email) {
            trackSignupInitiation(email, name);
          }
        });
      } else {
        console.log('ShareTribe signup form not found');
      }
      
      // Method 3: Monitor for ShareTribe button clicks
      document.addEventListener('click', function(e) {
        if (e.target && (e.target.tagName === 'BUTTON' || e.target.closest('button'))) {
          const button = e.target.tagName === 'BUTTON' ? e.target : e.target.closest('button');
          const buttonText = button.textContent || button.innerText || '';
          const buttonClass = button.className || '';
          
          if (buttonClass.includes('Button_primaryButtonRoot__xQMAW') ||
              buttonText.toLowerCase().includes('sign up') || 
              buttonText.toLowerCase().includes('create account') ||
              buttonText.toLowerCase().includes('join')) {
            
            console.log('ShareTribe signup button detected!');
            
            const emailInput = document.querySelector('input#email');
            const fnameInput = document.querySelector('input#fname');
            const lnameInput = document.querySelector('input#lname');
            
            const email = emailInput ? emailInput.value : '';
            const firstName = fnameInput ? fnameInput.value : '';
            const lastName = lnameInput ? lnameInput.value : '';
            const name = (firstName + ' ' + lastName).trim() || 'New User';
            
            console.log('ShareTribe button data - Email:', email, 'Name:', name);
            
            if (email) {
              trackSignupInitiation(email, name);
            }
          }
        }
      });
      
      // Method 4: Monitor for ShareTribe success messages
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'childList') {
            const verificationMessages = document.querySelectorAll('*');
            verificationMessages.forEach(function(element) {
              if (element.textContent && (
                element.textContent.includes('verification email') ||
                element.textContent.includes('check your email') ||
                element.textContent.includes('email sent') ||
                element.textContent.includes('verify your email') ||
                element.textContent.includes('confirmation email') ||
                element.textContent.includes('EmailVerificationInfo') ||
                element.textContent.includes('Please check your email')
              )) {
                console.log('ShareTribe verification message detected!');
                const email = localStorage.getItem('affiliate_signup_email');
                const name = localStorage.getItem('affiliate_signup_name');
                
                if (email) {
                  trackSignupCompletion(email, name);
                  
                  // Clean up localStorage
                  localStorage.removeItem('affiliate_referral_data');
                  localStorage.removeItem('affiliate_signup_email');
                  localStorage.removeItem('affiliate_signup_name');
                }
              }
            });
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
    
    // Also check for referral data on page load (for email verification pages)
    if (localStorage.getItem('affiliate_referral_data')) {
      const referralData = JSON.parse(localStorage.getItem('affiliate_referral_data'));
      
      if (window.location.href.includes('verify') || 
          window.location.href.includes('confirm') || 
          window.location.href.includes('activate') ||
          window.location.search.includes('token')) {
        
        console.log('ShareTribe email verification page detected');
        const email = localStorage.getItem('affiliate_signup_email');
        const name = localStorage.getItem('affiliate_signup_name');
        
        if (email) {
          trackSignupCompletion(email, name);
          
          // Clean up localStorage
          localStorage.removeItem('affiliate_referral_data');
          localStorage.removeItem('affiliate_signup_email');
          localStorage.removeItem('affiliate_signup_name');
        }
      }
    }
  }
})();`;
                        
                        // Create a blob and download the file
                        const blob = new Blob([scriptText], { type: 'application/javascript' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'affiliate-tracking.js';
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      📥 Download Script
                    </button>
                    <span className="text-sm text-gray-500">Save as: affiliate-tracking.js</span>
                  </div>
                </div>

                <div>
                  <h6 className="font-medium text-gray-800 mb-2">Step 4: Add Script to Your Website</h6>
                  <p className="text-sm text-gray-700 mb-2">
                    In your website code, navigate to your scripts folder and add the tracking script file there:
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 font-mono text-sm text-gray-700">
                    your-website/<br/>
                    ├── scripts/<br/>
                    │   └── affiliate-tracking.js ← Add the file here<br/>
                    
                  </div>
                </div>

                <div>
                  <h6 className="font-medium text-gray-800 mb-2">Step 5: Reference Script in HTML</h6>
                  <p className="text-sm text-gray-700 mb-2">
                    Go to your website's <code>index.html</code> file and add the following script reference in the <code>&lt;head&gt;</code> section:
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 font-mono text-sm text-gray-700">
                    your-website/<br/>
                    ├── public/<br/>
                    │   ├── index.html<br/>
                    │   └── scripts/<br/>
                    │       └── affiliate-tracking.js
                  </div>
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-gray-700">
                      Add this line to your <code>&lt;head&gt;</code> section:
                    </p>
                    <div className="flex items-start space-x-2">
                      <div className="flex-1 bg-gray-900 border border-gray-700 rounded-md p-3 font-mono text-sm text-green-400">
                        &lt;script src="/scripts/affiliate-tracking.js"&gt;&lt;/script&gt;
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const scriptTag = `<script src="/scripts/affiliate-tracking.js"></script>`;
                          navigator.clipboard.writeText(scriptTag).then(() => {
                            alert('Script tag copied to clipboard!');
                          }).catch(() => {
                            alert('Failed to copy code. Please select and copy manually.');
                          });
                        }}
                        className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    <strong>Important:</strong> Make sure the path matches where you placed the file in Step 4.
                  </p>
                </div>

                <div>
                  <h6 className="font-medium text-gray-800 mb-2">Step 6: Test Installation</h6>
                  <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                    <li>Open your website in a browser</li>
                    <li>Open Developer Tools (F12)</li>
                    <li>Check the Console tab for tracking messages</li>
                    <li>Test with an affiliate link</li>
                  </ol>
                  <div className="bg-green-50 p-3 rounded-md mt-2">
                    <p className="text-sm font-medium text-green-900 mb-1">Expected console messages:</p>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• "Affiliate referral detected: [campaign]"</li>
                      <li>• "ShareTribe user creation API call detected!"</li>
                      <li>• "Signup initiation tracked successfully"</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="bg-white border border-indigo-200 rounded-lg p-4 mb-4">
              <h5 className="font-semibold text-gray-900 mb-3">✅ Verification Checklist</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-700">API connections are working</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-700">Tracking script file is in your scripts folder</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-700">Script reference is added to index.html</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-700">Console shows tracking messages</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-700">Affiliate links are working</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-700">No JavaScript errors in console</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-700">Script loads without 404 errors</span>
                </div>
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="bg-white border border-indigo-200 rounded-lg p-4 mb-4">
              <h5 className="font-semibold text-gray-900 mb-3">🔧 Troubleshooting</h5>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-800 mb-1">Script not loading?</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Check the file path in your script tag</li>
                    <li>• Ensure the file is in the correct folder</li>
                    <li>• Clear browser cache and reload</li>
                    <li>• Check for 404 errors in Network tab</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 mb-1">No tracking events?</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Verify UTM parameters are correct</li>
                    <li>• Check browser console for errors</li>
                    <li>• Ensure your marketplace URL is correct</li>
                    <li>• Test with different browsers</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 mb-1">Console errors?</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Check for JavaScript syntax errors</li>
                    <li>• Verify the script file is not corrupted</li>
                    <li>• Ensure no conflicts with other scripts</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* What Gets Tracked */}
            <div className="bg-white border border-indigo-200 rounded-lg p-4 mb-4">
              <h5 className="font-semibold text-gray-900 mb-3">📊 What Gets Tracked</h5>
              <p className="text-sm text-gray-700 mb-2">
                The script automatically tracks:
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Page Views</strong> with affiliate UTM parameters</li>
                <li>• <strong>Signup Initiation</strong> when users start registration</li>
                <li>• <strong>Signup Completion</strong> when email verification is done</li>
                <li>• <strong>User Data</strong> (email, name, referral code)</li>
              </ul>
            </div>

            {/* Important Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>📝 Important Note About Sharetribe Code Access:</strong> If you are not comfortable editing code please speak to a developer to assist you.
              </p>
            </div>



            {/* Testing Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <h5 className="font-semibold text-yellow-900 mb-2">🧪 Test Your Integration:</h5>
              <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                <li>Visit an affiliate link (e.g., <code className="bg-yellow-100 px-1 rounded">yoursite.com/signup?utm_source=affiliate&utm_medium=referral&utm_campaign=TEST123</code>)</li>
                <li>Check browser console for "Affiliate referral detected" message</li>
                <li>Verify data appears in your affiliate dashboard</li>
              </ol>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Setup Instructions</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>1.</strong> Go to Sharetribe admin panel → Advanced → Applications</p>
              <p><strong>2.</strong> Create a Marketplace API application to get Marketplace Client ID and Secret</p>
              <p><strong>3.</strong> Create an Integration API application to get Integration Client ID and Secret</p>
              <p><strong>4.</strong> Enter both sets of credentials above</p>
              <p><strong>5.</strong> Test the connection using the button above</p>
              <p><strong>6.</strong> Add referral tracking to your marketplace signup form</p>
              <p><strong>7.</strong> Use the sync button to manually track recent signups</p>
              <br />
              <p><strong>Note:</strong> Both APIs are required for full functionality. Marketplace API for data access, Integration API for webhooks.</p>
            </div>
          </div>

          {saveResult && (
            <div className={`text-sm ${saveResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {saveResult.message}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={finalTest}
              disabled={isTesting || (!sharetribeConfig.marketplaceClientId || !sharetribeConfig.marketplaceClientSecret)}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Connection
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Integration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfileSettings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load user profile on component mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase()
          .from('users')
          .select('full_name, email')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setProfile({
          fullName: data?.full_name || '',
          email: data?.email || user.email || '',
          phone: '', // Phone not in users table yet
        });
      } catch (error) {
        console.error('Failed to load profile:', error);
        // Set default values from auth user
        setProfile({
          fullName: '',
          email: user.email || '',
          phone: '',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setSaveResult(null);

    try {
      const { error } = await supabase()
        .from('users')
        .update({
          full_name: profile.fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setSaveResult({ success: true, message: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Failed to update profile:', error);
      setSaveResult({ success: false, message: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
        
        {saveResult && (
          <div className={`mb-4 p-4 rounded-md ${
            saveResult.success 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {saveResult.message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              className="mt-1 block w-full form-input"
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="mt-1 block w-full form-input bg-gray-50 text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Update Profile'}
        </button>
      </div>
    </form>
  );
}

function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    newAffiliateSignup: true,
    newReferral: true,
    payoutProcessed: true,
    weeklyReports: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving notification settings:', notifications);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.emailNotifications}
              onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">New Affiliate Signup</h4>
              <p className="text-sm text-gray-500">When a new affiliate joins</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.newAffiliateSignup}
              onChange={(e) => setNotifications({ ...notifications, newAffiliateSignup: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">New Referral</h4>
              <p className="text-sm text-gray-500">When a new referral is made</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.newReferral}
              onChange={(e) => setNotifications({ ...notifications, newReferral: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Payout Processed</h4>
              <p className="text-sm text-gray-500">When a payout is processed</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.payoutProcessed}
              onChange={(e) => setNotifications({ ...notifications, payoutProcessed: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Weekly Reports</h4>
              <p className="text-sm text-gray-500">Receive weekly performance reports</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.weeklyReports}
              onChange={(e) => setNotifications({ ...notifications, weeklyReports: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="btn-primary"
        >
          Save Preferences
        </button>
      </div>
    </form>
  );
}

function SecuritySettings() {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Changing password');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              className="mt-1 block w-full form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="mt-1 block w-full form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              className="mt-1 block w-full form-input"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="btn-primary"
        >
          Change Password
        </button>
      </div>
    </form>
  );
}
