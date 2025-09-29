"use client";

import { useState, useEffect } from 'react';

interface Stats {
  totalConfigurations: number;
  totalMinted: number;
  cardsByType: Record<string, number>;
  recentMints: Array<{
    id: string;
    cardType: string;
    level: number;
    recipient: string;
    timestamp: string;
    transactionDigest: string;
  }>;
}

export default function AdminStats() {
  const [stats, setStats] = useState<Stats>({
    totalConfigurations: 0,
    totalMinted: 0,
    cardsByType: {},
    recentMints: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      console.log('Fetching stats...');
      const response = await fetch('/api/admin/stats');
      console.log('Stats response:', response.ok);
      const data = await response.json();
      console.log('Stats data:', data);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      console.log('Stats loading finished');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          Admin Statistics
        </h3>
        <p className="text-blue-700 text-sm">
          Overview of trading card configurations and minting activity
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <div className="text-2xl">⚙️</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Configurations</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalConfigurations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <div className="text-2xl">🪙</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Minted</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalMinted}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <div className="text-2xl">📊</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Card Types</p>
              <p className="text-2xl font-semibold text-gray-900">{Object.keys(stats.cardsByType).length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cards by Type */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Cards by Type</h4>
          {Object.keys(stats.cardsByType).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(stats.cardsByType)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([cardType, count]) => (
                  <div key={cardType} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-sm font-medium text-gray-700">{cardType}</span>
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                      {count} minted
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">No cards minted yet</p>
            </div>
          )}
        </div>

        {/* Recent Mints */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Recent Mints</h4>
          {stats.recentMints.length > 0 ? (
            <div className="space-y-3">
              {stats.recentMints.slice(0, 5).map((mint) => (
                <div key={mint.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-gray-800">
                      {mint.cardType} L{mint.level}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(mint.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    <div>To: {mint.recipient.slice(0, 8)}...{mint.recipient.slice(-6)}</div>
                    <div className="font-mono text-gray-500">
                      TX: {mint.transactionDigest.slice(0, 12)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">No recent mints</p>
            </div>
          )}
        </div>
      </div>


      <div className="flex justify-end">
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Refresh Stats
        </button>
      </div>
    </div>
  );
}

