'use client';

import React, { useState, useEffect } from 'react';
import NFTReservationCard from './NFTReservationCard';

interface UserPortalProps {
  user: any;
  onLogout: () => void;
}

interface Reservation {
  id: number;
  nftTitle: string;
  nftType: string;
  rarity: string;
  level: number;
  collectionName: string;
  description: string;
  imageUrl: string;
  status: string;
  voucherId: string | null;
  objectId: string | null;
  transactionDigest: string | null;
  createdAt: string;
  mintedAt: string | null;
}

export default function UserPortal({ user, onLogout }: UserPortalProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'reserved' | 'claimed'>('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [collecting, setCollecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadReservations();
  }, [user.email]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/portal/reservations?email=${encodeURIComponent(user.email)}`);
      const data = await response.json();

      if (response.ok) {
        setReservations(data.reservations);
        setStats(data.stats);
      } else {
        console.error('Failed to load reservations:', data.error);
      }
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCollect = async (reservationIds: number[]) => {
    setCollecting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/portal/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, reservationIds }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Successfully collected ${data.results.length} NFT(s)!`,
        });
        // Reload reservations
        await loadReservations();
        setSelectedIds([]);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to collect NFTs' });
    } finally {
      setCollecting(false);
    }
  };

  const handleCollectAll = () => {
    const availableIds = reservations
      .filter((r) => r.status === 'reserved')
      .map((r) => r.id);
    handleCollect(availableIds);
  };

  const handleCollectSelected = () => {
    if (selectedIds.length > 0) {
      handleCollect(selectedIds);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Get unique categories (Genesis, Missions, etc.)
  const categories = Array.from(new Set(reservations.map(r => r.collectionName))).sort();

  // Filter reservations by status and category
  const filteredReservations = reservations.filter((r) => {
    const statusMatch = filter === 'all' || r.status === filter;
    const categoryMatch = selectedCategory === 'all' || r.collectionName === selectedCategory;
    return statusMatch && categoryMatch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReservations = filteredReservations.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, selectedCategory]);

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      Common: 'bg-gray-500',
      Uncommon: 'bg-green-500',
      Rare: 'bg-blue-500',
      Epic: 'bg-purple-500',
      Legendary: 'bg-yellow-500',
    };
    return colors[rarity] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white text-2xl">Loading your NFTs...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome, {user.email}
              </h1>
              <p className="text-gray-300 text-sm">
                Wallet: <span className="font-mono">{user.wallet}</span>
              </p>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-lg border border-red-500/50 transition"
            >
              Logout
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-white">{stats.total}</div>
                <div className="text-gray-300 text-sm">Total NFTs</div>
              </div>
              <div className="bg-green-500/20 rounded-lg p-4 text-center border border-green-500/30">
                <div className="text-3xl font-bold text-green-200">{stats.reserved}</div>
                <div className="text-green-200 text-sm">Available</div>
              </div>
              <div className="bg-blue-500/20 rounded-lg p-4 text-center border border-blue-500/30">
                <div className="text-3xl font-bold text-blue-200">{stats.claimed}</div>
                <div className="text-blue-200 text-sm">Collected</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'all'
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              All ({reservations.length})
            </button>
            <button
              onClick={() => setFilter('reserved')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'reserved'
                  ? 'bg-green-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Available ({stats?.reserved || 0})
            </button>
            <button
              onClick={() => setFilter('claimed')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'claimed'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Collected ({stats?.claimed || 0})
            </button>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm text-gray-300 font-semibold mr-2">Categories:</span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-sm transition ${
                selectedCategory === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-lg text-sm transition ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {category === 'Genesis' ? '🎴 Genesis' : 
                 category === 'Missions' ? '🎯 Missions' : 
                 category} ({reservations.filter(r => r.collectionName === category).length})
              </button>
            ))}
          </div>


          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <div className="text-sm text-gray-300">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredReservations.length)} of {filteredReservations.length} NFTs
            </div>
            <div className="flex gap-2">
              {selectedIds.length > 0 && (
                <button
                  onClick={handleCollectSelected}
                  disabled={collecting}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  Collect Selected ({selectedIds.length})
                </button>
              )}
              {stats?.reserved > 0 && (
                <button
                  onClick={handleCollectAll}
                  disabled={collecting}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {collecting ? 'Collecting...' : `Collect All (${stats.reserved})`}
                </button>
              )}
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-500/20 text-green-200 border border-green-500/50'
                : 'bg-red-500/20 text-red-200 border border-red-500/50'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* NFT Grid */}
      <div className="max-w-7xl mx-auto">
        {filteredReservations.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20">
            <p className="text-gray-300 text-xl">No NFTs found in this category</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedReservations.map((reservation) => (
                <NFTReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  selected={selectedIds.includes(reservation.id)}
                  onSelect={toggleSelection}
                  getRarityColor={getRarityColor}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg transition ${
                          currentPage === pageNum
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

