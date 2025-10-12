"use client";

import { useState, useEffect } from 'react';

interface CollectionUser {
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
}

interface CollectionUsersResponse {
  success: boolean;
  stats: {
    totalUsers: number;
    totalNfts: number;
    uniqueTypes: number;
    uniqueRarities: number;
  };
  distribution: Array<{
    type: string;
    totalNfts: number;
    uniqueUsers: number;
  }>;
  topUsers: Array<{
    userId: number;
    userEmail: string;
    nftCount: number;
    uniqueTypes: number;
    nftTypes: string;
  }>;
  collectionUsers: CollectionUser[];
  totalResults: number;
  collectionName: string;
}

interface CollectionUsersListProps {
  collectionName: string;
  pageTitle: string;
  pageDescription: string;
  missionCardTypes?: string[]; // Optional mission card types for filtering
  hideRarityAndLevel?: boolean; // Optional flag to hide rarity and level columns
  hideLevelOnly?: boolean; // Optional flag to hide only the level column
}

export default function CollectionUsersList({ collectionName, pageTitle, pageDescription, missionCardTypes, hideRarityAndLevel = false, hideLevelOnly = false }: CollectionUsersListProps) {
  const [data, setData] = useState<CollectionUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState<'userEmail' | 'nftTitle' | 'rarity' | 'level'>('userEmail');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `/api/admin/collection-users?collection=${encodeURIComponent(collectionName)}`;
      
      // Add mission card types filter if provided
      if (missionCardTypes && missionCardTypes.length > 0) {
        const typesParam = missionCardTypes.map(type => encodeURIComponent(type)).join(',');
        url += `&missionTypes=${typesParam}`;
      }
      
      const response = await fetch(url);
      
      console.log('API Response Status:', response.status);
      console.log('API Response OK:', response.ok);
      console.log('API URL:', url);
      
      if (!response.ok) {
        // Try to read the error response body
        let errorDetails = '';
        try {
          const errorBody = await response.json();
          errorDetails = errorBody.error || errorBody.details || JSON.stringify(errorBody);
        } catch (e) {
          errorDetails = await response.text();
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorDetails}`);
      }
      
      const result = await response.json();
      console.log('API Response Data:', result);
      
      if (result.success) {
        setData(result);
      } else {
        console.error('API Error:', result);
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      setError(errorMessage);
      console.error('Error fetching collection users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [collectionName, missionCardTypes]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Loading {collectionName} users...</div>
      </div>
    );
  }

  if (error) {
    const isMissionCollection = missionCardTypes && missionCardTypes.length > 0;
    
    return (
      <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-200 mb-2">Error Loading Data</h3>
        <p className="text-white mb-4">{error}</p>
        <div className="text-red-200 text-sm">
          <p className="mb-2">This might be because:</p>
          <ul className="list-disc list-inside space-y-1">
            {isMissionCollection ? (
              <>
                <li>No mission cards have been minted yet</li>
                <li>The mission card types don't exist in the database</li>
                <li>There's a mismatch between contract types and database types</li>
              </>
            ) : (
              <>
                <li>The collection doesn't exist in the database</li>
                <li>There are no NFTs in this collection</li>
                <li>Database connection issues</li>
                <li>Collection name mismatch</li>
              </>
            )}
          </ul>
        </div>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Retry
        </button>
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
  let filteredUsers = data.collectionUsers.filter(user => {
    const matchesSearch = user.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.nftTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterType || user.typeName === filterType;
    
    return matchesSearch && matchesType;
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
        aValue = a.rarityName || a.rarity;
        bValue = b.rarityName || b.rarity;
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
    switch (rarity?.toLowerCase()) {
      case 'common': return 'bg-gray-600 text-white';
      case 'uncommon': return 'bg-green-600 text-white';
      case 'rare': return 'bg-blue-600 text-white';
      case 'epic': return 'bg-purple-600 text-white';
      case 'legendary': return 'bg-yellow-500 text-black font-bold';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-200">Total NFTs</h3>
          <p className="text-2xl font-bold text-white">{data.stats.totalNfts.toLocaleString()}</p>
        </div>
        <div className="bg-green-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-200">Users</h3>
          <p className="text-2xl font-bold text-white">{data.stats.totalUsers.toLocaleString()}</p>
        </div>
        <div className="bg-purple-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-white">Types</h3>
          <p className="text-2xl font-bold text-white">{data.stats.uniqueTypes}</p>
        </div>
        <div className="bg-orange-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-white">Rarities</h3>
          <p className="text-2xl font-bold text-white">{data.stats.uniqueRarities}</p>
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
              placeholder="Search users or NFT titles..."
              className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {data.distribution.map(item => (
                <option key={item.type} value={item.type}>{item.type}</option>
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
                <option value="nftTitle">NFT Title</option>
                {!hideRarityAndLevel && <option value="rarity">Rarity</option>}
                {!hideRarityAndLevel && !hideLevelOnly && <option value="level">Level</option>}
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
        Showing {filteredUsers.length.toLocaleString()} of {data.totalResults.toLocaleString()} {collectionName} NFT records
        {searchTerm && ` (filtered by: "${searchTerm}")`}
        {filterType && ` (type: ${filterType})`}
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white/10 backdrop-blur-lg border border-white/30">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">User Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">NFT Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Type</th>
              {!hideRarityAndLevel && <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Rarity</th>}
              {!hideRarityAndLevel && !hideLevelOnly && <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Level</th>}
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
                  <div className="max-w-xs truncate" title={user.nftTitle}>
                    {user.nftTitle}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm border-b">
                  <span className="font-medium text-white">{user.typeName || user.type || 'N/A'}</span>
                </td>
                {!hideRarityAndLevel && (
                  <td className="px-4 py-3 text-sm border-b">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRarityColor(user.rarityName || user.rarity)}`}>
                      {user.rarityName || user.rarity || 'N/A'}
                    </span>
                  </td>
                )}
                {!hideRarityAndLevel && !hideLevelOnly && (
                  <td className="px-4 py-3 text-sm border-b">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                      {user.levelValue || user.mintedLevel || 'N/A'}
                    </span>
                  </td>
                )}
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
          No {collectionName} users found matching the current filters.
        </div>
      )}

      {/* Top Users Summary */}
      {data.topUsers.length > 0 && (
        <div className="mt-8 bg-white/5 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Top {collectionName} Collectors</h3>
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
                  <div>{user.nftCount} NFTs</div>
                  <div>{user.uniqueTypes} unique types</div>
                </div>
                <div className="text-xs text-gray-300 mt-2 truncate" title={user.nftTypes}>
                  {user.nftTypes}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
