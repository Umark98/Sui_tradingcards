"use client";

import { useState, useEffect } from 'react';

interface GadgetUser {
  userId: number;
  userEmail: string;
  nftTitle: string;
  nftDescription: string;
  nftSerialNumber: number;
  numEntities: number;
  type: string;
  rarity: string;
  mintedLevel: number;
  editionSize: number;
  typeName: string;
  rarityName: string;
  levelValue: number;
  collectionName: string;
  collectionSeries: string;
  artistName: string;
  artistCopyright: string;
  platformName: string;
  userTotalGadgets: number;
}

interface GadgetStats {
  totalGadgetUsers: number;
  totalGadgetNfts: number;
  uniqueGadgetTypes: number;
  uniqueCollections: number;
}

interface GadgetDistribution {
  gadgetType: string;
  totalNfts: number;
  uniqueUsers: number;
  collections: number;
}

interface TopGadgetUser {
  userId: number;
  userEmail: string;
  gadgetCount: number;
  uniqueGadgetTypes: number;
  gadgetTypes: string;
}

interface GadgetUsersResponse {
  success: boolean;
  stats: GadgetStats;
  distribution: GadgetDistribution[];
  topUsers: TopGadgetUser[];
  gadgetUsers: GadgetUser[];
  filters: {
    gadgetType: string | null;
    limit: number;
  };
  totalResults: number;
  availableGadgetTypes: string[];
}

