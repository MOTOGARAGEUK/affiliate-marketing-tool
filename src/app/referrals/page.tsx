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
}

export default function Referrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('$');

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
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track all referrals made by your affiliates
          </p>
        </div>
        <div className="flex space-x-2">
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
              try {
                const { data: { session } } = await supabase().auth.getSession();
                const token = session?.access_token;
                
                const response = await fetch('/api/sync-all-referrals', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                  }
                });
                const data = await response.json();
                if (data.success) {
                  alert(`Live sync completed!\n\nSynced: ${data.syncedCount}\nUpdated: ${data.updatedCount}\nErrors: ${data.errorCount || 0}\n\nDetails: ${JSON.stringify(data.details, null, 2)}`);
                  fetchReferrals(); // Refresh the data
                } else {
                  // Check if it's a "no users found" case vs actual failure
                  if (data.message && data.message.includes('no users found')) {
                    console.log('🔄 Live Sync Results:', data);
                    console.log('📊 Summary:', data.summary);
                    console.log('📋 Details:', data.details);
                    if (data.errors && data.errors.length > 0) {
                      console.log('❌ Errors:', data.errors);
                    }
                    alert(`Live sync completed!\n\n${data.message}\n\nSynced: ${data.syncedCount}\nUpdated: ${data.updatedCount}\nErrors: ${data.errorCount || 0}\n\nCheck console for detailed results.`);
                  } else {
                    console.log('❌ Live Sync Failed:', data);
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Listings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referrals.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
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
                  referrals.map((referral) => (
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
                        {getStatusBadge(referral.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {referral.sharetribe_created_at ? 
                          formatDate(referral.sharetribe_created_at) : 
                          <span className="text-gray-400">Not synced</span>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {referral.listings_count !== undefined ? 
                          referral.listings_count : 
                          <span className="text-gray-400">-</span>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {referral.transactions_count !== undefined ? 
                          referral.transactions_count : 
                          <span className="text-gray-400">-</span>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {referral.total_revenue !== undefined ? 
                          `${currency}${referral.total_revenue.toFixed(2)}` : 
                          <span className="text-gray-400">-</span>
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