'use client';

import { useState, useEffect } from 'react';
import {
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { settingsAPI } from '@/lib/settings-database';
import { formatCurrency } from '@/lib/utils';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('GBP');
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        // Get auth token for API request
        const { data: { session } } = await supabase().auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          console.log('No auth token, skipping dashboard data fetch');
          return;
        }

        // Fetch user settings for currency
        const settings = await settingsAPI.getByType(user.id, 'general');
        const currencySetting = settings.find(s => s.setting_key === 'currency');
        const userCurrency = (currencySetting?.setting_value as string) || 'GBP';
        setCurrency(userCurrency);

        // Fetch dashboard data from API
        const response = await fetch('/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch dashboard data');
        }

        const currentStats = data.stats;
        const activityData = data.recentActivity;
        const chartDataFromAPI = data.chartData;
        
        const dashboardStats = [
          {
            name: 'Total Affiliates',
            value: currentStats.totalAffiliates,
            icon: UsersIcon,
            change: currentStats.totalAffiliates > 0 ? '+100%' : '0%',
            changeType: currentStats.totalAffiliates > 0 ? 'positive' : 'neutral',
          },
          {
            name: 'Active Affiliates',
            value: currentStats.activeAffiliates,
            icon: UsersIcon,
            change: currentStats.activeAffiliates > 0 ? '+100%' : '0%',
            changeType: currentStats.activeAffiliates > 0 ? 'positive' : 'neutral',
          },
          {
            name: 'Total Referrals',
            value: currentStats.totalReferrals,
            icon: ChartBarIcon,
            change: currentStats.totalReferrals > 0 ? '+100%' : '0%',
            changeType: currentStats.totalReferrals > 0 ? 'positive' : 'neutral',
          },
          {
            name: 'Total Revenue',
            value: formatCurrency(0, userCurrency as string),
            icon: CurrencyDollarIcon,
            change: '0%',
            changeType: 'neutral',
          },
          {
            name: 'Total Payouts',
            value: formatCurrency(currentStats.totalEarnings, userCurrency as string),
            icon: CurrencyDollarIcon,
            change: currentStats.totalEarnings > 0 ? '+100%' : '0%',
            changeType: currentStats.totalEarnings > 0 ? 'positive' : 'neutral',
          },
          {
            name: 'Pending Payouts',
            value: formatCurrency(currentStats.pendingPayouts, userCurrency as string),
            icon: CreditCardIcon,
            change: currentStats.pendingPayouts > 0 ? '+100%' : '0%',
            changeType: currentStats.pendingPayouts > 0 ? 'positive' : 'neutral',
          },
        ];
        
        setStats(dashboardStats);
        setRecentActivity(activityData || []);
        setChartData(chartDataFromAPI || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Overview of your affiliate marketing performance
            </p>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500">Loading dashboard data...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your affiliate marketing performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {stats.map((item) => (
            <div
              key={item.name}
              className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 dashboard-card min-h-[120px]"
            >
              <dt>
                {/* <div className="absolute rounded-md bg-indigo-500 p-3">
                  <item.icon className="h-6 w-6 text-white" />
                </div> */}
                <p className="truncate text-sm font-medium text-gray-500">{item.name}</p>
              </dt>
              <dd className="flex items-baseline flex-wrap">
                <p className="text-2xl font-semibold text-gray-900 mr-2">{item.value}</p>
                <p
                  className={`flex items-baseline text-sm font-semibold whitespace-nowrap ${
                    item.changeType === 'positive'
                      ? 'text-green-600'
                      : item.changeType === 'negative'
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }`}
                >
                  {item.change}
                </p>
              </dd>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow dashboard-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Referrals, Revenue & Earnings</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'referrals' ? value : formatCurrency(value, currency as string),
                    name === 'referrals' ? 'Referrals' : name === 'earnings' ? 'Earnings' : 'Revenue'
                  ]}
                />
                <Line type="monotone" dataKey="referrals" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} />
                <Line type="monotone" dataKey="earnings" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dashboard-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <CurrencyDollarIcon className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(activity.amount || 0, currency as string)} from {activity.programName}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
