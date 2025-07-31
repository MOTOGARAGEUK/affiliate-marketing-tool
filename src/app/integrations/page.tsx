'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, CogIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { mockIntegrations } from '@/lib/mockData';
import { formatDate, getStatusColor } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function Integrations() {
  const [integrations, setIntegrations] = useState(mockIntegrations);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch integrations from database
  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching integrations:', error);
        return;
      }

      // Transform database data to match expected format
      const transformedIntegrations = data.map(integration => ({
        id: integration.id,
        name: integration.name,
        type: integration.type,
        status: integration.status,
        config: integration.config,
        createdAt: new Date(integration.created_at),
        updatedAt: new Date(integration.updated_at),
      }));

      setIntegrations(transformedIntegrations);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectIntegration = async (integrationData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to connect integrations');
        return;
      }

      // Save to database
      const response = await fetch('/api/integrations/sharetribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketplaceId: integrationData.config.marketplaceId,
          clientId: integrationData.config.clientId,
          clientSecret: integrationData.config.clientSecret,
          userId: user.id,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh integrations list
        await fetchIntegrations();
        setShowConnectModal(false);
        alert('Integration connected successfully!');
      } else {
        alert('Failed to connect integration: ' + result.message);
      }
    } catch (error) {
      console.error('Error connecting integration:', error);
      alert('Failed to connect integration');
    }
  };

  const handleDisconnectIntegration = (id: string) => {
    setIntegrations(integrations.map(i => 
      i.id === id ? { ...i, status: 'disconnected', updatedAt: new Date() } : i
    ));
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'sharetribe':
        return '🏪';
      case 'shopify':
        return '🛍️';
      case 'woocommerce':
        return '🛒';
      default:
        return '🔗';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Connect your affiliate marketing tool with external platforms
          </p>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Connect Platform
        </button>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <div key={integration.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{getIntegrationIcon(integration.type)}</span>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{integration.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{integration.type}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {integration.status === 'connected' ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(integration.status)}`}>
                  {integration.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Connected:</span>
                <span className="text-sm text-gray-900">{formatDate(integration.createdAt)}</span>
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => setSelectedIntegration(integration)}
                className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100"
              >
                <CogIcon className="h-4 w-4 mr-1" />
                Configure
              </button>
              {integration.status === 'connected' && (
                <button
                  onClick={() => handleDisconnectIntegration(integration.id)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Available Integrations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Available Integrations</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: 'Sharetribe', type: 'sharetribe', description: 'Connect with Sharetribe marketplace' },
            { name: 'Shopify', type: 'shopify', description: 'Integrate with Shopify stores' },
            { name: 'WooCommerce', type: 'woocommerce', description: 'Connect with WooCommerce sites' },
          ].map((platform) => (
            <div key={platform.type} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-xl mr-2">{getIntegrationIcon(platform.type)}</span>
                <h4 className="font-medium text-gray-900">{platform.name}</h4>
              </div>
              <p className="text-sm text-gray-500 mb-3">{platform.description}</p>
              <button
                onClick={() => setShowConnectModal(true)}
                className="w-full px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100"
              >
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Connect Integration Modal */}
      {showConnectModal && (
        <ConnectIntegrationModal
          onClose={() => setShowConnectModal(false)}
          onSubmit={handleConnectIntegration}
        />
      )}

      {/* Configure Integration Modal */}
      {selectedIntegration && (
        <ConfigureIntegrationModal
          integration={selectedIntegration}
          onClose={() => setSelectedIntegration(null)}
        />
      )}
    </div>
  );
}

function ConnectIntegrationModal({ onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'sharetribe',
    config: {
      marketplaceId: '',
      clientId: '',
      clientSecret: '',
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Connect Platform</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Platform</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="sharetribe">Sharetribe</option>
                <option value="shopify">Shopify</option>
                <option value="woocommerce">WooCommerce</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Marketplace ID</label>
              <input
                type="text"
                value={formData.config.marketplaceId}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  config: { ...formData.config, marketplaceId: e.target.value },
                  name: `${e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1)} Marketplace`
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Client ID</label>
              <input
                type="text"
                value={formData.config.clientId}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  config: { ...formData.config, clientId: e.target.value }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Your Sharetribe Client ID"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Client Secret</label>
              <input
                type="password"
                value={formData.config.clientSecret}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  config: { ...formData.config, clientSecret: e.target.value }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Your Sharetribe Client Secret"
                required
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
                Connect
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ConfigureIntegrationModal({ integration, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Configure Integration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Platform</label>
              <p className="mt-1 text-sm text-gray-900 capitalize">{integration.type}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Marketplace ID</label>
              <p className="mt-1 text-sm text-gray-900">{integration.config.marketplaceId}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Client ID</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">{integration.config.clientId}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Client Secret</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">••••••••••••••••</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <p className="mt-1 text-sm text-gray-900">{integration.status}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Connected</label>
              <p className="mt-1 text-sm text-gray-900">{formatDate(integration.createdAt)}</p>
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
