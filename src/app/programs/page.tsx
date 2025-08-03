'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatDate, getStatusColor } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function Programs() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('$'); // Default currency
  const [rewardProgramsEnabled, setRewardProgramsEnabled] = useState(false);

  // Load programs and currency settings on component mount
  useEffect(() => {
    fetchPrograms();
    fetchCurrencySettings();
    checkRewardProgramsSetting();
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

  const checkRewardProgramsSetting = async () => {
    try {
      const { data: { session } } = await supabase().auth.getSession();
      const token = session?.access_token;
      
      if (token) {
        const response = await fetch('/api/settings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success && data.settings?.general?.enableRewardPrograms) {
          setRewardProgramsEnabled(true);
        } else {
          setRewardProgramsEnabled(false);
        }
      }
    } catch (error) {
      console.error('Failed to check reward programs setting:', error);
      setRewardProgramsEnabled(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs');
      const data = await response.json();
      if (data.success) {
        setPrograms(data.programs);
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProgram = async (programData: any) => {
    // Prevent multiple submissions
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      // Check if program with same name already exists
      const existingProgram = programs.find(p => p.name.toLowerCase() === programData.name.toLowerCase());
      if (existingProgram) {
        alert('A program with this name already exists. Please choose a different name.');
        return;
      }

      // If this is a reward program, check if migration has been run
      if (programData.type === 'reward') {
        const { data: { session } } = await supabase().auth.getSession();
        const token = session?.access_token;
        
        if (token) {
          const migrationCheck = await fetch('/api/check-reward-migration', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const migrationData = await migrationCheck.json();
          if (!migrationData.success && migrationData.migrationNeeded) {
            alert('Database migration required for reward programs. Please contact your administrator to run the migration script: add-reward-programs-support.sql');
            return;
          }
        }
      }

      // Get auth token for API request
      const { data: { session } } = await supabase().auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(programData),
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchPrograms(); // Refresh the list
        setShowCreateModal(false);
      } else {
        console.error('Failed to create program:', data.message);
        alert('Failed to create program: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to create program:', error);
      alert('Failed to create program. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingProgram, setDeletingProgram] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditProgram = async (programData: any) => {
    // Prevent multiple submissions
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      // Check if program with same name already exists (excluding current program)
      const existingProgram = programs.find(p => 
        p.id !== editingProgram.id && 
        p.name.toLowerCase() === programData.name.toLowerCase()
      );
      if (existingProgram) {
        alert('A program with this name already exists. Please choose a different name.');
        return;
      }

      // Get auth token for API request
      const { data: { session } } = await supabase().auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`/api/programs/${editingProgram.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(programData),
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchPrograms(); // Refresh the list
        setEditingProgram(null);
      } else {
        console.error('Failed to update program:', data.message);
        alert('Failed to update program: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to update program:', error);
      alert('Failed to update program. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProgram = async (id: string) => {
    if (isDeleting) return; // Prevent multiple deletions
    
    setIsDeleting(true);
    console.log('Attempting to delete program:', id);
    try {
      // Get auth token for API request
      const { data: { session } } = await supabase().auth.getSession();
      const token = session?.access_token;
      console.log('Auth token obtained:', !!token);

      const response = await fetch(`/api/programs/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      console.log('Delete response status:', response.status);
      const data = await response.json();
      console.log('Delete response data:', data);
      
      if (data.success) {
        await fetchPrograms(); // Refresh the list
        setDeletingProgram(null); // Close confirmation dialog
      } else {
        console.error('Failed to delete program:', data.message);
        alert('Failed to delete program: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to delete program:', error);
      alert('Failed to delete program. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your affiliate programs and commission structures
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Program
        </button>
      </div>

      {/* Programs Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading programs...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => (
          <div key={program.id} className="bg-white rounded-lg shadow p-6 dashboard-card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{program.name}</h3>
                <p className="text-sm text-gray-500">{program.description}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingProgram(program)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeletingProgram(program)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Type:</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{program.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">
                  {program.type === 'reward' ? 'Referral Target:' : 'Commission:'}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {program.type === 'reward' 
                    ? `${program.referral_target} referrals`
                    : program.commissionType === 'percentage' 
                      ? `${program.commission}%` 
                      : `${currency}${program.commission}`
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(program.status)}`}>
                  {program.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Created:</span>
                <span className="text-sm text-gray-900">
                  {program.created_at ? formatDate(program.created_at) : 'No date'}
                </span>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingProgram) && (
        <ProgramModal
          program={editingProgram}
          onClose={() => {
            setShowCreateModal(false);
            setEditingProgram(null);
          }}
          onSubmit={editingProgram ? handleEditProgram : handleCreateProgram}
          currency={currency}
          isLoading={isCreating || isUpdating}
          rewardProgramsEnabled={rewardProgramsEnabled}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingProgram && (
        <div className="fixed inset-0 bg-white bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white/90 backdrop-blur-sm">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete the program <strong>"{deletingProgram.name}"</strong>?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeletingProgram(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProgram(deletingProgram.id)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isDeleting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProgramModal({ program, onClose, onSubmit, currency, isLoading, rewardProgramsEnabled }: any) {
  const [formData, setFormData] = useState({
    name: program?.name || '',
    type: program?.type || 'signup',
    commission: program?.commission || 0,
    commissionType: program?.commissionType || 'fixed',
    referralTarget: program?.referral_target || 10,
    status: program?.status || 'active',
    description: program?.description || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent submission while loading
    onSubmit(formData);
  };

  // Update commission type when program type changes
  const handleTypeChange = (type: string) => {
    const newFormData = { ...formData, type };
    // For signup programs, force commission type to be fixed
    if (type === 'signup') {
      newFormData.commissionType = 'fixed';
    }
    // For reward programs, clear commission fields
    if (type === 'reward') {
      newFormData.commission = 0;
      newFormData.commissionType = 'fixed';
    }
    setFormData(newFormData);
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white/90 backdrop-blur-sm">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {program ? 'Edit Program' : 'Create New Program'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full form-input disabled:opacity-50 disabled:cursor-not-allowed"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="mt-1 block w-full form-select"
                disabled={isLoading}
              >
                <option value="signup">Sign Up Referrals</option>
                <option value="purchase">Purchase Referrals</option>
                {rewardProgramsEnabled && (
                  <option value="reward">Sign Up Referrals (Reward)</option>
                )}
              </select>
            </div>
            {formData.type === 'reward' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Referral Target
                </label>
                <input
                  type="number"
                  value={formData.referralTarget}
                  onChange={(e) => setFormData({ ...formData, referralTarget: parseInt(e.target.value) })}
                  className="mt-1 block w-full form-input"
                  required
                  min="1"
                  step="1"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">Number of verified referrals required to qualify for reward</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Commission {formData.commissionType === 'percentage' ? '(%)' : `(${currency})`}
                  </label>
                  <input
                    type="number"
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: parseFloat(e.target.value) })}
                    className="mt-1 block w-full form-input"
                    required
                    min="0"
                    step={formData.commissionType === 'percentage' ? '0.1' : '0.01'}
                    max={formData.commissionType === 'percentage' ? '100' : undefined}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={formData.commissionType}
                    onChange={(e) => setFormData({ ...formData, commissionType: e.target.value })}
                    className="mt-1 block w-full form-select"
                    disabled={formData.type === 'signup' || isLoading}
                  >
                    <option value="fixed">Fixed ({currency})</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                  {formData.type === 'signup' && (
                    <p className="text-xs text-gray-500 mt-1">Sign up programs only support fixed dollar amounts</p>
                  )}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3 text-gray-900 bg-white"
                disabled={isLoading}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3 text-gray-900 bg-white"
                disabled={isLoading}
              />
            </div>
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
                {program ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
