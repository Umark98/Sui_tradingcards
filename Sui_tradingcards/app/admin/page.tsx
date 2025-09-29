"use client";

import { useState } from 'react';
import CardConfigForm from '@/components/admin/CardConfigForm';
import MintInterface from '@/components/admin/MintInterface';
import MintMetadataInterface from '@/components/admin/MintMetadataInterface';
import PublishContractsInterface from '@/components/admin/PublishContractsInterface';
import AdminStats from '@/components/admin/AdminStats';
import WalletDropdown from '@/components/admin/WalletDropdown';
import ProtectedRoute from '@/components/ProtectedRoute';

type AdminTab = 'publish' | 'config' | 'mint' | 'mintMetadata' | 'stats';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('publish');

  const tabs = [
    { id: 'publish', label: 'Publish Contracts', icon: '🚀' },
    { id: 'config', label: 'Card Configuration', icon: '⚙️' },
    { id: 'mint', label: 'Mint and Transfer', icon: '🪙' },
    { id: 'mintMetadata', label: 'Mint Metadata', icon: '📋' },
    { id: 'stats', label: 'Statistics', icon: '📊' }
  ];

  return (
    <ProtectedRoute>
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Panel
            </h1>
            <p className="text-gray-600 mt-2">
              Manage trading card configurations and minting operations
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <WalletDropdown />
            <div className="bg-red-100 border border-red-200 rounded-lg px-4 py-2">
              <p className="text-red-800 text-sm font-medium">
                🔒 Admin Only Access
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'publish' && <PublishContractsInterface />}
          {activeTab === 'config' && <CardConfigForm />}
          {activeTab === 'mint' && <MintInterface />}
          {activeTab === 'mintMetadata' && <MintMetadataInterface />}
          {activeTab === 'stats' && <AdminStats />}
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}

