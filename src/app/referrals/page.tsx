'use client';

import { useState, useEffect } from 'react';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatDate, getStatusColor } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import CopyButton from '@/components/CopyButton';

interface Referral {
  id: string;
  affiliate_id: string;
  affiliate_name: string;
  affiliate_email: string;
  customer_email: string;
  customer_name: string;
  status: 'pending' | 'approved' | 'rejected';
  commission: number;
  referral_code: string;
  created_at: string;
  // ShareTribe fields
  sharetribe_user_id?: string;
  sharetribe_created_at?: string;
  listings_count?: number;
  transactions_count?: number;
  total_revenue?: number;
  last_sync_at?: string;
  // Validation fields
  sharetribe_validation_status?: 'green' | 'amber' | 'red' | 'error';
  sharetribe_validation_updated_at?: string;
}

export default function Referrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('GBP');
  const [validationTimer, setValidationTimer] = useState<NodeJS.Timeout | null>(null);
  const [showTestButtons, setShowTestButtons] = useState(false);
  const [statusFilter, setStatusFilter] = useState('green'); // Default to verified users only

  // Auto-validate referrals on page load and every minute
  const autoValidateReferrals = async () => {
    try {
      const { data: { session } } = await supabase().auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        console.log('No auth token, skipping auto-validation');
        return;
      }

      console.log('🔄 Auto-validating referrals...');
      const response = await fetch('/api/validate-referral-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ forceRefresh: false }) // Use cache if recent
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ Auto-validation completed:', data.summary);
          // Refresh the referrals data to show updated status
          fetchReferrals();
        }
      }
    } catch (error) {
      console.error('❌ Auto-validation error:', error);
    }
  };

  // Set up validation timer
  useEffect(() => {
    // Run validation immediately on load
    autoValidateReferrals();
    
    // Set up timer to run every minute
    const timer = setInterval(autoValidateReferrals, 60000); // 60 seconds
    setValidationTimer(timer);
    
    // Cleanup timer on unmount
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // Load referrals and currency settings on component mount
  useEffect(() => {
    fetchReferrals();
    fetchCurrencySettings();
  }, []);

  const fetchCurrencySettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.success && data.settings?.general?.currency) {
        const currencyCode = data.settings.general.currency;
        const currencySymbols: { [key: string]: string } = {
          'USD': '$',
          'GBP': '£',
          'EUR': '€',
          'CAD': 'C$',
          'AUD': 'A$'
        };
        setCurrency(currencySymbols[currencyCode] || '$');
      }
    } catch (error) {
      console.error('Failed to fetch currency settings:', error);
    }
  };

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      
      // Get auth token for API request
      const { data: { session } } = await supabase().auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch('/api/referrals', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      const data = await response.json();
      if (data.success) {
        setReferrals(data.referrals);
      }
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'approved':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Approved</span>;
      case 'pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending</span>;
      case 'rejected':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Rejected</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  const getValidationStatusBadge = (validationStatus?: string) => {
    if (!validationStatus) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Not Checked</span>;
    }
    
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (validationStatus) {
      case 'green':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Verified</span>;
      case 'amber':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Unverified</span>;
      case 'red':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Invalid</span>;
      case 'error':
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Error</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</span>;
    }
  };

  const getValidationDot = (status?: string) => {
    if (!status) return null;
    
    const baseClasses = "w-3 h-3 rounded-full inline-block mr-2";
    switch (status) {
      case 'green':
        return <span className={`${baseClasses} bg-green-500`} title="User exists in ShareTribe and email is verified"></span>;
      case 'amber':
        return <span className={`${baseClasses} bg-yellow-500`} title="User exists in ShareTribe but email is not verified"></span>;
      case 'red':
        return <span className={`${baseClasses} bg-red-500`} title="User does not exist in ShareTribe"></span>;
      case 'error':
        return <span className={`${baseClasses} bg-gray-500`} title="Error checking user status"></span>;
      default:
        return null;
    }
  };

  // Filter referrals based on status filter
  const filteredReferrals = referrals.filter(referral => {
    if (statusFilter === 'all') return true;
    return referral.sharetribe_validation_status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
            <p className="text-sm text-gray-600 mt-1">
              Track your affiliate referrals and their ShareTribe validation status
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Auto-validation active (every minute)
              </span>
            </p>
          </div>
          <div className="flex space-x-2">
            {/* Test Buttons Toggle */}
            <button
              onClick={() => setShowTestButtons(!showTestButtons)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {showTestButtons ? '🔒 Hide Test Buttons' : '🔧 Show Test Buttons'}
            </button>
          </div>
        </div>
      </div>

      {/* Test Buttons Section - Hidden by default */}
      {showTestButtons && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-900 mb-4">🧪 Test & Debug Tools</h3>
          <div className="flex flex-wrap gap-2">
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                const response = await fetch('/api/debug-referrals', {
                  headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  }
                });
                const data = await response.json();
                if (data.success) {
                  console.log('🔍 Debug Data:', data.debug);
                  alert(`Debug Info:\nAffiliates: ${data.debug.affiliatesCount}\nUser Referrals: ${data.debug.userReferralsCount}\nTotal System Referrals: ${data.debug.totalReferralsInSystem}\n\nAffiliate Details:\n${data.debug.affiliates.map((a: any) => `${a.name}: ${a.referral_code}`).join('\n')}`);
                } else {
                  alert('Debug failed: ' + data.message);
                }
              } catch (error) {
                console.error('Debug error:', error);
                alert('Debug error: ' + error);
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            🔍 Debug
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                const response = await fetch('/api/test-referral-creation', {
                  method: 'POST',
                  headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  }
                });
                const data = await response.json();
                if (data.success) {
                  console.log('✅ Test referral created:', data.referral);
                  alert(`Test referral created successfully!\n\nAffiliate: ${data.referral.affiliate_name}\nCustomer: ${data.referral.customer_name}\nEmail: ${data.referral.customer_email}\nCommission: $${data.referral.commission_earned}`);
                  // Refresh the page to show the new referral
                  window.location.reload();
                } else {
                  const errorDetails = data.error ? 
                    `Error: ${data.message}\n\nDetails:\nCode: ${data.error.code}\nMessage: ${data.error.message}\nHint: ${data.error.hint || 'None'}` :
                    `Error: ${data.message}`;
                  alert('Test failed:\n\n' + errorDetails);
                }
              } catch (error) {
                console.error('Test error:', error);
                alert('Test error: ' + error);
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            🧪 Test Create
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                const response = await fetch('/api/test-sharetribe-connection', {
                  headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  }
                });
                const data = await response.json();
                if (data.success) {
                  console.log('✅ ShareTribe connection successful:', data);
                  alert(`ShareTribe connection successful!\n\nMarketplace: ${data.marketplace?.name || 'Unknown'}\nStatus: Connected\n\nYou can now sync referrals with ShareTribe data.`);
                } else {
                  alert('ShareTribe connection failed:\n\n' + data.message + '\n\n' + (data.instructions || 'Please go to Settings → Integrations tab to configure ShareTribe.'));
                }
              } catch (error) {
                console.error('ShareTribe test error:', error);
                alert('ShareTribe test error: ' + error);
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            🔗 Test ShareTribe
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                const response = await fetch('/api/test-sharetribe-users', {
                  headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  }
                });
                const data = await response.json();
                if (data.success) {
                  console.log('✅ ShareTribe users found:', data);
                  const userList = data.users.map((u: any) => 
                    `${u.email} (${u.displayName}) - Created: ${new Date(u.createdAt).toLocaleDateString()}`
                  ).join('\n');
                  alert(`ShareTribe users found:\n\n${userList}\n\nUse one of these email addresses to test sync functionality.`);
                } else {
                  alert('Failed to fetch ShareTribe users:\n\n' + data.message);
                }
              } catch (error) {
                console.error('ShareTribe users test error:', error);
                alert('ShareTribe users test error: ' + error);
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
          >
            👥 List Users
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                const response = await fetch('/api/debug-sharetribe-raw', {
                  headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  }
                });
                const data = await response.json();
                if (data.success) {
                  console.log('✅ Raw ShareTribe API response:', data);
                  alert('Raw API response captured! Check console for details.\n\n' + 
                        'Marketplace: ' + JSON.stringify(data.marketplaceData, null, 2) + '\n\n' +
                        'Users: ' + JSON.stringify(data.usersData, null, 2));
                } else {
                  alert('Debug failed: ' + data.message + '\n\n' + JSON.stringify(data, null, 2));
                }
              } catch (error) {
                console.error('Debug error:', error);
                alert('Debug error: ' + error);
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            🔍 Debug Raw API
          </button>
          <button
            onClick={async () => {
              console.log('🔄 Starting sync...');
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                console.log('🔄 Making sync request...');
                const response = await fetch('/api/sync-all-referrals', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  }
                });
                const data = await response.json();
                console.log('🔄 Raw sync response:', data);
                
                if (data.success) {
                  alert(`Live sync completed!\n\nSynced: ${data.syncedCount}\nUpdated: ${data.updatedCount}\nErrors: ${data.errorCount || 0}\n\nDetails: ${JSON.stringify(data.details, null, 2)}`);
                  fetchReferrals(); // Refresh the data
                } else {
                  // Always log the results to console for easy viewing
                  console.log('🔄 Live Sync Results:', data);
                  console.log('📊 Summary:', data.summary);
                  console.log('📋 Details:', data.details);
                  
                  // Expand and show detailed results for each user
                  if (data.details && data.details.results) {
                    console.log('👥 DETAILED USER RESULTS:');
                    data.details.results.forEach((result: any, index: number) => {
                      if (result.status === 'Success') {
                        console.log(`\n✅ User ${index + 1}: ${result.user.displayName} (${result.email})`);
                        console.log(`   📋 Listings: ${result.stats.listingsCount || 0}`);
                        console.log(`   💰 Transactions: ${result.stats.transactionsCount || 0}`);
                        console.log(`   💵 Revenue: $${result.stats.totalRevenue || 0}`);
                        console.log(`   🔄 Updated: ${result.updated ? 'Yes' : 'No'}`);
                      } else {
                        console.log(`\n❌ User ${index + 1}: ${result.email} - ${result.status}`);
                        console.log(`   Error: ${result.error}`);
                      }
                    });
                  }
                  
                  if (data.errors && data.errors.length > 0) {
                    console.log('❌ Errors:', data.errors);
                  }
                  
                  // Check if it's a "no users found" case vs actual failure
                  if (data.message && data.message.includes('no users found')) {
                    alert(`Live sync completed!\n\n${data.message}\n\nSynced: ${data.syncedCount}\nUpdated: ${data.updatedCount}\nErrors: ${data.errorCount || 0}\n\nCheck console for detailed results.`);
                  } else {
                    alert('Live sync failed: ' + data.message);
                  }
                }
              } catch (error) {
                console.error('Live sync error:', error);
                alert('Live sync error: ' + error);
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            🔄 Live Sync All
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                const response = await fetch('/api/test-sharetribe-basic', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  }
                });
                const data = await response.json();
                if (data.success) {
                  alert('Basic ShareTribe test successful!\n\nCheck console for details.');
                  console.log('Basic ShareTribe test result:', data);
                } else {
                  alert('Basic ShareTribe test failed: ' + data.message + '\n\n' + JSON.stringify(data, null, 2));
                }
              } catch (error) {
                console.error('Basic test error:', error);
                alert('Basic test error: ' + error);
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            🧪 Test Basic
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                // Use one of the user IDs from the basic test
                const userId = "688d0c51-8fbc-45e6-8a29-fc66c9ab7990"; // Jacob M's ID
                
                const response = await fetch('/api/debug-user-stats', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  },
                  body: JSON.stringify({ userId })
                });
                const data = await response.json();
                if (data.success) {
                  alert('User stats debug successful!\n\nCheck console for detailed logs.');
                  console.log('User stats debug result:', data);
                } else {
                  alert('User stats debug failed: ' + data.message + '\n\n' + JSON.stringify(data, null, 2));
                }
              } catch (error) {
                console.error('User stats debug error:', error);
                alert('User stats debug error: ' + error);
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
          >
            🔍 Debug Stats
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                const response = await fetch('/api/test-simple', {
                  headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  }
                });
                const data = await response.json();
                if (data.success) {
                  alert('Simple test successful!\n\nCheck console for details.');
                  console.log('Simple test result:', data);
                } else {
                  alert('Simple test failed: ' + data.message + '\n\n' + JSON.stringify(data, null, 2));
                }
              } catch (error) {
                console.error('Simple test error:', error);
                alert('Simple test error: ' + error);
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
          >
            🧪 Simple Test
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                const response = await fetch('/api/test-users-query', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  }
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('🧪 Users query test result:', data);
                
                if (data.success) {
                  alert(`Users query test completed!\n\nFound ${data.results.allUsersCount} users\n\nCheck console for detailed results.`);
                } else {
                  alert('Users query test failed: ' + data.message);
                }
              } catch (error) {
                console.error('Users query test error:', error);
                alert('Users query test error: ' + error);
              }
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
          >
            🧪 Test Users Query
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                console.log('🔍 Starting email validation...');
                const response = await fetch('/api/validate-referral-emails', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  },
                  body: JSON.stringify({ forceRefresh: true })
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('🔍 Email validation result:', data);
                
                if (data.success) {
                  alert(`Email validation completed!\n\n📊 Summary:\n✅ Green: ${data.summary.green}\n🟡 Amber: ${data.summary.amber}\n🔴 Red: ${data.summary.red}\n❌ Errors: ${data.summary.error}\n💾 Cached: ${data.summary.cached}\n🆕 Fresh: ${data.summary.fresh}\n\nCheck console for detailed results.`);
                  fetchReferrals(); // Refresh the data to show validation dots
                } else {
                  alert('Email validation failed: ' + data.message);
                }
              } catch (error) {
                console.error('Email validation error:', error);
                alert('Email validation error: ' + error);
              }
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm"
          >
            🔍 Validate Emails
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                console.log('🧹 Clearing validation cache...');
                const response = await fetch('/api/clear-validation-cache', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  }
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('🧹 Cache clear result:', data);
                
                if (data.success) {
                  alert('Validation cache cleared successfully!');
                  fetchReferrals(); // Refresh the data
                } else {
                  alert('Failed to clear cache: ' + data.message);
                }
              } catch (error) {
                console.error('Cache clear error:', error);
                alert('Cache clear error: ' + error);
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
          >
            🧹 Clear Cache
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                console.log('🔍 Starting validation of all referrals...');
                const response = await fetch('/api/validate-all-referrals', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  }
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('🔍 All referrals validation result:', data);
                
                if (data.success) {
                  alert(`All referrals validation completed!\n\n📊 Results:\n✅ Validated: ${data.validated}\n❌ Errors: ${data.errors}\n📋 Total: ${data.total}\n\nCheck console for detailed results.`);
                  fetchReferrals(); // Refresh the data to show updated validation status
                } else {
                  alert('All referrals validation failed: ' + data.message);
                }
              } catch (error) {
                console.error('All referrals validation error:', error);
                alert('All referrals validation error: ' + error);
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
          >
            🔍 Validate All Referrals
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                console.log('🔧 Fixing duplicate affiliates...');
                const response = await fetch('/api/fix-database-issues', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  },
                  body: JSON.stringify({ fixType: 'duplicate-affiliates' })
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('🔧 Duplicate affiliates fix result:', data);
                
                if (data.success) {
                  alert(`Duplicate affiliates fixed!\n\n📊 Results:\n🗑️ Removed: ${data.duplicatesRemoved}\n✅ Kept: ${data.affiliatesKept}\n📋 Total: ${data.total}\n\nCheck console for detailed results.`);
                  window.location.reload(); // Refresh the page to show updated data
                } else {
                  alert('Failed to fix duplicate affiliates: ' + data.message);
                }
              } catch (error) {
                console.error('Duplicate affiliates fix error:', error);
                alert('Duplicate affiliates fix error: ' + error);
              }
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-sm"
          >
            🔧 Fix Duplicate Affiliates
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                console.log('🔧 Fixing missing validation status...');
                const response = await fetch('/api/fix-database-issues', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  },
                  body: JSON.stringify({ fixType: 'missing-validation-status' })
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('🔧 Missing validation status fix result:', data);
                
                if (data.success) {
                  alert(`Missing validation status fixed!\n\n📊 Results:\n✅ Fixed: ${data.fixed}\n📋 Total: ${data.total}\n\nCheck console for detailed results.`);
                  fetchReferrals(); // Refresh the data to show updated validation status
                } else {
                  alert('Failed to fix missing validation status: ' + data.message);
                }
              } catch (error) {
                console.error('Missing validation status fix error:', error);
                alert('Missing validation status fix error: ' + error);
              }
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
          >
            🔧 Fix Missing Validation Status
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                console.log('🔧 Checking validation columns...');
                const response = await fetch('/api/check-validation-columns', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  }
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('🔧 Column check result:', data);
                
                if (data.success) {
                  alert('Column check completed: ' + data.message);
                } else {
                  alert('Column check failed: ' + data.message);
                }
              } catch (error) {
                console.error('Column check error:', error);
                alert('Column check error: ' + error);
              }
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
          >
            🔧 Check Columns
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                // Get the most recent referral
                const response = await fetch('/api/referrals', {
                  headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  }
                });
                const data = await response.json();
                
                if (data.success && data.referrals.length > 0) {
                  const latestReferral = data.referrals[0];
                  console.log('🔍 Testing validation for latest referral:', latestReferral);
                  
                  const debugResponse = await fetch('/api/debug-referral-validation', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(token && { 'Authorization': `Bearer ${token}` })
                    },
                    body: JSON.stringify({
                      referralId: latestReferral.id,
                      userEmail: latestReferral.customer_email
                    })
                  });
                  
                  const debugData = await debugResponse.json();
                  console.log('🔍 Debug validation result:', debugData);
                  
                  if (debugData.success) {
                    alert(`✅ Debug validation successful!\n\nUser found in ShareTribe\nStatus: ${debugData.debug.validationStatus}\nUser ID: ${debugData.debug.userId}\nEmail Verified: ${debugData.debug.emailVerified}`);
                    fetchReferrals(); // Refresh the data
                  } else {
                    alert(`❌ Debug validation failed:\n\n${debugData.message}\n\nDebug info:\n${JSON.stringify(debugData.debug, null, 2)}`);
                  }
                } else {
                  alert('No referrals found to test');
                }
              } catch (error) {
                console.error('Debug validation error:', error);
                alert('Debug validation error: ' + error);
              }
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
          >
            🔍 Debug Validation
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                if (!session?.user?.id) {
                  alert('No user ID found');
                  return;
                }
                
                console.log('🧪 Running simple ShareTribe test for user:', session.user.id);
                
                const response = await fetch('/api/test-sharetribe-simple', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  },
                  body: JSON.stringify({
                    userId: session.user.id
                  })
                });
                
                const data = await response.json();
                console.log('🧪 Simple test result:', data);
                
                if (data.success) {
                  alert(`✅ Simple test passed!\n\nAll ShareTribe components working correctly.`);
                } else {
                  alert(`❌ Simple test failed at step: ${data.step}\n\nMessage: ${data.message}\n\nError: ${data.error || 'None'}`);
                }
              } catch (error) {
                console.error('Simple test error:', error);
                alert('Simple test error: ' + error);
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          >
            🧪 Simple Test
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                if (!session?.user?.id) {
                  alert('No user ID found');
                  return;
                }
                
                console.log('🔍 Checking ShareTribe settings for user:', session.user.id);
                
                const response = await fetch('/api/check-sharetribe-settings', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  },
                  body: JSON.stringify({
                    userId: session.user.id
                  })
                });
                
                const data = await response.json();
                console.log('🔍 Settings check result:', data);
                
                if (data.success) {
                  alert(`🔍 Current ShareTribe Settings:\n\nMarketplace Client ID: ${data.settings.marketplaceClientId}\nMarketplace Client Secret: ${data.settings.marketplaceClientSecret}\nMarketplace URL: ${data.settings.marketplaceUrl}\n\nIntegration Client ID: ${data.settings.integrationClientId}\nIntegration Client Secret: ${data.settings.integrationClientSecret}\n\n⚠️ ISSUE: Marketplace URL is set to localhost instead of ShareTribe URL!`);
                } else {
                  alert(`❌ Settings check failed:\n\n${data.message}`);
                }
              } catch (error) {
                console.error('Settings check error:', error);
                alert('Settings check error: ' + error);
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
          >
            🔍 Check Settings
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                if (!session?.user?.id) {
                  alert('No user ID found');
                  return;
                }
                
                console.log('🔍 Running direct ShareTribe test for user:', session.user.id);
                
                const response = await fetch('/api/test-sharetribe-direct', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  },
                  body: JSON.stringify({
                    userId: session.user.id
                  })
                });
                
                const data = await response.json();
                console.log('🔍 Direct test result:', data);
                
                if (data.success) {
                  alert(`✅ Direct test passed!\n\nShareTribe connection successful\nMarketplace: ${data.marketplace}`);
                } else {
                  alert(`❌ Direct test failed at step: ${data.step}\n\nMessage: ${data.message}\n\nError: ${data.error || 'None'}\n\nStack: ${data.stack || 'None'}`);
                }
              } catch (error) {
                console.error('Direct test error:', error);
                alert('Direct test error: ' + error);
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
          >
            🔍 Direct Test
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                if (!session?.user?.id) {
                  alert('No user ID found');
                  return;
                }
                
                console.log('🧪 Testing ShareTribe users API for user:', session.user.id);
                
                const response = await fetch('/api/test-sharetribe-users', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  },
                  body: JSON.stringify({
                    userId: session.user.id
                  })
                });
                
                const data = await response.json();
                console.log('🧪 Users API test result:', data);
                
                if (data.success) {
                  alert(`✅ Users API test successful!\n\nCredentials: ${data.credentials.type}\nResponse structure matches expected format.`);
                } else {
                  alert(`❌ Users API test failed:\n\nMessage: ${data.message}\nError: ${data.error || 'None'}\nStatus: ${data.status || 'None'}`);
                }
              } catch (error) {
                console.error('Users API test error:', error);
                alert('Users API test error: ' + error);
              }
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-sm"
          >
            🧪 Test Users API
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                if (!session?.user?.id) {
                  alert('❌ No user session found');
                  return;
                }
                
                const response = await fetch('/api/debug-sharetribe-user-structure', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    userId: session.user.id
                  })
                });
                
                const data = await response.json();
                console.log('🔍 User structure debug result:', data);
                
                if (data.success) {
                  alert(`✅ User structure debug successful!\n\nFound ${data.userCount} users\nCheck console for detailed structure.`);
                } else {
                  alert(`❌ User structure debug failed:\n\nMessage: ${data.message}\nError: ${data.error || 'None'}`);
                }
              } catch (error) {
                console.error('Debug error:', error);
                alert('❌ Debug failed');
              }
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
          >
            🔍 Debug User Structure
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                if (!session?.user?.id) {
                  alert('❌ No user session found');
                  return;
                }
                
                const response = await fetch('/api/force-validate-all', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    userId: session.user.id
                  })
                });
                
                const data = await response.json();
                console.log('🔄 Force validation result:', data);
                
                if (data.success) {
                  alert(`✅ Force validation completed!\n\nUpdated: ${data.results.updated}\nErrors: ${data.results.errors}\nTotal: ${data.results.total}\n\nCheck console for details.`);
                  // Refresh the page to show updated statuses
                  window.location.reload();
                } else {
                  alert(`❌ Force validation failed:\n\nMessage: ${data.message}\nError: ${data.error || 'None'}`);
                }
              } catch (error) {
                console.error('Force validation error:', error);
                alert('❌ Force validation failed');
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
          >
            🔄 Force Validate All
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                if (!session?.user?.id) {
                  alert('❌ No user session found');
                  return;
                }
                
                // Step 1: Clear cache
                console.log('🧹 Step 1: Clearing cache...');
                const clearResponse = await fetch('/api/clear-validation-cache', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    userId: session.user.id
                  })
                });
                
                const clearData = await clearResponse.json();
                if (!clearData.success) {
                  alert(`❌ Failed to clear cache: ${clearData.message}`);
                  return;
                }
                
                console.log('✅ Cache cleared successfully');
                
                // Step 2: Force validate all
                console.log('🔄 Step 2: Force validating all...');
                const validateResponse = await fetch('/api/force-validate-all', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    userId: session.user.id
                  })
                });
                
                const validateData = await validateResponse.json();
                console.log('🔄 Force validation result:', validateData);
                
                if (validateData.success) {
                  alert(`✅ Cache cleared & validation completed!\n\nUpdated: ${validateData.results.updated}\nErrors: ${validateData.results.errors}\nTotal: ${validateData.results.total}\n\nPage will refresh to show updated statuses.`);
                  // Refresh the page to show updated statuses
                  window.location.reload();
                } else {
                  alert(`❌ Force validation failed:\n\nMessage: ${validateData.message}\nError: ${validateData.error || 'None'}`);
                }
              } catch (error) {
                console.error('Clear & validate error:', error);
                alert('❌ Clear & validate failed');
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          >
            🧹 Clear Cache & Validate
          </button>
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase().auth.getSession();
                if (!session?.user?.id) {
                  alert('❌ No user session found');
                  return;
                }
                
                const response = await fetch('/api/debug-referrals-structure', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    userId: session.user.id
                  })
                });
                
                const data = await response.json();
                console.log('🔍 Referrals structure debug result:', data);
                
                if (data.success) {
                  alert(`✅ Referrals structure debug successful!\n\nTotal referrals: ${data.summary.totalReferrals}\nUser referrals: ${data.summary.userReferrals}\nTotal affiliates: ${data.summary.totalAffiliates}\n\nCheck console for detailed structure.`);
                } else {
                  alert(`❌ Referrals structure debug failed:\n\nMessage: ${data.message}\nError: ${data.error || 'None'}`);
                }
              } catch (error) {
                console.error('Referrals structure debug error:', error);
                alert('❌ Referrals structure debug failed');
              }
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
          >
            🔍 Debug Referrals Structure
          </button>
        </div>
      </div>
      )}

      {/* Controls Section */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Status Filter */}
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">ShareTribe Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="green">Verified Only</option>
              <option value="amber">Unverified Only</option>
              <option value="red">Invalid Only</option>
              <option value="all">All Statuses</option>
            </select>
            <span className="text-sm text-gray-500">
              ({filteredReferrals.length} of {referrals.length} referrals)
            </span>
          </div>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden table-container">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Loading referrals...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Affiliate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referral Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ShareTribe Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReferrals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <ArrowPathIcon className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">No referrals yet</p>
                        <p className="text-sm text-gray-500">
                          Referrals will appear here when your affiliates start referring customers
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReferrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-600">
                                {referral.affiliate_name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{referral.affiliate_name}</div>
                            <div className="text-sm text-gray-500">{referral.affiliate_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{referral.customer_name}</div>
                          <div className="text-sm text-gray-500">{referral.customer_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">{referral.referral_code}</code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {currency}{referral.commission?.toFixed(2) || '0.00'}
                      </td>
                                              <td className="px-6 py-4 whitespace-nowrap">
                          {getValidationStatusBadge(referral.sharetribe_validation_status)}
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {referral.sharetribe_created_at ? 
                          formatDate(referral.sharetribe_created_at) : 
                          <span className="text-gray-400">Not synced</span>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={async () => {
                              try {
                                const { data: { session } } = await supabase().auth.getSession();
                                const token = session?.access_token;
                                
                                const response = await fetch('/api/sync-sharetribe-stats', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    ...(token && { 'Authorization': `Bearer ${token}` })
                                  },
                                  body: JSON.stringify({
                                    referralId: referral.id,
                                    userEmail: referral.customer_email
                                  })
                                });
                                
                                const data = await response.json();
                                if (data.success) {
                                  alert('ShareTribe stats synced successfully!');
                                  fetchReferrals(); // Refresh the data
                                } else {
                                  alert('Sync failed: ' + data.message);
                                }
                              } catch (error) {
                                console.error('Sync error:', error);
                                alert('Sync error: ' + error);
                              }
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Sync ShareTribe Stats"
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const { data: { session } } = await supabase().auth.getSession();
                                const token = session?.access_token;
                                
                                const response = await fetch('/api/debug-sync-failure', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    ...(token && { 'Authorization': `Bearer ${token}` })
                                  },
                                  body: JSON.stringify({
                                    referralId: referral.id,
                                    userEmail: referral.customer_email
                                  })
                                });
                                
                                const data = await response.json();
                                if (data.success) {
                                  alert('Debug sync completed successfully!\n\nCheck console for detailed logs.');
                                  fetchReferrals(); // Refresh the data
                                } else {
                                  alert('Debug sync failed: ' + data.message + '\n\n' + JSON.stringify(data, null, 2));
                                }
                              } catch (error) {
                                console.error('Debug sync error:', error);
                                alert('Debug sync error: ' + error);
                              }
                            }}
                            className="text-orange-600 hover:text-orange-900"
                            title="Debug Sync Failure"
                          >
                            🔍
                          </button>
                          <button
                            onClick={() => {/* TODO: View referral details */}}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {/* TODO: Edit referral */}}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {/* TODO: Delete referral */}}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 