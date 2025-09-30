"use client";

import { useState, useEffect } from 'react';
import CardConfigForm from '@/components/admin/CardConfigForm';
import MintInterface from '@/components/admin/MintInterface';
import MintMetadataInterface from '@/components/admin/MintMetadataInterface';
import PublishContractsInterface from '@/components/admin/PublishContractsInterface';
import GenesisMintInterface from '@/components/admin/GenesisMintInterface';
import GenesisDisplayInterface from '@/components/admin/GenesisDisplayInterface';
import AdminStats from '@/components/admin/AdminStats';
import WalletDropdown from '@/components/admin/WalletDropdown';

type AdminTab = 'publish' | 'config' | 'mint' | 'mintMetadata' | 'genesisDisplay' | 'genesisMint' | 'stats';

export default function AdminPanel() {
  // Initialize tab state with default value to avoid hydration issues
  const [activeTab, setActiveTab] = useState<AdminTab>('publish');
  const [isClient, setIsClient] = useState(false);

  // Handle client-side initialization after hydration
  useEffect(() => {
    setIsClient(true);
    
    // First check URL hash for tab
    const urlHash = window.location.hash.replace('#', '') as AdminTab;
    if (urlHash && ['publish', 'config', 'mint', 'mintMetadata', 'genesisDisplay', 'genesisMint', 'stats'].includes(urlHash)) {
      setActiveTab(urlHash);
      return;
    }
    
    // Fallback to localStorage
    const savedTab = localStorage.getItem('adminActiveTab') as AdminTab;
    if (savedTab && ['publish', 'config', 'mint', 'mintMetadata', 'genesisDisplay', 'genesisMint', 'stats'].includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  // Save tab to localStorage and URL when it changes
  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    if (isClient) {
      localStorage.setItem('adminActiveTab', tab);
      // Update URL hash for bookmarking
      window.history.replaceState(null, '', `#${tab}`);
    }
  };

  const tabs = [
    { id: 'publish', label: 'Publish Contracts', icon: '🚀' },
    { id: 'config', label: 'Card Configuration', icon: '⚙️' },
    { id: 'mint', label: 'Mint and Transfer', icon: '🪙' },
    { id: 'mintMetadata', label: 'Mint Metadata', icon: '📋' },
    { id: 'genesisDisplay', label: 'Genesis Display', icon: '🎨' },
    { id: 'genesisMint', label: 'Genesis Cards', icon: '🎴' },
    { id: 'stats', label: 'Statistics', icon: '📊' }
  ];

  return (
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
                onClick={() => handleTabChange(tab.id as AdminTab)}
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
            {activeTab === 'genesisDisplay' && <GenesisDisplayInterface />}
            {activeTab === 'genesisMint' && <GenesisMintInterface />}
            {activeTab === 'stats' && <AdminStats />}
          </div>
        </div>
      </div>
  );
}

