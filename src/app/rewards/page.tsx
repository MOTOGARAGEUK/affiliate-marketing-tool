'use client';

import { useState, useEffect } from 'react';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { formatDate, getStatusColor } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Rewards() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('GBP');

  useEffect(() => {
    fetchRewards();
    fetchCurrencySettings();
  }, []);

  const fetchCurrencySettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.success && data.settings?.general?.currency) {
        const currencyCode = data.settings.general.currency;
        setCurrency(currencyCode);
      }
    } catch (error) {
      console.error('Failed to fetch currency settings:', error);
    }
  };

  const fetchRewards = async () => {
    try {
      setLoading(true);
      
      // Get auth token for API request
      const { data: { session } } = await supabase().auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        console.log('No auth token, skipping rewards fetch');
        return;
      }

      const response = await fetch('/api/rewards', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch rewards data');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch rewards data');
      }

      setRewards(data.rewards || []);
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (rewardId: string) => {
    try {
      const { data: { session } } = await supabase().auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch(`/api/rewards/${rewardId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchRewards(); // Refresh the list
        alert('Reward claimed successfully!');
      } else {
        alert('Failed to claim reward: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to claim reward:', error);
      alert('Failed to claim reward. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'qualified':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'claimed':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'expired':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'qualified':
        return 'Qualified for Reward';
      case 'pending':
        return 'Pending Qualification';
      case 'claimed':
        return 'Reward Claimed';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rewards</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track affiliate rewards and qualifications
            </p>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500">Loading rewards data...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rewards</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track affiliate rewards and qualifications
          </p>
        </div>

        {/* Rewards Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {rewards.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No rewards yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Affiliates will appear here when they qualify for reward programs.
              </p>
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
                      Program
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referrals
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qualified Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rewards.map((reward) => (
                    <tr key={reward.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-600">
                                {reward.affiliate.name.split(' ').map((n: string) => n[0]).join('')}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{reward.affiliate.name}</div>
                            <div className="text-sm text-gray-500">{reward.affiliate.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{reward.program.name}</div>
                        <div className="text-sm text-gray-500">Target: {reward.program.referral_target} referrals</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{reward.verified_referrals}</div>
                        <div className="text-sm text-gray-500">verified</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{reward.program.referral_target}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(reward.status)}
                          <span className="ml-2 text-sm text-gray-900">
                            {getStatusText(reward.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {reward.qualified_at ? formatDate(reward.qualified_at) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {reward.status === 'qualified' && (
                          <button
                            onClick={() => handleClaimReward(reward.id)}
                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md text-sm font-medium"
                          >
                            Claim Reward
                          </button>
                        )}
                        {reward.status === 'claimed' && (
                          <span className="text-green-600 text-sm">Claimed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 