export default function GadgetUsersTable() {
  const [data, setData] = useState<GadgetUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'distribution' | 'top'>('overview');
  const [filters, setFilters] = useState({
    gadgetType: '',
    limit: '1000'
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters.gadgetType) params.append('gadgetType', filters.gadgetType);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await fetch(`/api/admin/gadget-users?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching gadget users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchData();
  };

  const handleClearFilters = () => {
    setFilters({
      gadgetType: '',
      limit: '1000'
    });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Loading gadget users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-600 border border-red-400 text-white px-4 py-3 rounded">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-4 text-gray-300">
        No data available
      </div>
    );
  }

  const { stats, distribution, topUsers, gadgetUsers } = data;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-200">Gadget Users</h3>
          <p className="text-2xl font-bold text-white">{stats.totalGadgetUsers.toLocaleString()}</p>
        </div>
        <div className="bg-green-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-200">Gadget NFTs</h3>
          <p className="text-2xl font-bold text-white">{stats.totalGadgetNfts.toLocaleString()}</p>
        </div>
        <div className="bg-purple-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-white">Gadget Types</h3>
          <p className="text-2xl font-bold text-white">{stats.uniqueGadgetTypes}</p>
        </div>
        <div className="bg-orange-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-white">Collections</h3>
          <p className="text-2xl font-bold text-white">{stats.uniqueCollections}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Gadget Type</label>
            <select
              value={filters.gadgetType}
              onChange={(e) => handleFilterChange('gadgetType', e.target.value)}
              className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Gadget Types</option>
              {data.availableGadgetTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Results Limit</label>
            <input
              type="number"
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', e.target.value)}
              className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Results limit"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="text-sm text-gray-300">
        Showing {data.totalResults.toLocaleString()} gadget NFT records
        {data.filters.gadgetType && ` (filtered by gadget type: ${data.filters.gadgetType})`}
      </div>

      {/* Tabs */}
      <div className="border-b border-white/20">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', count: null },
            { id: 'users', label: 'All Users', count: gadgetUsers.length },
            { id: 'distribution', label: 'Gadget Distribution', count: distribution.length },
            { id: 'top', label: 'Top Users', count: topUsers.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-200'
                  : 'border-transparent text-gray-300 hover:text-gray-200 hover:border-white/30'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 bg-gray-600 text-gray-300 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Gadget Users Overview</h3>
              <div className="text-blue-200 space-y-2">
                <p>• <strong>{stats.totalGadgetUsers.toLocaleString()}</strong> users own Inspector Gadget NFTs</p>
                <p>• <strong>{stats.totalGadgetNfts.toLocaleString()}</strong> total gadget NFTs in the system</p>
                <p>• <strong>{stats.uniqueGadgetTypes}</strong> different gadget types available</p>
                <p>• <strong>{stats.uniqueCollections}</strong> collections contain gadget NFTs</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-3">Top Gadget Types</h4>
                <div className="space-y-2">
                  {distribution.slice(0, 10).map((item, index) => (
                    <div key={item.gadgetType} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.gadgetType}</span>
                      <div className="text-right">
                        <span className="text-sm text-gray-300">{item.totalNfts} NFTs</span>
                        <span className="text-xs text-gray-300 ml-2">({item.uniqueUsers} users)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-3">Top Gadget Collectors</h4>
                <div className="space-y-2">
                  {topUsers.slice(0, 10).map((user, index) => (
                    <div key={user.userId} className="flex justify-between items-center">
                      <span className="text-sm font-medium truncate">{user.userEmail}</span>
                      <div className="text-right">
                        <span className="text-sm text-gray-300">{user.gadgetCount} gadgets</span>
                        <span className="text-xs text-gray-300 ml-2">({user.uniqueGadgetTypes} types)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white/10 backdrop-blur-lg border border-white/30">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Gadget Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Collection</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Rarity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Serial</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Total Gadgets</th>
                </tr>
              </thead>
              <tbody className="bg-white/10 backdrop-blur-lg divide-y divide-white/10">
                {gadgetUsers.map((user, index) => (
                  <tr key={`${user.userId}-${user.nftTitle}-${index}`} className={index % 2 === 0 ? 'bg-white/10 backdrop-blur-lg' : 'bg-white/5'}>
                    <td className="px-4 py-3 text-sm border-b">
                      <div>
                        <div className="font-medium text-white">{user.userEmail}</div>
                        <div className="text-gray-300 text-xs">ID: {user.userId}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm border-b">
                      <div>
                        <div className="font-medium text-white">{user.nftTitle}</div>
                        {user.nftDescription && (
                          <div className="text-gray-300 text-xs max-w-xs truncate">
                            {user.nftDescription}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm border-b">
                      <div>
                        <div className="font-medium text-white">{user.collectionName || 'N/A'}</div>
                        {user.collectionSeries && (
                          <div className="text-gray-300 text-xs">{user.collectionSeries}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm border-b">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-600 text-white">
                        {user.rarityName || user.rarity || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm border-b">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                        {user.levelValue || user.mintedLevel || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm border-b">
                      <span className="font-medium text-white">{user.nftSerialNumber || 'N/A'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm border-b">
                      <span className="font-medium text-white">{user.userTotalGadgets}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'distribution' && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white/10 backdrop-blur-lg border border-white/30">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Gadget Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Total NFTs</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Unique Users</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Collections</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Popularity</th>
                </tr>
              </thead>
              <tbody className="bg-white/10 backdrop-blur-lg divide-y divide-white/10">
                {distribution.map((item, index) => (
                  <tr key={item.gadgetType} className={index % 2 === 0 ? 'bg-white/10 backdrop-blur-lg' : 'bg-white/5'}>
                    <td className="px-4 py-3 text-sm border-b font-medium text-white">{item.gadgetType}</td>
                    <td className="px-4 py-3 text-sm border-b">
                      <span className="font-medium text-white">{item.totalNfts.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-sm border-b">
                      <span className="font-medium text-white">{item.uniqueUsers.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-sm border-b">
                      <span className="font-medium text-white">{item.collections.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-sm border-b">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(item.totalNfts / Math.max(...distribution.map(d => d.totalNfts))) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'top' && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white/10 backdrop-blur-lg border border-white/30">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Total Gadgets</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Unique Types</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Gadget Types</th>
                </tr>
              </thead>
              <tbody className="bg-white/10 backdrop-blur-lg divide-y divide-white/10">
                {topUsers.map((user, index) => (
                  <tr key={user.userId} className={index % 2 === 0 ? 'bg-white/10 backdrop-blur-lg' : 'bg-white/5'}>
                    <td className="px-4 py-3 text-sm border-b">
                      <div>
                        <div className="font-medium text-white">{user.userEmail}</div>
                        <div className="text-gray-300 text-xs">ID: {user.userId}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm border-b">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                        {user.gadgetCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm border-b">
                      <span className="font-medium text-white">{user.uniqueGadgetTypes}</span>
                    </td>
                    <td className="px-4 py-3 text-sm border-b">
                      <div className="text-gray-300 max-w-xs truncate">{user.gadgetTypes}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {gadgetUsers.length === 0 && (
        <div className="text-center py-8 text-gray-300">
          No gadget users found matching the current filters.
        </div>
      )}
    </div>
  );
}
