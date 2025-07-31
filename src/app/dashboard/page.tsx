'use client';

import { useState, useEffect } from 'react';
import {
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mockDashboardStats } from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';

const stats = [
  {
    name: 'Total Affiliates',
    value: mockDashboardStats.totalAffiliates,
    icon: UsersIcon,
    change: '+12%',
    changeType: 'positive',
  },
  {
    name: 'Active Affiliates',
    value: mockDashboardStats.activeAffiliates,
    icon: UsersIcon,
    change: '+8%',
    changeType: 'positive',
  },
  {
    name: 'Total Referrals',
    value: mockDashboardStats.totalReferrals,
    icon: ChartBarIcon,
    change: '+15%',
    changeType: 'positive',
  },
  {
    name: 'Total Earnings',
    value: formatCurrency(mockDashboardStats.totalEarnings),
    icon: CurrencyDollarIcon,
    change: '+23%',
    changeType: 'positive',
  },
  {
    name: 'Pending Payouts',
    value: formatCurrency(mockDashboardStats.pendingPayouts),
    icon: CreditCardIcon,
    change: '+5%',
    changeType: 'neutral',
  },
];

const chartData = [
  { month: 'Jan', referrals: 45, earnings: 1200 },
  { month: 'Feb', referrals: 52, earnings: 1400 },
  { month: 'Mar', referrals: 48, earnings: 1300 },
  { month: 'Apr', referrals: 61, earnings: 1800 },
  { month: 'May', referrals: 55, earnings: 1600 },
  { month: 'Jun', referrals: 67, earnings: 2100 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your affiliate marketing performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6"
          >
            <dt>
              <div className="absolute rounded-md bg-indigo-500 p-3">
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
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
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Referrals & Earnings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="referrals" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="earnings" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <UsersIcon className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">New affiliate joined</p>
                <p className="text-sm text-gray-500">Sarah Wilson joined the program</p>
              </div>
              <div className="text-sm text-gray-500">2 hours ago</div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <CurrencyDollarIcon className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Commission earned</p>
                <p className="text-sm text-gray-500">John Doe earned $25.50</p>
              </div>
              <div className="text-sm text-gray-500">4 hours ago</div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <CreditCardIcon className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Payout processed</p>
                <p className="text-sm text-gray-500">$500 sent to Jane Smith</p>
              </div>
              <div className="text-sm text-gray-500">1 day ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
