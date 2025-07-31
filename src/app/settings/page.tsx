'use client';

import { useState, useEffect } from 'react';
import { CogIcon, UserIcon, BellIcon, ShieldCheckIcon, LinkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'integrations', name: 'Integrations', icon: LinkIcon },
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
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
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'integrations' && <IntegrationSettings />}
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'security' && <SecuritySettings />}
        </div>
      </div>
    </div>
  );
}

function GeneralSettings() {
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

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.success && data.settings.general) {
          setSettings(data.settings.general);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveResult(null);
    
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Default Commission (%)</label>
            <input
              type="number"
              value={settings.defaultCommission}
              onChange={(e) => setSettings({ ...settings, defaultCommission: parseFloat(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}

function IntegrationSettings() {
  const [sharetribeConfig, setSharetribeConfig] = useState({
    clientId: '',
    clientSecret: '',
    marketplaceUrl: '',
  });
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.success && data.settings.sharetribe) {
          setSharetribeConfig(data.settings.sharetribe);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveResult(null);
    
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Client ID</label>
              <input
                type="text"
                value={sharetribeConfig.clientId}
                onChange={(e) => setSharetribeConfig({ ...sharetribeConfig, clientId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="e.g., 2af9ca56-b055-4568-96e8-bf356a5085e1"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Found in Sharetribe Admin → Advanced → Applications → Add new application
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Client Secret</label>
              <input
                type="password"
                value={sharetribeConfig.clientSecret}
                onChange={(e) => setSharetribeConfig({ ...sharetribeConfig, clientSecret: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="e.g., 5bafb1946783560ae9d93760550194467fcbf61e"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Generated when you create a new application in Advanced → Applications
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Marketplace URL (Optional)</label>
            <input
              type="url"
              value={sharetribeConfig.marketplaceUrl}
              onChange={(e) => setSharetribeConfig({ ...sharetribeConfig, marketplaceUrl: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                disabled={isTesting || !sharetribeConfig.clientId || !sharetribeConfig.clientSecret}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={isSyncing || !sharetribeConfig.clientId || !sharetribeConfig.clientSecret}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Setup Instructions */}
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Setup Instructions</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>1.</strong> Go to Sharetribe admin panel → Settings → API</p>
              <p><strong>2.</strong> Create a new API client to get Client ID and Client Secret</p>
              <p><strong>3.</strong> Test the connection using the button above</p>
              <p><strong>4.</strong> Add referral tracking to your marketplace signup form</p>
              <p><strong>5.</strong> Use the sync button to manually track recent signups</p>
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
              disabled={isTesting || !sharetribeConfig.clientId || !sharetribeConfig.clientSecret}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Connection
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
        const { data, error } = await supabase
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
      const { error } = await supabase
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
        >
          Change Password
        </button>
      </div>
    </form>
  );
}
