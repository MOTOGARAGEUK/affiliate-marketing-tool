'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { mockPrograms } from '@/lib/mockData';
import { formatDate, getStatusColor } from '@/lib/utils';

export default function Programs() {
  const [programs, setPrograms] = useState(mockPrograms);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<any>(null);

  const handleCreateProgram = (programData: any) => {
    const newProgram = {
      id: Date.now().toString(),
      ...programData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPrograms([...programs, newProgram]);
    setShowCreateModal(false);
  };

  const handleEditProgram = (programData: any) => {
    setPrograms(programs.map(p => p.id === editingProgram.id ? { ...p, ...programData, updatedAt: new Date() } : p));
    setEditingProgram(null);
  };

  const handleDeleteProgram = (id: string) => {
    setPrograms(programs.filter(p => p.id !== id));
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => (
          <div key={program.id} className="bg-white rounded-lg shadow p-6">
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
                  onClick={() => handleDeleteProgram(program.id)}
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
                <span className="text-sm text-gray-500">Commission:</span>
                <span className="text-sm font-medium text-gray-900">
                  {program.commissionType === 'percentage' ? `${program.commission}%` : `$${program.commission}`}
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
                <span className="text-sm text-gray-900">{formatDate(program.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingProgram) && (
        <ProgramModal
          program={editingProgram}
          onClose={() => {
            setShowCreateModal(false);
            setEditingProgram(null);
          }}
          onSubmit={editingProgram ? handleEditProgram : handleCreateProgram}
        />
      )}
    </div>
  );
}

function ProgramModal({ program, onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    name: program?.name || '',
    type: program?.type || 'signup',
    commission: program?.commission || 0,
    commissionType: program?.commissionType || 'fixed',
    status: program?.status || 'active',
    description: program?.description || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Update commission type when program type changes
  const handleTypeChange = (type: string) => {
    const newFormData = { ...formData, type };
    // For signup programs, force commission type to be fixed
    if (type === 'signup') {
      newFormData.commissionType = 'fixed';
    }
    setFormData(newFormData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="signup">Sign Up Referrals</option>
                <option value="purchase">Purchase Referrals</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Commission {formData.commissionType === 'percentage' ? '(%)' : '($)'}
                </label>
                <input
                  type="number"
                  value={formData.commission}
                  onChange={(e) => setFormData({ ...formData, commission: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                  min="0"
                  step={formData.commissionType === 'percentage' ? '0.1' : '0.01'}
                  max={formData.commissionType === 'percentage' ? '100' : undefined}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={formData.commissionType}
                  onChange={(e) => setFormData({ ...formData, commissionType: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={formData.type === 'signup'}
                >
                  <option value="fixed">Fixed ($)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
                {formData.type === 'signup' && (
                  <p className="text-xs text-gray-500 mt-1">Sign up programs only support fixed dollar amounts</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
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
                {program ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
