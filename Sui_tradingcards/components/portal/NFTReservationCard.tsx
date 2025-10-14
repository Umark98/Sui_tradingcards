'use client';

import React from 'react';

interface NFTReservationCardProps {
  reservation: any;
  selected: boolean;
  onSelect: (id: string | number) => void;
  getRarityColor: (rarity: string) => string;
}

export default function NFTReservationCard({
  reservation,
  selected,
  onSelect,
  getRarityColor,
}: NFTReservationCardProps) {
  const isReserved = reservation.status === 'reserved';

  return (
    <div
      className={`bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden border-2 transition-all transform hover:scale-105 ${
        selected
          ? 'border-purple-500 shadow-lg shadow-purple-500/50'
          : 'border-white/20 hover:border-white/40'
      } ${isReserved ? 'cursor-pointer' : 'opacity-75'}`}
      onClick={() => isReserved && onSelect(reservation.id)}
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
        {reservation.imageUrl ? (
          <img
            src={reservation.imageUrl}
            alt={reservation.nftTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-6xl">🎴</div>
        )}
        
        {/* Status Badge */}
        <div
          className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold ${
            reservation.status === 'reserved'
              ? 'bg-green-500 text-white'
              : reservation.status === 'claimed'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-500 text-white'
          }`}
        >
          {reservation.status === 'reserved' ? '✨ Available' : '✓ Collected'}
        </div>

        {/* Selection Checkbox */}
        {isReserved && (
          <div className="absolute top-2 left-2">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selected
                  ? 'bg-purple-500 border-purple-500'
                  : 'bg-white/20 border-white'
              }`}
            >
              {selected && <span className="text-white text-sm">✓</span>}
            </div>
          </div>
        )}

        {/* Rarity Badge - Only show for non-Genesis cards */}
        {reservation.collectionName !== 'Genesis Cards' && reservation.rarity && (
          <div
            className={`absolute bottom-2 left-2 px-3 py-1 rounded-full text-xs font-bold text-white ${getRarityColor(
              reservation.rarity
            )}`}
          >
            {reservation.rarity}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-bold text-lg mb-1 break-words">
          {reservation.nftTitle}
        </h3>
        
        <p className="text-gray-300 text-sm mb-3">
          {reservation.collectionName || 'Unknown Collection'}
        </p>

        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Type:</span>
          <span className="text-white font-semibold">{reservation.nftType}</span>
        </div>

        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Mint Number:</span>
          <span className="text-white font-semibold">#{reservation.level}</span>
        </div>

        {/* Card Level - Only show for collections that have levels (Gadgets) */}
        {reservation.collectionName === 'Gadgets' && reservation.cardLevel && (
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Level:</span>
            <span className="text-white font-semibold">{reservation.cardLevel}</span>
          </div>
        )}

        {reservation.transactionDigest && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <a
              href={`https://suiexplorer.com/txblock/${reservation.transactionDigest}?network=testnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-xs truncate block"
            >
              View on Explorer →
            </a>
          </div>
        )}

        {reservation.description && (
          <p className="text-gray-400 text-xs mt-2 line-clamp-2">
            {reservation.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white/5 px-4 py-2 text-xs text-gray-400">
        ID: {reservation.id}
      </div>
    </div>
  );
}

