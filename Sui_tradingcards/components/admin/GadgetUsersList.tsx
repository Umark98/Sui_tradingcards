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

interface GadgetUsersResponse {
  success: boolean;
  stats: {
    totalGadgetUsers: number;
    totalGadgetNfts: number;
    uniqueGadgetTypes: number;
    uniqueCollections: number;
  };
  distribution: Array<{
    gadgetType: string;
    totalNfts: number;
    uniqueUsers: number;
    collections: number;
  }>;
  topUsers: Array<{
    userId: number;
    userEmail: string;
    gadgetCount: number;
    uniqueGadgetTypes: number;
    gadgetTypes: string;
  }>;
  gadgetUsers: GadgetUser[];
  totalResults: number;
  availableGadgetTypes: string[];
}

export default function GadgetUsersList() {
  const [data, setData] = useState<GadgetUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGadgetType, setFilterGadgetType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState<'userEmail' | 'nftTitle' | 'rarity' | 'level'>('userEmail');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/real-gadget-users');
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

  // Filter and sort data
  let filteredUsers = data.gadgetUsers.filter(user => {
    const matchesSearch = user.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.nftTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.nftTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGadgetType = !filterGadgetType || user.nftTitle === filterGadgetType;
    const matchesStatus = !filterStatus; // No status filter for real data
    
    return matchesSearch && matchesGadgetType && matchesStatus;
  });

  // Sort data
  filteredUsers.sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'userEmail':
        aValue = a.userEmail;
        bValue = b.userEmail;
        break;
      case 'nftTitle':
        aValue = a.nftTitle;
        bValue = b.nftTitle;
        break;
      case 'rarity':
        aValue = a.rarity;
        bValue = b.rarity;
        break;
      case 'level':
        aValue = a.mintedLevel;
        bValue = b.mintedLevel;
        break;
      default:
        aValue = a.userEmail;
        bValue = b.userEmail;
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'bg-gray-600 text-white';
      case 'uncommon': return 'bg-green-600 text-white';
      case 'rare': return 'bg-blue-600 text-white';
      case 'epic': return 'bg-purple-600 text-white';
      case 'legendary': return 'bg-yellow-500 text-black font-bold';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-600 text-white';
      case 'completed': return 'bg-green-600 text-white';
      case 'failed': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-200">Total Gadget NFTs</h3>
          <p className="text-2xl font-bold text-white">{data.stats.totalGadgetNfts.toLocaleString()}</p>
        </div>
        <div className="bg-green-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-200">Gadget Users</h3>
          <p className="text-2xl font-bold text-white">{data.stats.totalGadgetUsers.toLocaleString()}</p>
        </div>
        <div className="bg-purple-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-white">Gadget Types</h3>
          <p className="text-2xl font-bold text-white">{data.stats.uniqueGadgetTypes}</p>
        </div>
        <div className="bg-orange-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-white">Collections</h3>
          <p className="text-2xl font-bold text-white">{data.stats.uniqueCollections}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/5 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users, titles, or gadget types..."
              className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Gadget Type</label>
            <select
              value={filterGadgetType}
              onChange={(e) => setFilterGadgetType(e.target.value)}
              className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Gadget Types</option>
              {data.availableGadgetTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Sort By</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="userEmail">User Email</option>
                <option value="nftTitle">Gadget Type</option>
                <option value="rarity">Rarity</option>
                <option value="level">Level</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="text-sm text-gray-300">
        Showing {filteredUsers.length.toLocaleString()} of {data.totalResults.toLocaleString()} gadget NFT records
        {searchTerm && ` (filtered by: "${searchTerm}")`}
        {filterGadgetType && ` (gadget type: ${filterGadgetType})`}
        {filterStatus && ` (status: ${filterStatus})`}
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white/10 backdrop-blur-lg border border-white/30">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">User Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Gadget Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Collection</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Rarity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Level</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Serial</th>
            </tr>
          </thead>
          <tbody className="bg-white/10 backdrop-blur-lg divide-y divide-white/10">
            {filteredUsers.map((user, index) => (
              <tr key={`${user.userId}-${user.nftTitle}-${index}`} className={index % 2 === 0 ? 'bg-white/10 backdrop-blur-lg' : 'bg-white/5'}>
                <td className="px-4 py-3 text-sm border-b">
                  <div>
                    <div className="font-medium text-white">{user.userEmail}</div>
                    <div className="text-gray-300 text-xs">ID: {user.userId}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm border-b">
                  <span className="font-medium text-white">{user.nftTitle}</span>
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
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRarityColor(user.rarityName || user.rarity)}`}>
                    {user.rarityName || user.rarity || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm border-b">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                    {user.levelValue || user.mintedLevel || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm border-b">
                  <span className="font-medium text-white">{user.nftSerialNumber || 'N/A'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-gray-300">
          No gadget users found matching the current filters.
        </div>
      )}

      {/* Top Users Summary */}
      {data.topUsers.length > 0 && (
        <div className="mt-8 bg-white/5 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Top Gadget Collectors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.topUsers.slice(0, 6).map((user, index) => (
              <div key={user.userId} className="bg-white/10 backdrop-blur-lg p-4 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-white truncate" title={user.userEmail}>
                    {user.userEmail}
                  </div>
                  <span className="text-sm text-gray-300">#{index + 1}</span>
                </div>
                <div className="text-sm text-gray-300">
                  <div>{user.gadgetCount} gadgets</div>
                  <div>{user.uniqueGadgetTypes} unique types</div>
                </div>
                <div className="text-xs text-gray-300 mt-2 truncate" title={user.gadgetTypes}>
                  {user.gadgetTypes}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
