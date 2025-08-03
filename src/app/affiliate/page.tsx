'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  CreditCardIcon, 
  ArrowPathIcon,
  GiftIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '@/lib/utils';

interface AffiliateStats {
  totalReferrals: number;
  verifiedReferrals: number;
  totalEarnings: number;
  pendingPayouts: number;
  recentReferrals: any[];
}

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AffiliateStats>({
    totalReferrals: 0,
    verifiedReferrals: 0,
    totalEarnings: 0,
    pendingPayouts: 0,
    recentReferrals: []
  });
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('GBP');

  useEffect(() => {
    if (user) {
      fetchAffiliateStats();
      fetchCurrencySettings();
    }
  }, [user]);

  const fetchCurrencySettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.success && data.settings?.general?.currency) {
        setCurrency(data.settings.general.currency);
      }
    } catch (error) {
      console.error('Failed to fetch currency settings:', error);
    }
  };

  const fetchAffiliateStats = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase().auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        console.log('No auth token, skipping stats fetch');
        return;
      }

      const response = await fetch('/api/affiliate/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch affiliate stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Referrals',
      value: stats.totalReferrals,
      icon: UserGroupIcon,
      change: '+12%',
      changeType: 'positive' as 'positive' | 'negative' | 'neutral',
    },
    {
      name: 'Verified Referrals',
      value: stats.verifiedReferrals,
      icon: ChartBarIcon,
      change: '+8%',
      changeType: 'positive' as 'positive' | 'negative' | 'neutral',
    },
    {
      name: 'Total Earnings',
      value: formatCurrency(stats.totalEarnings, currency),
      icon: CreditCardIcon,
      change: '+15%',
      changeType: 'positive' as 'positive' | 'negative' | 'neutral',
    },
    {
      name: 'Pending Payouts',
      value: formatCurrency(stats.pendingPayouts, currency),
      icon: GiftIcon,
      change: '0%',
      changeType: 'neutral' as 'positive' | 'negative' | 'neutral',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Affiliate Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back! Here's your performance overview.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchAffiliateStats}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh
              </button>
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((item) => (
            <div
              key={item.name}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <item.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {item.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {item.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <span className={`font-medium ${
                    item.changeType === 'positive' ? 'text-green-600' : 
                    item.changeType === 'negative' ? 'text-red-600' : 
                    'text-gray-500'
                  }`}>
                    {item.change}
                  </span>
                  <span className="text-gray-500"> from last month</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Referrals */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Referrals
              </h3>
              {stats.recentReferrals.length > 0 ? (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Commission
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.recentReferrals.map((referral) => (
                        <tr key={referral.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {referral.customer_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {referral.customer_email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              referral.sharetribe_validation_status === 'green' 
                                ? 'bg-green-100 text-green-800'
                                : referral.sharetribe_validation_status === 'amber'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {referral.sharetribe_validation_status === 'green' ? 'Verified' :
                               referral.sharetribe_validation_status === 'amber' ? 'Unverified' :
                               'Invalid'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(referral.commission, currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(referral.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No referrals yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start sharing your referral links to see your referrals here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 