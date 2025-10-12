"use client";

import { useState, useEffect } from 'react';

interface UniqueNFT {
  nftTitle: string;
  nftDescription: string;
  numEntities: number;
  type: string;
  rarity: string;
  mintedLevel: number;
  editionSize: number;
  typeId: number;
  typeName: string;
  rarityId: number;
  rarityName: string;
  levelId: number;
  levelValue: number;
  collectionId: number;
  collectionName: string;
  collectionSeries: string;
  artistId: number;
  artistName: string;
  artistCopyright: string;
  platformId: number;
  platformName: string;
  totalInstances: number;
  minSerialNumber: number;
  maxSerialNumber: number;
  uniqueOwners: number;
  uniqueKey: string;
}

interface NFTStats {
  uniqueTitles: number;
  uniqueTypes: number;
  uniqueCollections: number;
  uniqueRarities: number;
  uniqueLevels: number;
  totalNfts: number;
  totalOwners: number;
}

interface UniqueNFTResponse {
  success: boolean;
  stats: NFTStats;
  uniqueNfts: UniqueNFT[];
  filters: {
    collection: string | null;
    type: string | null;
    rarity: string | null;
    level: string | null;
    limit: number;
  };
  totalResults: number;
}

export default function UniqueNFTTable() {
  const [data, setData] = useState<UniqueNFTResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    collection: '',
    type: '',
    rarity: '',
    level: '',
    limit: '1000'
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters.collection) params.append('collection', filters.collection);
      if (filters.type) params.append('type', filters.type);
      if (filters.rarity) params.append('rarity', filters.rarity);
      if (filters.level) params.append('level', filters.level);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await fetch(`/api/admin/unique-nfts?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching unique NFTs:', err);
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
      collection: '',
      type: '',
      rarity: '',
      level: '',
      limit: '1000'
    });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Loading unique NFT data...</div>
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

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-200">Unique Titles</h3>
          <p className="text-2xl font-bold text-white">{data.stats.uniqueTitles.toLocaleString()}</p>
        </div>
        <div className="bg-green-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-200">Total NFTs</h3>
          <p className="text-2xl font-bold text-white">{data.stats.totalNfts.toLocaleString()}</p>
        </div>
        <div className="bg-purple-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-white">Collections</h3>
          <p className="text-2xl font-bold text-white">{data.stats.uniqueCollections}</p>
        </div>
        <div className="bg-orange-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-white">Types</h3>
          <p className="text-2xl font-bold text-white">{data.stats.uniqueTypes}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Collection</label>
            <input
              type="text"
              value={filters.collection}
              onChange={(e) => handleFilterChange('collection', e.target.value)}
              className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Filter by collection"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Type</label>
            <input
              type="text"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Filter by type"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Rarity</label>
            <input
              type="text"
              value={filters.rarity}
              onChange={(e) => handleFilterChange('rarity', e.target.value)}
              className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Filter by rarity"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Level</label>
            <input
              type="number"
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Filter by level"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Limit</label>
            <input
              type="number"
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', e.target.value)}
              className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Results limit"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
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
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Info */}
      <div className="text-sm text-gray-300">
        Showing {data.totalResults.toLocaleString()} unique NFT combinations
        {data.filters.collection && ` (filtered by collection: ${data.filters.collection})`}
        {data.filters.type && ` (filtered by type: ${data.filters.type})`}
        {data.filters.rarity && ` (filtered by rarity: ${data.filters.rarity})`}
        {data.filters.level && ` (filtered by level: ${data.filters.level})`}
      </div>

      {/* NFT Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white/10 backdrop-blur-lg border border-white/30">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">NFT Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Collection</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Rarity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Level</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Artist</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Instances</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Owners</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Serial Range</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Edition Size</th>
            </tr>
          </thead>
          <tbody className="bg-white/10 backdrop-blur-lg divide-y divide-white/10">
            {data.uniqueNfts.map((nft, index) => (
              <tr key={nft.uniqueKey} className={index % 2 === 0 ? 'bg-white/10 backdrop-blur-lg' : 'bg-white/5'}>
                <td className="px-4 py-3 text-sm border-b">
                  <div>
                    <div className="font-medium text-white">{nft.nftTitle}</div>
                    {nft.nftDescription && (
                      <div className="text-gray-300 text-xs mt-1 max-w-xs truncate">
                        {nft.nftDescription}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm border-b">
                  <div>
                    <div className="font-medium text-white">{nft.collectionName || 'N/A'}</div>
                    {nft.collectionSeries && (
                      <div className="text-gray-300 text-xs">{nft.collectionSeries}</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm border-b">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                    {nft.typeName || nft.type || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm border-b">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-600 text-white">
                    {nft.rarityName || nft.rarity || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm border-b">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                    {nft.levelValue || nft.mintedLevel || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm border-b">
                  <div>
                    <div className="font-medium text-white">{nft.artistName || 'N/A'}</div>
                    {nft.artistCopyright && (
                      <div className="text-gray-300 text-xs">{nft.artistCopyright}</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm border-b">
                  <span className="font-medium text-white">{nft.totalInstances.toLocaleString()}</span>
                </td>
                <td className="px-4 py-3 text-sm border-b">
                  <span className="font-medium text-white">{nft.uniqueOwners.toLocaleString()}</span>
                </td>
                <td className="px-4 py-3 text-sm border-b">
                  <div className="text-white">
                    {nft.minSerialNumber && nft.maxSerialNumber ? (
                      <span>{nft.minSerialNumber} - {nft.maxSerialNumber}</span>
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm border-b">
                  <span className="font-medium text-white">{nft.editionSize || 'N/A'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.uniqueNfts.length === 0 && (
        <div className="text-center py-8 text-gray-300">
          No unique NFTs found matching the current filters.
        </div>
      )}
    </div>
  );
}
