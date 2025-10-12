"use client";

import { useState, useEffect } from 'react';

interface DuplicateSummary {
  total_unique_combinations: number;
  combinations_with_duplicates: number;
  high_duplicate_combinations: number;
  very_high_duplicate_combinations: number;
  total_nfts: number;
  total_duplicate_instances: number;
  duplicate_percentage: number;
}

interface ExactDuplicate {
  nft_title: string;
  type_name: string;
  rarity_name: string;
  level_value: number;
  collection_name: string;
  duplicate_count: number;
  min_serial: number;
  max_serial: number;
  unique_owners: number;
  descriptions: string;
}

interface TitleDuplicate {
  nft_title: string;
  unique_combinations: number;
  total_instances: number;
  unique_owners: number;
  types: string;
  rarities: string;
  collections: string;
}

interface TypeCollectionDuplicate {
  type_name: string;
  collection_name: string;
  unique_titles: number;
  total_instances: number;
  unique_owners: number;
  sample_titles: string;
}

interface TopPattern {
  nft_title: string;
  type_name: string;
  rarity_name: string;
  level_value: number;
  collection_name: string;
  duplicate_count: number;
  percentage_of_total: number;
}

interface DuplicateAnalysisResponse {
  success: boolean;
  summary: DuplicateSummary;
  exactDuplicates: ExactDuplicate[];
  titleDuplicates: TitleDuplicate[];
  typeCollectionDuplicates: TypeCollectionDuplicate[];
  topPatterns: TopPattern[];
  filters: {
    minDuplicates: number;
    limit: number;
  };
}

