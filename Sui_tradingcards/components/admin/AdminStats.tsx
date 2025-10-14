"use client";

import { useState, useEffect } from 'react';

interface Stats {
  totalConfigurations: number;
  totalMinted: number;
  cardsByType: Record<string, number>;
  recentMints: Array<{
    id: string;
    nftTitle: string;
    cardType: string;
    collectionName: string;
    rarity: string;
    level: number;
    recipient: string;
    recipientEmail: string;
    timestamp: string;
    transactionDigest: string;
    mintNumber: number | null;
    status: string;
    serialNumber: string;
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
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        <p className="mt-2 text-gray-300">Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-200 mb-2">
          Admin Statistics
        </h3>
        <p className="text-white text-sm">
          Overview of trading card configurations and minting activity
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-600 rounded-full">
              <div className="text-2xl">⚙️</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Total Configurations</p>
              <p className="text-2xl font-semibold text-white">{stats.totalConfigurations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-600 rounded-full">
              <div className="text-2xl">🪙</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Total Minted</p>
              <p className="text-2xl font-semibold text-white">{stats.totalMinted}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-600 rounded-full">
              <div className="text-2xl">📊</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300">Card Types</p>
              <p className="text-2xl font-semibold text-white">{Object.keys(stats.cardsByType).length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cards by Type */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Cards by Type</h4>
          {Object.keys(stats.cardsByType).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(stats.cardsByType)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([cardType, count]) => (
                  <div key={cardType} className="flex items-center justify-between py-2 border-b border-white/10 last:border-b-0">
                    <span className="text-sm font-medium text-gray-200">{cardType}</span>
                    <span className="text-sm text-gray-300 bg-gray-600 px-2 py-1 rounded-full">
                      {count} minted
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-300 text-sm">No cards minted yet</p>
            </div>
          )}
        </div>

        {/* Recent Mints */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Recent Mints & Collections</h4>
          {stats.recentMints.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats.recentMints.slice(0, 10).map((mint) => (
                <div key={mint.id} className="border border-white/10 rounded-lg p-3 hover:bg-blue-500/10 transition">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-white">
                          {mint.nftTitle || `${mint.cardType} L${mint.level}`}
                        </span>
                        {mint.status === 'collected' && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                            Collected
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {mint.collectionName} • {mint.cardType} • {mint.rarity}
                      </div>
                    </div>
                    <span className="text-xs text-gray-300 whitespace-nowrap ml-2">
                      {new Date(mint.timestamp).toLocaleDateString()} {new Date(mint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">To:</span>
                      <span className="font-mono">
                        {mint.recipient.startsWith('0x') 
                          ? `${mint.recipient.slice(0, 10)}...${mint.recipient.slice(-8)}`
                          : mint.recipientEmail}
                      </span>
                    </div>
                    {mint.transactionDigest && !mint.transactionDigest.startsWith('pending') && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">TX:</span>
                        <span className="font-mono text-purple-400">
                          {mint.transactionDigest.slice(0, 16)}...
                        </span>
                      </div>
                    )}
                    {mint.mintNumber && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Mint #:</span>
                        <span className="text-blue-400">{mint.mintNumber}</span>
                      </div>
                    )}
                    {mint.serialNumber && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Serial:</span>
                        <span className="text-gray-300">{mint.serialNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🎴</div>
              <p className="text-gray-300 text-sm">No mints or collections yet</p>
              <p className="text-gray-400 text-xs mt-1">
                Mint cards from admin panel or collect from user portal
              </p>
            </div>
          )}
        </div>
      </div>


      <div className="flex justify-end">
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm font-medium"
        >
          Refresh Stats
        </button>
      </div>
    </div>
  );
}

