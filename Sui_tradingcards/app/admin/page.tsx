"use client";

import { useState, useEffect } from 'react';
import MintInterface from '@/components/admin/MintInterface';
import MintMetadataInterface from '@/components/admin/MintMetadataInterface';
import PublishContractsInterface from '@/components/admin/PublishContractsInterface';
import GenesisMintInterface from '@/components/admin/GenesisMintInterface';
import GenesisDisplayInterface from '@/components/admin/GenesisDisplayInterface';
import MissionMintInterface from '@/components/admin/MissionMintInterface';
import MissionDisplayInterface from '@/components/admin/MissionDisplayInterface';
import AdminStats from '@/components/admin/AdminStats';
import WalletDropdown from '@/components/admin/WalletDropdown';

type AdminTab = 'publish' | 'mint' | 'mintMetadata' | 'genesisDisplay' | 'genesisMint' | 'missionDisplay' | 'missionMint' | 'stats';

export default function AdminPanel() {
  // Initialize tab state with default value to avoid hydration issues
  const [activeTab, setActiveTab] = useState<AdminTab>('publish');
  const [isClient, setIsClient] = useState(false);

  // Handle client-side initialization after hydration
  useEffect(() => {
    setIsClient(true);
    
    // First check URL hash for tab
    const urlHash = window.location.hash.replace('#', '') as AdminTab;
    if (urlHash && ['publish', 'config', 'mint', 'mintMetadata', 'genesisDisplay', 'genesisMint', 'missionDisplay', 'missionMint', 'stats'].includes(urlHash)) {
      setActiveTab(urlHash);
      return;
    }
    
    // Fallback to localStorage
    const savedTab = localStorage.getItem('adminActiveTab') as AdminTab;
    if (savedTab && ['publish', 'config', 'mint', 'mintMetadata', 'genesisDisplay', 'genesisMint', 'missionDisplay', 'missionMint', 'stats'].includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  // Save tab to localStorage and URL when it changes
  const handleTabClick = (tab: AdminTab) => {
    setActiveTab(tab);
    if (isClient) {
      localStorage.setItem('adminActiveTab', tab);
      // Update URL hash for bookmarking
      window.history.replaceState(null, '', `#${tab}`);
    }
  };

  const tabs = [
    { id: 'publish', label: 'Publish Contracts', icon: '🚀' },
    { id: 'mint', label: 'Mint and Transfer', icon: '🪙' },
    { id: 'mintMetadata', label: 'Mint Metadata', icon: '📋' },
    { id: 'genesisDisplay', label: 'Genesis Display', icon: '🎨' },
    { id: 'genesisMint', label: 'Genesis Cards', icon: '🎴' },
    { id: 'missionDisplay', label: 'Mission Display', icon: '🎨' },
    { id: 'missionMint', label: 'Mission Mint', icon: '🎯' },
    { id: 'stats', label: 'Statistics', icon: '📊' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 min-h-full admin-section">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Admin Panel
              </h1>
              <p className="text-gray-300 mt-2">
                Manage trading card configurations and minting operations
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <WalletDropdown />
              <div className="bg-red-500/20 border border-red-400/50 rounded-lg px-4 py-2">
                <p className="text-red-200 text-sm font-medium">
                  🔒 Admin Only Access
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-white/20">
            <nav className="-mb-px flex flex-wrap gap-2">
              {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id as AdminTab)}
                className={`py-2 px-3 border-b-2 font-medium text-xs whitespace-nowrap transition-all rounded-t-lg ${
                  activeTab === tab.id
                    ? 'border-purple-400 text-white bg-white/10'
                    : 'border-transparent text-gray-300 hover:text-blue-200 hover:border-blue-400/30 hover:bg-blue-500/10'
                }`}
              >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {isClient && activeTab === 'publish' && <PublishContractsInterface />}
            {isClient && activeTab === 'mint' && <MintInterface />}
            {isClient && activeTab === 'mintMetadata' && <MintMetadataInterface />}
            {isClient && activeTab === 'genesisDisplay' && <GenesisDisplayInterface />}
            {isClient && activeTab === 'genesisMint' && <GenesisMintInterface />}
            {isClient && activeTab === 'missionDisplay' && <MissionDisplayInterface />}
            {isClient && activeTab === 'missionMint' && <MissionMintInterface />}
            {isClient && activeTab === 'stats' && <AdminStats />}
          </div>
        </div>
      </div>
  );
}

