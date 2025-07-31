'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { Affiliate } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function Affiliates() {
  const { user } = useAuth();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('$'); // Default currency
  const [isCreating, setIsCreating] = useState(false);

  // Load data on component mount
  useEffect(() => {
    fetchData();
    fetchCurrencySettings();
  }, []);

  const fetchCurrencySettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.success && data.settings?.general?.currency) {
        const currencyCode = data.settings.general.currency;
        // Map currency codes to symbols
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

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get auth token for API request
      const { data: { session } } = await supabase().auth.getSession();
      const token = session?.access_token;
      
      const [affiliatesResponse, programsResponse] = await Promise.all([
        fetch('/api/affiliates', {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        }),
        fetch('/api/programs')
      ]);
      
      const affiliatesData = await affiliatesResponse.json();
      const programsData = await programsResponse.json();
      
      if (affiliatesData.success) {
        setAffiliates(affiliatesData.affiliates);
      }
      
      if (programsData.success) {
        setPrograms(programsData.programs);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAffiliate = async (affiliateData: Partial<Affiliate>) => {
    if (isCreating) return; // Prevent multiple submissions
    
    setIsCreating(true);
    try {
      // Get auth token for API request
      const { data: { session } } = await supabase().auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/affiliates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(affiliateData),
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchData(); // Refresh the list
        setShowCreateModal(false);
      } else {
        console.error('Failed to create affiliate:', data.message);
        alert('Failed to create affiliate: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to create affiliate:', error);
      alert('Failed to create affiliate. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditAffiliate = async (affiliateData: Partial<Affiliate>) => {
    if (!editingAffiliate) return;
    
    try {
      const response = await fetch(`/api/affiliates/${editingAffiliate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(affiliateData),
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchData(); // Refresh the list
        setEditingAffiliate(null);
      }
    } catch (error) {
      console.error('Failed to update affiliate:', error);
    }
  };

  const handleDeleteAffiliate = async (id: string) => {
    try {
      const response = await fetch(`/api/affiliates/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchData(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to delete affiliate:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Affiliates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your affiliate partners and their performance
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Affiliate
        </button>
      </div>

      {/* Affiliates Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden table-container">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Loading affiliates...</span>
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referrals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Earnings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referral Link
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {affiliates.map((affiliate) => (
                <tr key={affiliate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">
                            {affiliate.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{affiliate.name}</div>
                        <div className="text-sm text-gray-500">{affiliate.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(affiliate.status)}`}>
                      {affiliate.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {affiliate.totalReferrals}
                  </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {affiliate.totalEarnings ? `${currency}${affiliate.totalEarnings}` : `${currency}0`}
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(() => {
                      const program = programs.find(p => p.id === affiliate.programId);
                      if (!program) return 'N/A';
                      
                      return (
                        <div>
                          <div>{program.name}</div>
                          <div className="text-gray-500">
                            {program.commissionType === 'percentage' ? `${program.commission}%` : `${currency}${program.commission}`}
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {affiliate.referral_link ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 truncate max-w-32">
                          {affiliate.referral_link}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(affiliate.referral_link);
                            alert('Referral link copied to clipboard!');
                          }}
                          className="text-xs px-2 py-1 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded"
                        >
                          Copy
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No link</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(affiliate.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setSelectedAffiliate(affiliate)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingAffiliate(affiliate)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAffiliate(affiliate.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingAffiliate) && (
        <AffiliateModal
          affiliate={editingAffiliate}
          programs={programs}
          onClose={() => {
            setShowCreateModal(false);
            setEditingAffiliate(null);
          }}
          onSubmit={editingAffiliate ? handleEditAffiliate : handleCreateAffiliate}
          currency={currency}
          isLoading={isCreating}
        />
      )}

      {/* View Affiliate Modal */}
      {selectedAffiliate && (
        <ViewAffiliateModal
          affiliate={selectedAffiliate}
          programs={programs}
          onClose={() => setSelectedAffiliate(null)}
        />
      )}
    </div>
  );
}

interface AffiliateModalProps {
  affiliate?: Affiliate | null;
  programs: any[];
  onClose: () => void;
  onSubmit: (data: Partial<Affiliate>) => void;
  currency?: string;
  isLoading?: boolean;
}

function AffiliateModal({ affiliate, programs, onClose, onSubmit, currency = '$', isLoading = false }: AffiliateModalProps) {
  const [formData, setFormData] = useState({
    name: affiliate?.name || '',
    email: affiliate?.email || '',
    phone: affiliate?.phone || '',
    status: (affiliate?.status || 'pending') as 'active' | 'inactive' | 'pending',
    programId: affiliate?.programId || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent submission while loading
    onSubmit(formData);
  };

  // Get selected program details
  const selectedProgram = programs.find(p => p.id === formData.programId);
  
  // Generate preview referral link for new affiliates
  const previewReferralCode = affiliate ? affiliate.referralCode : `${formData.name.toUpperCase().replace(/\s+/g, '')}${Math.floor(Math.random() * 1000)}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marketplace.com';
  const previewReferralLink = affiliate ? affiliate.referralLink : `https://marketplace.com/ref/${previewReferralCode}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white/90 backdrop-blur-sm">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {affiliate ? 'Edit Affiliate' : 'Add New Affiliate'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3 text-gray-900 bg-white"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3 text-gray-900 bg-white"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3 text-gray-900 bg-white"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'pending' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3 text-gray-900 bg-white"
                disabled={isLoading}
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Program</label>
              <select
                value={formData.programId}
                onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3 text-gray-900 bg-white"
                required
                disabled={isLoading}
              >
                <option value="">Select a program</option>
                {programs.filter(p => p.status === 'active').map(program => (
                  <option key={program.id} value={program.id}>
                    {program.name} - {program.commissionType === 'percentage' ? `${program.commission}%` : `${currency}${program.commission}`}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Show referral link if editing existing affiliate */}
            {affiliate?.referral_link && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Referral Link</label>
                <div className="mt-1 flex items-center space-x-2">
                  <input
                    type="text"
                    value={affiliate.referral_link}
                    readOnly
                    className="flex-1 rounded-md border-gray-300 shadow-sm px-4 py-3 text-gray-900 bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(affiliate.referral_link);
                      alert('Referral link copied to clipboard!');
                    }}
                    className="px-3 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
            
            {/* Show program commission details */}
            {selectedProgram && (
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-1">Program Details</h4>
                <p className="text-sm text-blue-800">
                  <strong>Commission:</strong> {selectedProgram.commissionType === 'percentage' ? `${selectedProgram.commission}%` : `${currency}${selectedProgram.commission}`} per {selectedProgram.type === 'signup' ? 'signup' : 'purchase'}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Type:</strong> {selectedProgram.type === 'signup' ? 'Sign Up Referrals' : 'Purchase Referrals'}
                </p>
              </div>
            )}
            
            {/* Show referral link preview for new affiliates */}
            {!affiliate && formData.name && (
              <div className="bg-gray-50 p-3 rounded-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">Generated Referral Link</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={previewReferralLink}
                    readOnly
                    className="flex-1 text-sm bg-white border border-gray-300 rounded px-2 py-1 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(previewReferralLink)}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This link will be generated automatically when the affiliate is created
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {affiliate ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface ViewAffiliateModalProps {
  affiliate: Affiliate;
  programs: any[];
  onClose: () => void;
}

function ViewAffiliateModal({ affiliate, programs, onClose }: ViewAffiliateModalProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white/90 backdrop-blur-sm">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Affiliate Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1 text-sm text-gray-900">{affiliate.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{affiliate.email}</p>
            </div>
            {affiliate.phone && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{affiliate.phone}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Referral Code</label>
              <div className="flex items-center space-x-2">
                <p className="mt-1 text-sm text-gray-900 font-mono">{affiliate.referralCode}</p>
                <button
                  onClick={() => copyToClipboard(affiliate.referralCode)}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Copy
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Referral Link</label>
              <div className="flex items-center space-x-2">
                <p className="mt-1 text-sm text-gray-900 font-mono break-all">{affiliate.referralLink}</p>
                <button
                  onClick={() => copyToClipboard(affiliate.referralLink)}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Copy
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Referrals</label>
              <p className="mt-1 text-sm text-gray-900">{affiliate.totalReferrals}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Earnings</label>
              <p className="mt-1 text-sm text-gray-900">{formatCurrency(affiliate.totalEarnings)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Program</label>
              <p className="mt-1 text-sm text-gray-900">
                {(() => {
                  const program = programs.find(p => p.id === affiliate.programId);
                  return program ? program.name : 'N/A';
                })()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Commission</label>
              <p className="mt-1 text-sm text-gray-900">
                {(() => {
                  const program = programs.find(p => p.id === affiliate.programId);
                  return program ? `${program.commission}${program.commissionType === 'percentage' ? '%' : '$'} per ${program.type === 'signup' ? 'signup' : 'purchase'}` : 'N/A';
                })()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Joined</label>
                              <p className="mt-1 text-sm text-gray-900">{formatDate(affiliate.createdAt)}</p>
            </div>
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
