'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { mockAffiliates, mockPrograms } from '@/lib/mockData';
import { formatCurrency, formatDate, getStatusColor, generateReferralCode, generateReferralLink } from '@/lib/utils';
import { Affiliate } from '@/types';

export default function Affiliates() {
  const [affiliates, setAffiliates] = useState(mockAffiliates);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);

  const handleCreateAffiliate = (affiliateData: Partial<Affiliate>) => {
    if (!affiliateData.name) return;
    
    const referralCode = generateReferralCode(affiliateData.name);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marketplace.com';
    const referralLink = generateReferralLink(baseUrl, referralCode);
    
    const newAffiliate: Affiliate = {
      id: Date.now().toString(),
      name: affiliateData.name,
      email: affiliateData.email || '',
      phone: affiliateData.phone || '',
      status: (affiliateData.status as 'active' | 'inactive' | 'pending') || 'pending',
      programId: affiliateData.programId || '',
      totalEarnings: 0,
      totalReferrals: 0,
      referralCode: referralCode,
      referralLink: referralLink,
      joinedAt: new Date(),
      updatedAt: new Date(),
    };
    setAffiliates([...affiliates, newAffiliate]);
    setShowCreateModal(false);
  };

  const handleEditAffiliate = (affiliateData: Partial<Affiliate>) => {
    if (!editingAffiliate) return;
    setAffiliates(affiliates.map(a => a.id === editingAffiliate.id ? { ...a, ...affiliateData, updatedAt: new Date() } : a));
    setEditingAffiliate(null);
  };

  const handleDeleteAffiliate = (id: string) => {
    setAffiliates(affiliates.filter(a => a.id !== id));
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
      <div className="bg-white shadow rounded-lg overflow-hidden">
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
                    {formatCurrency(affiliate.totalEarnings)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(() => {
                      const program = mockPrograms.find(p => p.id === affiliate.programId);
                      return program ? `${program.commission}${program.commissionType === 'percentage' ? '%' : '$'}` : 'N/A';
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(affiliate.joinedAt)}
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
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingAffiliate) && (
        <AffiliateModal
          affiliate={editingAffiliate}
          onClose={() => {
            setShowCreateModal(false);
            setEditingAffiliate(null);
          }}
          onSubmit={editingAffiliate ? handleEditAffiliate : handleCreateAffiliate}
        />
      )}

      {/* View Affiliate Modal */}
      {selectedAffiliate && (
        <ViewAffiliateModal
          affiliate={selectedAffiliate}
          onClose={() => setSelectedAffiliate(null)}
        />
      )}
    </div>
  );
}

interface AffiliateModalProps {
  affiliate?: Affiliate | null;
  onClose: () => void;
  onSubmit: (data: Partial<Affiliate>) => void;
}

function AffiliateModal({ affiliate, onClose, onSubmit }: AffiliateModalProps) {
  const [formData, setFormData] = useState({
    name: affiliate?.name || '',
    email: affiliate?.email || '',
    phone: affiliate?.phone || '',
    status: affiliate?.status || 'pending',
    programId: affiliate?.programId || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Get selected program details
  const selectedProgram = mockPrograms.find(p => p.id === formData.programId);
  
  // Generate preview referral link for new affiliates
  const previewReferralCode = affiliate ? affiliate.referralCode : generateReferralCode(formData.name);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://marketplace.com';
  const previewReferralLink = affiliate ? affiliate.referralLink : generateReferralLink(baseUrl, previewReferralCode);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="">Select a program</option>
                {mockPrograms.filter(p => p.status === 'active').map(program => (
                  <option key={program.id} value={program.id}>
                    {program.name} - {program.commission}{program.commissionType === 'percentage' ? '%' : '$'}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Show program commission details */}
            {selectedProgram && (
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-1">Program Details</h4>
                <p className="text-sm text-blue-800">
                  <strong>Commission:</strong> {selectedProgram.commission}{selectedProgram.commissionType === 'percentage' ? '%' : '$'} per {selectedProgram.type === 'signup' ? 'signup' : 'purchase'}
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
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
  onClose: () => void;
}

function ViewAffiliateModal({ affiliate, onClose }: ViewAffiliateModalProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
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
                  const program = mockPrograms.find(p => p.id === affiliate.programId);
                  return program ? program.name : 'N/A';
                })()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Commission</label>
              <p className="mt-1 text-sm text-gray-900">
                {(() => {
                  const program = mockPrograms.find(p => p.id === affiliate.programId);
                  return program ? `${program.commission}${program.commissionType === 'percentage' ? '%' : '$'} per ${program.type === 'signup' ? 'signup' : 'purchase'}` : 'N/A';
                })()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Joined</label>
              <p className="mt-1 text-sm text-gray-900">{formatDate(affiliate.joinedAt)}</p>
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
