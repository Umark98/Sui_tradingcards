"use client";

import { useEffect } from 'react';

interface NFTDetailModalProps {
  reservation: any;
  onClose: () => void;
  getRarityColor: (rarity: string) => string;
}

export default function NFTDetailModal({ reservation, onClose, getRarityColor }: NFTDetailModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Card metadata (common for all cards, title and image vary)
  const cardMetadata = {
    creator: "Gamisodes",
    project_url: "https://www.gamisodes.com",
    intellectual_property: "Inspector Gadget",
    category: "Collectable",
    age_rating: "TV-Y7",
    copyright: "© 2024 Gamisodes & WildBrain. \"Inspector Gadget (Classic)\" courtesy of DHX Media (Toronto) Ltd. -FR3- Field Communication. All rights reserved."
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-white/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex justify-between items-center border-b border-white/20 rounded-t-2xl flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">{reservation.nftTitle}</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-3xl leading-none transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content Grid - Scrollable */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-y-auto flex-1">
          {/* Left Side - Image */}
          <div className="flex flex-col space-y-4">
            <div className="relative bg-gradient-to-br from-purple-900 to-blue-900 rounded-xl overflow-hidden aspect-square flex items-center justify-center border border-white/20">
              {reservation.imageUrl ? (
                <img
                  src={reservation.imageUrl}
                  alt={reservation.nftTitle}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="text-8xl">🎴</div>';
                  }}
                />
              ) : (
                <div className="text-8xl">🎴</div>
              )}
              
              {/* Status Badge */}
              <div className={`absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-bold text-white ${
                reservation.status === 'minted' ? 'bg-green-500' :
                reservation.status === 'claimed' ? 'bg-blue-500' :
                'bg-yellow-500'
              }`}>
                {reservation.status === 'minted' ? '✓ Collected' :
                 reservation.status === 'claimed' ? 'Claimed' :
                 'Available'}
              </div>
              
              {/* Rarity Badge - Only for non-Genesis cards */}
              {reservation.collectionName !== 'Genesis Cards' && reservation.collectionName !== 'Genesis' && reservation.rarity && (
                <div className={`absolute bottom-4 left-4 px-4 py-2 rounded-full text-sm font-bold text-white ${getRarityColor(reservation.rarity)}`}>
                  {reservation.rarity}
                </div>
              )}
            </div>

            {/* Collection Badge */}
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-sm">Collection</p>
              <p className="text-white font-semibold text-lg">{reservation.collectionName || 'Unknown Collection'}</p>
            </div>
          </div>

          {/* Right Side - Metadata */}
          <div className="flex flex-col space-y-4">
            {/* Card Details */}
            <div className="bg-white/5 rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-bold text-white border-b border-white/20 pb-2">Card Details</h3>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="min-w-0">
                  <p className="text-gray-400">Type</p>
                  <p className="text-white font-semibold break-words">{reservation.nftType}</p>
                </div>
                
                <div className="min-w-0">
                  <p className="text-gray-400">Mint Number</p>
                  <p className="text-white font-semibold">#{reservation.level}</p>
                </div>
                
                {/* Card Level - Only for Gadgets */}
                {reservation.collectionName === 'Gadgets' && reservation.cardLevel && (
                  <div>
                    <p className="text-gray-400">Level</p>
                    <p className="text-white font-semibold">{reservation.cardLevel}</p>
                  </div>
                )}
                
                {/* Rarity - Only for cards that have it */}
                {reservation.rarity && (
                  <div>
                    <p className="text-gray-400">Rarity</p>
                    <p className="text-white font-semibold">{reservation.rarity}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata Information */}
            <div className="bg-white/5 rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-bold text-white border-b border-white/20 pb-2">Metadata</h3>
              
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-400">Creator</p>
                  <p className="text-white font-semibold">{cardMetadata.creator}</p>
                </div>
                
                <div>
                  <p className="text-gray-400">Intellectual Property</p>
                  <p className="text-white font-semibold">{cardMetadata.intellectual_property}</p>
                </div>
                
                <div>
                  <p className="text-gray-400">Category</p>
                  <p className="text-white font-semibold">{cardMetadata.category}</p>
                </div>
                
                <div>
                  <p className="text-gray-400">Age Rating</p>
                  <p className="text-white font-semibold">{cardMetadata.age_rating}</p>
                </div>
                
                <div>
                  <p className="text-gray-400">Project</p>
                  <a 
                    href={cardMetadata.project_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-semibold underline"
                  >
                    {cardMetadata.project_url}
                  </a>
                </div>
              </div>
            </div>

            {/* Description */}
            {reservation.description && (
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white border-b border-white/20 pb-2 mb-2">Description</h3>
                <p className="text-gray-300 text-sm">{reservation.description}</p>
              </div>
            )}

            {/* Transaction Info */}
            {reservation.transactionDigest && (
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white border-b border-white/20 pb-2 mb-2">Blockchain Info</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-400">Transaction Digest</p>
                    <p className="text-white font-mono text-xs break-all">{reservation.transactionDigest}</p>
                  </div>
                  {reservation.objectId && (
                    <div>
                      <p className="text-gray-400">Object ID</p>
                      <p className="text-white font-mono text-xs break-all">{reservation.objectId}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Copyright */}
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-gray-400 text-xs leading-relaxed">{cardMetadata.copyright}</p>
            </div>
          </div>

          {/* Close Button - Full width at bottom of grid */}
          <div className="col-span-1 md:col-span-2 flex justify-center pt-4 border-t border-white/10 mt-4">
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

