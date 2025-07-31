'use client';

import { useState } from 'react';
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import { mockPayouts, mockAffiliates } from '@/lib/mockData';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';

export default function Payouts() {
  const [payouts, setPayouts] = useState(mockPayouts);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);

  const handleCreatePayout = (payoutData: any) => {
    const newPayout = {
      id: Date.now().toString(),
      ...payoutData,
      status: 'pending',
      reference: `PAY-${Date.now()}`,
      createdAt: new Date(),
    };
    setPayouts([...payouts, newPayout]);
    setShowCreateModal(false);
  };

  const getAffiliateName = (affiliateId: string) => {
    const affiliate = mockAffiliates.find(a => a.id === affiliateId);
    return affiliate ? affiliate.name : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage affiliate payouts and payment processing
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Payout
        </button>
      </div>

      {/* Payouts Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Affiliate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getAffiliateName(payout.affiliateId)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(payout.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">
                      {payout.method.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payout.status)}`}>
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">
                      {payout.reference}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(payout.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedPayout(payout)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Payout Modal */}
      {showCreateModal && (
        <CreatePayoutModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePayout}
        />
      )}

      {/* View Payout Modal */}
      {selectedPayout && (
        <ViewPayoutModal
          payout={selectedPayout}
          affiliateName={getAffiliateName(selectedPayout.affiliateId)}
          onClose={() => setSelectedPayout(null)}
        />
      )}
    </div>
  );
}

function CreatePayoutModal({ onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    affiliateId: '',
    amount: 0,
    method: 'bank_transfer',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Payout</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Affiliate</label>
              <select
                value={formData.affiliateId}
                onChange={(e) => setFormData({ ...formData, affiliateId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="">Select an affiliate</option>
                {mockAffiliates.map((affiliate) => (
                  <option key={affiliate.id} value={affiliate.id}>
                    {affiliate.name} - {formatCurrency(affiliate.totalEarnings)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                Create Payout
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ViewPayoutModal({ payout, affiliateName, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payout Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Affiliate</label>
              <p className="mt-1 text-sm text-gray-900">{affiliateName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <p className="mt-1 text-sm text-gray-900">{formatCurrency(payout.amount)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <p className="mt-1 text-sm text-gray-900 capitalize">{payout.method.replace('_', ' ')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <p className="mt-1 text-sm text-gray-900">{payout.status}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reference</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">{payout.reference}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Created</label>
              <p className="mt-1 text-sm text-gray-900">{formatDate(payout.createdAt)}</p>
            </div>
            {payout.processedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Processed</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(payout.processedAt)}</p>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