export default function DuplicateNFTAnalysis() {
  const [data, setData] = useState<DuplicateAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'exact' | 'titles' | 'types' | 'patterns'>('summary');
  const [filters, setFilters] = useState({
    minDuplicates: '2',
    limit: '100'
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('minDuplicates', filters.minDuplicates);
      params.append('limit', filters.limit);

      const response = await fetch(`/api/admin/duplicate-nfts?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching duplicate analysis:', err);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Analyzing duplicate NFTs...</div>
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

  const { summary } = data;

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-200">Total NFTs</h3>
          <p className="text-2xl font-bold text-red-900">{summary.total_nfts.toLocaleString()}</p>
        </div>
        <div className="bg-orange-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-white">Duplicate Instances</h3>
          <p className="text-2xl font-bold text-white">{summary.total_duplicate_instances.toLocaleString()}</p>
        </div>
        <div className="bg-yellow-500 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-white">Duplicate %</h3>
          <p className="text-2xl font-bold text-yellow-900">{summary.duplicate_percentage}%</p>
        </div>
        <div className="bg-blue-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-200">Unique Combinations</h3>
          <p className="text-2xl font-bold text-white">{summary.total_unique_combinations.toLocaleString()}</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-200">With Duplicates</h3>
          <p className="text-xl font-bold text-white">{summary.combinations_with_duplicates.toLocaleString()}</p>
        </div>
        <div className="bg-purple-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-white">High Duplicates (10+)</h3>
          <p className="text-xl font-bold text-white">{summary.high_duplicate_combinations.toLocaleString()}</p>
        </div>
        <div className="bg-indigo-600 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-white">Very High (100+)</h3>
          <p className="text-xl font-bold text-indigo-900">{summary.very_high_duplicate_combinations.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Minimum Duplicates</label>
            <input
              type="number"
              value={filters.minDuplicates}
              onChange={(e) => handleFilterChange('minDuplicates', e.target.value)}
              className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Minimum duplicates to show"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Results Limit</label>
            <input
              type="number"
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', e.target.value)}
              className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Maximum results"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/20">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'summary', label: 'Summary', count: null },
            { id: 'exact', label: 'Exact Duplicates', count: data.exactDuplicates.length },
            { id: 'titles', label: 'Title Duplicates', count: data.titleDuplicates.length },
            { id: 'types', label: 'Type/Collection', count: data.typeCollectionDuplicates.length },
            { id: 'patterns', label: 'Top Patterns', count: data.topPatterns.length }
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
        {activeTab === 'summary' && (
          <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Duplicate Analysis Summary</h3>
            <div className="space-y-3 text-blue-200">
              <p>• <strong>{summary.total_nfts.toLocaleString()}</strong> total NFTs in your database</p>
              <p>• <strong>{summary.total_duplicate_instances.toLocaleString()}</strong> are duplicate instances ({summary.duplicate_percentage}%)</p>
              <p>• <strong>{summary.total_unique_combinations.toLocaleString()}</strong> unique NFT combinations</p>
              <p>• <strong>{summary.combinations_with_duplicates.toLocaleString()}</strong> combinations have duplicates</p>
              <p>• <strong>{summary.high_duplicate_combinations.toLocaleString()}</strong> combinations have 10+ duplicates</p>
              <p>• <strong>{summary.very_high_duplicate_combinations.toLocaleString()}</strong> combinations have 100+ duplicates</p>
            </div>
            <div className="mt-4 p-4 bg-blue-600 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Bundling Potential:</h4>
              <p className="text-blue-200">
                You could potentially reduce your NFT count by <strong>{summary.total_duplicate_instances.toLocaleString()}</strong> NFTs 
                ({summary.duplicate_percentage}%) through bundling strategies.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'exact' && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white/10 backdrop-blur-lg border border-white/30">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">NFT Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Collection</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Rarity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Duplicates</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Owners</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Serial Range</th>
                </tr>
              </thead>
              <tbody className="bg-white/10 backdrop-blur-lg divide-y divide-white/10">
                {data.exactDuplicates.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white/10 backdrop-blur-lg' : 'bg-white/5'}>
                    <td className="px-4 py-3 text-sm border-b font-medium text-white">{item.nft_title}</td>
                    <td className="px-4 py-3 text-sm border-b">{item.collection_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm border-b">{item.type_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm border-b">{item.rarity_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm border-b">{item.level_value || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm border-b">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-600 text-red-200">
                        {item.duplicate_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm border-b">{item.unique_owners}</td>
                    <td className="px-4 py-3 text-sm border-b">
                      {item.min_serial && item.max_serial ? `${item.min_serial} - ${item.max_serial}` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'titles' && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white/10 backdrop-blur-lg border border-white/30">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">NFT Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Total Instances</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Unique Combinations</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Owners</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Types</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Rarities</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Collections</th>
                </tr>
              </thead>
              <tbody className="bg-white/10 backdrop-blur-lg divide-y divide-white/10">
                {data.titleDuplicates.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white/10 backdrop-blur-lg' : 'bg-white/5'}>
                    <td className="px-4 py-3 text-sm border-b font-medium text-white">{item.nft_title}</td>
                    <td className="px-4 py-3 text-sm border-b">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-600 text-white">
                        {item.total_instances}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm border-b">{item.unique_combinations}</td>
                    <td className="px-4 py-3 text-sm border-b">{item.unique_owners}</td>
                    <td className="px-4 py-3 text-sm border-b text-gray-300">{item.types}</td>
                    <td className="px-4 py-3 text-sm border-b text-gray-300">{item.rarities}</td>
                    <td className="px-4 py-3 text-sm border-b text-gray-300">{item.collections}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'types' && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white/10 backdrop-blur-lg border border-white/30">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Collection</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Unique Titles</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Total Instances</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Owners</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Sample Titles</th>
                </tr>
              </thead>
              <tbody className="bg-white/10 backdrop-blur-lg divide-y divide-white/10">
                {data.typeCollectionDuplicates.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white/10 backdrop-blur-lg' : 'bg-white/5'}>
                    <td className="px-4 py-3 text-sm border-b font-medium text-white">{item.type_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm border-b">{item.collection_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm border-b">{item.unique_titles}</td>
                    <td className="px-4 py-3 text-sm border-b">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                        {item.total_instances}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm border-b">{item.unique_owners}</td>
                    <td className="px-4 py-3 text-sm border-b text-gray-300 max-w-xs truncate">{item.sample_titles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white/10 backdrop-blur-lg border border-white/30">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">NFT Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Collection</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Rarity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">Duplicates</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b">% of Total</th>
                </tr>
              </thead>
              <tbody className="bg-white/10 backdrop-blur-lg divide-y divide-white/10">
                {data.topPatterns.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white/10 backdrop-blur-lg' : 'bg-white/5'}>
                    <td className="px-4 py-3 text-sm border-b font-medium text-white">{item.nft_title}</td>
                    <td className="px-4 py-3 text-sm border-b">{item.collection_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm border-b">{item.type_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm border-b">{item.rarity_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm border-b">{item.level_value || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm border-b">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-600 text-red-200">
                        {item.duplicate_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm border-b">{item.percentage_of_total}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
