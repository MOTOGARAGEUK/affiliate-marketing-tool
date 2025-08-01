'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { Affiliate } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import CopyButton from '@/components/CopyButton';

export default function Affiliates() {
  const { user } = useAuth();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [deletingAffiliate, setDeletingAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('GBP'); // Default currency
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load data on component mount
  useEffect(() => {
    fetchData();
    fetchCurrencySettings();
  }, []);

  // Refresh data when settings change
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'settings-updated') {
        console.log('Settings updated, refreshing affiliate data...');
        fetchData();
      }
    };

    const handleReferralLinksUpdated = () => {
      console.log('Referral links updated event received, refreshing affiliate data...');
      fetchData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('referral-links-updated', handleReferralLinksUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('referral-links-updated', handleReferralLinksUpdated);
    };
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
      
      console.log('=== FETCH DATA DEBUG ===');
      console.log('Affiliates response:', affiliatesData);
      console.log('Programs response:', programsData);
      
      if (affiliatesData.success) {
        console.log('Affiliates data:', affiliatesData.affiliates);
        // Log each affiliate's referral link
        affiliatesData.affiliates?.forEach((affiliate: any, index: number) => {
          console.log(`Affiliate ${index + 1}:`, {
            id: affiliate.id,
            name: affiliate.name,
            referral_link: affiliate.referral_link,
            referralLink: affiliate.referralLink,
            created_at: affiliate.created_at,
            createdAt: affiliate.createdAt
          });
        });
        setAffiliates(affiliatesData.affiliates);
      }
      
      if (programsData.success) {
        setPrograms(programsData.programs);
      }
      
      console.log('=== END FETCH DATA DEBUG ===');
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
        alert('Affiliate created successfully! The referral link has been generated.');
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
      console.log('=== DELETE AFFILIATE DEBUG ===');
      console.log('Deleting affiliate ID:', id);
      
      setIsDeleting(true);
      const { data: { session } } = await supabase().auth.getSession();
      const token = session?.access_token;
      
      console.log('Session exists:', !!session);
      console.log('Token exists:', !!token);
      
      const response = await fetch(`/api/affiliates/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        console.log('✅ Affiliate deleted successfully');
        // Remove the affiliate from local state immediately for better UX
        setAffiliates(prevAffiliates => prevAffiliates.filter(aff => aff.id !== id));
        setDeletingAffiliate(null);
        // Also refresh data from database to ensure consistency
        await fetchData();
      } else {
        console.error('❌ Failed to delete affiliate:', data.message);
        alert(`Failed to delete affiliate: ${data.message}`);
      }
    } catch (error) {
      console.error('❌ Error deleting affiliate:', error);
      alert(`Error deleting affiliate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
      console.log('=== END DELETE AFFILIATE DEBUG ===');
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
                  Referral Link
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Referrals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Earnings
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 truncate max-w-16" title={affiliate.referral_link || ''}>
                        {affiliate.referral_link && affiliate.referral_link.length > 20 
                          ? affiliate.referral_link.substring(0, 20) + '...' 
                          : affiliate.referral_link || 'No link'
                        }
                      </span>
                      <CopyButton
                        text={affiliate.referral_link || ''}
                        size="sm"
                        className="flex-shrink-0"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{affiliate.total_referrals || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(affiliate.total_earnings || 0, currency)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(affiliate.created_at || new Date().toISOString())}</div>
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
                        onClick={() => setDeletingAffiliate(affiliate)}
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
          currency={currency}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingAffiliate && (
        <div className="fixed inset-0 bg-white bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white/90 backdrop-blur-sm">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete the affiliate <strong>"{deletingAffiliate.name}"</strong>?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeletingAffiliate(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteAffiliate(deletingAffiliate.id)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isDeleting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
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
    programId: affiliate?.program_id || '',
  });
  const [marketplaceUrl, setMarketplaceUrl] = useState('https://marketplace.com');
  const [emailError, setEmailError] = useState('');
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || emailError || isValidatingEmail) return; // Prevent submission while loading or if email has errors
    onSubmit(formData);
  };

  const validateEmail = async (email: string) => {
    if (!email) {
      setEmailError('');
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsValidatingEmail(true);
    setEmailError('');

    try {
      const { data: { session } } = await supabase().auth.getSession();
      const token = session?.access_token;
      
      if (token) {
        const response = await fetch('/api/validate-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email: email.toLowerCase().trim() })
        });
        
        const data = await response.json();
        
        if (!data.success) {
          setEmailError(data.message || 'This email is already in use');
        } else {
          setEmailError('');
        }
      }
    } catch (error) {
      console.error('Error validating email:', error);
      setEmailError('Error checking email availability');
    } finally {
      setIsValidatingEmail(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData({ ...formData, email });
    
    // Clear error when user starts typing
    if (emailError) {
      setEmailError('');
    }
    
    // Debounce email validation
    const timeoutId = setTimeout(() => {
      validateEmail(email);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

  // Fetch marketplace URL when component mounts
  useEffect(() => {
    const fetchMarketplaceUrl = async () => {
      try {
        console.log('=== MARKETPLACE URL DEBUG ===');
        const { data: { session } } = await supabase().auth.getSession();
        const token = session?.access_token;
        
        console.log('Session exists:', !!session);
        console.log('Token exists:', !!token);
        
        if (token) {
          const response = await fetch('/api/test-settings', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          
          console.log('Test settings response:', data);
          
          if (data.success && data.marketplace_url) {
            console.log('✅ Using marketplace URL:', data.marketplace_url);
            setMarketplaceUrl(data.marketplace_url);
          } else {
            console.log('❌ No marketplace URL found in settings');
            console.log('Available settings:', data);
          }
        }
        console.log('=== END MARKETPLACE URL DEBUG ===');
      } catch (error) {
        console.error('Error fetching marketplace URL:', error);
      }
    };
    
    fetchMarketplaceUrl();
  }, []);

  // Get selected program details
  const selectedProgram = programs.find(p => p.id === formData.programId);

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
                className="mt-1 block w-full form-input"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={handleEmailChange}
                className={`mt-1 block w-full form-input ${
                  emailError ? 'border-red-300' : ''
                }`}
                required
                disabled={isLoading}
              />
              {isValidatingEmail && (
                <p className="mt-1 text-sm text-blue-600">Checking email availability...</p>
              )}
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
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
                className="mt-1 block w-full form-select"
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
            
            {/* Show referral link for both new and existing affiliates */}
            <div className="bg-gray-50 p-3 rounded-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">Generated Referral Link</label>
              <div className="flex items-center space-x-2">
                <input
                  readOnly
                  className="flex-1 text-sm bg-white border border-gray-300 rounded px-2 py-1 font-mono"
                  type="text"
                  value={(() => {
                    if (affiliate?.referral_link) {
                      return affiliate.referral_link;
                    }
                    if (formData.name && formData.programId) {
                      const selectedProgram = programs.find(p => p.id === formData.programId);
                      const referralCode = `${formData.name.toUpperCase().replace(/\s+/g, '')}${Math.floor(Math.random() * 1000)}`;
                      
                      if (selectedProgram?.type === 'signup') {
                        // For signup programs, use the marketplace URL with signup path and UTM parameters
                        const cleanUrl = marketplaceUrl.replace(/\/+$/, '');
                        return `${cleanUrl}/signup?utm_source=affiliate&utm_medium=referral&utm_campaign=${referralCode}`;
                      } else {
                        // For purchase programs, use the marketplace URL with UTM parameters
                        const cleanUrl = marketplaceUrl.replace(/\/+$/, '');
                        return `${cleanUrl}?utm_source=affiliate&utm_medium=referral&utm_campaign=${referralCode}`;
                      }
                    }
                    return 'Enter affiliate name and select program to generate link';
                  })()}
                />
                <CopyButton
                  text={(() => {
                    if (affiliate?.referral_link) {
                      return affiliate.referral_link;
                    }
                    if (formData.name && formData.programId) {
                      const selectedProgram = programs.find(p => p.id === formData.programId);
                      const referralCode = `${formData.name.toUpperCase().replace(/\s+/g, '')}${Math.floor(Math.random() * 1000)}`;
                      
                      if (selectedProgram?.type === 'signup') {
                        // For signup programs, use the marketplace URL with signup path and UTM parameters
                        const cleanUrl = marketplaceUrl.replace(/\/+$/, '');
                        return `${cleanUrl}/signup?utm_source=affiliate&utm_medium=referral&utm_campaign=${referralCode}`;
                      } else {
                        // For purchase programs, use the marketplace URL with UTM parameters
                        const cleanUrl = marketplaceUrl.replace(/\/+$/, '');
                        return `${cleanUrl}?utm_source=affiliate&utm_medium=referral&utm_campaign=${referralCode}`;
                      }
                    }
                    return '';
                  })()}
                  disabled={!formData.name || !formData.programId}
                  size="sm"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {affiliate ? 'This is the affiliate\'s referral link' : 'This link will be generated automatically when the affiliate is created'}
              </p>
            </div>
            
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
                disabled={isLoading || !!emailError || isValidatingEmail}
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
  currency?: string;
}

function ViewAffiliateModal({ affiliate, programs, onClose, currency = 'GBP' }: ViewAffiliateModalProps) {

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
                <p className="mt-1 text-sm text-gray-900 font-mono">{affiliate.referral_code}</p>
                <CopyButton
                  text={affiliate.referral_code}
                  size="sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Referral Link</label>
              <div className="flex items-center space-x-2">
                <p className="mt-1 text-sm text-gray-900 font-mono break-all">{affiliate.referral_link}</p>
                <CopyButton
                  text={affiliate.referral_link}
                  size="sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Referrals</label>
              <p className="mt-1 text-sm text-gray-900">{affiliate.total_referrals}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Earnings</label>
              <p className="mt-1 text-sm text-gray-900">{formatCurrency(affiliate.total_earnings, currency)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Program</label>
              <p className="mt-1 text-sm text-gray-900">
                {(() => {
                  const program = programs.find(p => p.id === affiliate.program_id);
                  return program ? program.name : 'N/A';
                })()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Commission</label>
              <p className="mt-1 text-sm text-gray-900">
                {(() => {
                  const program = programs.find(p => p.id === affiliate.program_id);
                  return program ? `${program.commission}${program.commissionType === 'percentage' ? '%' : '$'} per ${program.type === 'signup' ? 'signup' : 'purchase'}` : 'N/A';
                })()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Joined</label>
              <p className="mt-1 text-sm text-gray-900">{formatDate(affiliate.created_at)}</p>
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
