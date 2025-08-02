'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function Payouts() {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('unpaid');

  useEffect(() => {
    fetchPayouts();
  }, [user]);

  const fetchPayouts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get auth token for API request
      const { data: { session } } = await supabase().auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        console.log('No auth token, skipping payouts fetch');
        return;
      }

      const response = await fetch('/api/payouts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch payouts');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch payouts');
      }

      setPayouts(data.payouts);
      setSummary(data.summary);
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayout = async (payoutData: any) => {
    try {
      // Validate amount
      const amount = parseFloat(payoutData.amount);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount greater than 0');
        return;
      }

      // Validate against outstanding amount
      const selectedPayout = payouts.find(p => p.affiliateId === payoutData.affiliateId);
      if (selectedPayout && amount > selectedPayout.amount) {
        alert(`Cannot pay more than what is owed. Maximum payout amount is ${formatCurrency(selectedPayout.amount)}`);
        return;
      }

      // Get auth token for API request
      const { data: { session } } = await supabase().auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        console.log('No auth token, skipping payout creation');
        return;
      }

      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...payoutData,
          amount: amount
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create payout');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create payout');
      }

      // Refresh the payouts data
      await fetchPayouts();
      setShowCreateModal(false);
      
      // Show success message
      alert('Payout created successfully!');
    } catch (error) {
      console.error('Failed to create payout:', error);
      alert('Failed to create payout: ' + error);
    }
  };

  const getAffiliateName = (affiliateId: string) => {
    const payout = payouts.find(p => p.affiliateId === affiliateId);
    return payout ? payout.affiliateName : 'Unknown';
  };

  // Filter payouts based on status
  const filteredPayouts = payouts.filter(payout => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'unpaid') return payout.amount > 0;
    if (statusFilter === 'paid') return payout.amount === 0;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage affiliate payouts and payment processing
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-red-600 font-medium">
              Total Payouts Unpaid: {formatCurrency(summary.totalPayoutsOwed)}
            </p>
            <p className="text-sm text-green-600 font-medium">
              Total Payouts Paid: {formatCurrency(summary.totalPayoutsPaid || 0)}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Payout
        </button>
      </div>

      {/* Filter Controls */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'unpaid' | 'paid')}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Payouts</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden table-container">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Loading payouts...</span>
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
                    Total Earnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outstanding
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referrals
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        {statusFilter === 'all' ? 'No payouts due' : `No ${statusFilter} payouts`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {statusFilter === 'all' 
                          ? 'Affiliates will appear here when they have approved referrals and earnings'
                          : `No ${statusFilter} payouts found with current filter`
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payout.affiliateName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payout.verifiedReferrals} verified referrals
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(payout.totalEarnings)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(payout.totalPaid)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      payout.amount > 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {formatCurrency(payout.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      payout.amount > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {payout.amount > 0 ? 'Unpaid' : 'Paid'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {payout.verifiedReferrals} verified
                    </div>
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
              ))
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Create Payout Modal */}
      {showCreateModal && (
        <CreatePayoutModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePayout}
          payouts={payouts.filter(payout => payout.amount > 0)}
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

function CreatePayoutModal({ onClose, onSubmit, payouts }: any) {
  const [formData, setFormData] = useState({
    affiliateId: '',
    amount: '',
    method: 'bank',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bankReference, setBankReference] = useState('');
  const [affiliateBankDetails, setAffiliateBankDetails] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    // Generate a unique bank reference
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const reference = `PAY-${timestamp.slice(-6)}-${random}`;
    setBankReference(reference);
    
    setShowConfirmation(true);
  };

  const handleConfirmPayout = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await onSubmit({ ...formData, reference: bankReference });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setShowConfirmation(false);
    setBankReference('');
  };

  const handleAffiliateChange = async (affiliateId: string) => {
    const selectedPayout = payouts.find(p => p.affiliateId === affiliateId);
    setFormData({
      ...formData,
      affiliateId,
      amount: selectedPayout ? selectedPayout.amount.toString() : ''
    });

    // Fetch affiliate bank details if affiliate is selected
    if (affiliateId) {
      try {
        const { data: { session } } = await supabase().auth.getSession();
        const token = session?.access_token;
        
        if (token) {
          const response = await fetch(`/api/affiliates/${affiliateId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.affiliate) {
              setAffiliateBankDetails(data.affiliate);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch affiliate bank details:', error);
        setAffiliateBankDetails(null);
      }
    } else {
      setAffiliateBankDetails(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white/90 backdrop-blur-sm">
        <div className="mt-3">
          {!showConfirmation ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Payout</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Affiliate</label>
              <select
                value={formData.affiliateId}
                onChange={(e) => handleAffiliateChange(e.target.value)}
                className="mt-1 block w-full form-select disabled:opacity-50 disabled:cursor-not-allowed"
                required
                disabled={isLoading}
              >
                <option value="">Select an affiliate</option>
                {payouts.length > 0 ? (
                  payouts.map((payout) => (
                    <option key={payout.affiliateId} value={payout.affiliateId}>
                      {payout.affiliateName} - {formatCurrency(payout.amount)} owed
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No affiliates with outstanding payouts</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="mt-1 block w-full form-input disabled:opacity-50 disabled:cursor-not-allowed"
                min="0"
                step="0.01"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="mt-1 block w-full form-select disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <option value="bank">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Payout'}
              </button>
            </div>
          </form>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Payout</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Affiliate</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {payouts.find(p => p.affiliateId === formData.affiliateId)?.affiliateName}
                  </p>
                </div>
                
                {/* Bank Details Section */}
                {affiliateBankDetails && (affiliateBankDetails.bank_name || affiliateBankDetails.bank_account_name || affiliateBankDetails.bank_account_number) && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Bank Details</h4>
                    <div className="space-y-3">
                      {affiliateBankDetails.bank_name && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                          <p className="mt-1 text-sm text-gray-900">{affiliateBankDetails.bank_name}</p>
                        </div>
                      )}
                      {affiliateBankDetails.bank_account_name && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Account Holder Name</label>
                          <p className="mt-1 text-sm text-gray-900">{affiliateBankDetails.bank_account_name}</p>
                        </div>
                      )}
                      {affiliateBankDetails.bank_account_number && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Account Number</label>
                          <p className="mt-1 text-sm text-gray-900">****{affiliateBankDetails.bank_account_number.slice(-4)}</p>
                        </div>
                      )}
                      {affiliateBankDetails.bank_sort_code && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Sort Code</label>
                          <p className="mt-1 text-sm text-gray-900">{affiliateBankDetails.bank_sort_code}</p>
                        </div>
                      )}
                      {affiliateBankDetails.bank_iban && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">IBAN</label>
                          <p className="mt-1 text-sm text-gray-900">{affiliateBankDetails.bank_iban}</p>
                        </div>
                      )}
                      {affiliateBankDetails.bank_routing_number && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Routing Number</label>
                          <p className="mt-1 text-sm text-gray-900">{affiliateBankDetails.bank_routing_number}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Amount</label>
                  <input
                    type="text"
                    value={formatCurrency(parseFloat(formData.amount) || 0)}
                    className="mt-1 block w-full form-input bg-gray-100"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bank Reference</label>
                  <input
                    type="text"
                    value={bankReference}
                    onChange={(e) => setBankReference(e.target.value.slice(0, 18))}
                    className="mt-1 block w-full form-input"
                    maxLength={18}
                    placeholder="Enter bank reference"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPayout}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ViewPayoutModal({ payout, affiliateName, onClose }: any) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        
        // Get auth token for API request
        const { data: { session } } = await supabase().auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          console.log('No auth token, skipping transaction fetch');
          return;
        }

        const response = await fetch(`/api/payouts/${payout.affiliateId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch transactions');
        }

        setTransactions(data.transactions);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [payout.affiliateId]);

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative border w-[800px] max-h-[80vh] shadow-lg rounded-md bg-white/90 backdrop-blur-sm overflow-hidden flex flex-col">
        <div className="p-5 overflow-y-auto flex-1">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction History - {affiliateName}</h3>
          
          {/* Summary Section */}
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Earnings</label>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(payout.totalEarnings)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount Paid</label>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(payout.totalPaid)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Outstanding Amount</label>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(payout.amount)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                payout.amount > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {payout.amount > 0 ? 'Unpaid' : 'Paid'}
              </span>
            </div>
          </div>

          {/* Transaction History */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Transaction History</h4>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600">Loading transactions...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction, index) => (
                  <div key={`${transaction.type}-${transaction.id}`} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        transaction.type === 'referral' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleString()}
                          {transaction.program && ` • ${transaction.program}`}
                          {transaction.reference && ` • Ref: ${transaction.reference}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{transaction.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer with Close Button */}
        <div className="p-5 border-t border-gray-200 bg-white">
          <div className="flex justify-end">
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
