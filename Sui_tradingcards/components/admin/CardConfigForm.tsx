"use client";

import { useState, useEffect } from 'react';

interface CardConfig {
  cardType: string;
  objectId: string;
  version: number;
  mintSupply: number;
  game: string;
  description: string;
  transferability: string;
  royalty: number;
  edition: string;
  set: string;
  upgradeable: boolean;
  subType: string;
  season: number | null;
  episodeUtility: number | null;
  unlockCurrency: string | null;
  collectionName: string;
  nftTitle: string;
  rarity: string;
  level: number;
  levels: Array<{
    level: number;
    rarity: string;
    enhancement: string;
    mediaUrlPrimary: string;
    mediaUrlDisplay: string;
    rank: number;
  }>;
}

interface CardDetails {
  cardDetails: {
    title: string;
    type: string;
    collection: string;
    rarity: string;
    level: number;
    totalNfts: number;
    uniqueOwners: number;
    serialRange: {
      min: number;
      max: number;
    };
  };
  topOwners: Array<{
    userId: number;
    email: string;
    name: string;
    ownedCount: number;
    serialRange: {
      first: number;
      last: number;
    };
  }>;
  recentActivity: Array<{
    nftId: number;
    serialNumber: number;
    userEmail: string;
    userName: string;
    rarity: string;
    level: number;
    collection: string;
  }>;
}

interface Rarity {
  rarity_id: number;
  rarity_name: string;
}

interface NFTLevel {
  level_id: number;
  level_value: number;
}

export default function CardConfigForm() {
  const [cardConfigs, setCardConfigs] = useState<CardConfig[]>([]);
  const [filteredConfigs, setFilteredConfigs] = useState<CardConfig[]>([]);
  const [rarities, setRarities] = useState<Rarity[]>([]);
  const [levels, setLevels] = useState<NFTLevel[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLimit, setShowLimit] = useState(20);
  const [selectedRarity, setSelectedRarity] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  
  // Modal and card details state
  const [showModal, setShowModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardConfig | null>(null);
  const [cardDetails, setCardDetails] = useState<CardDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Refetch data when filters change
    if (selectedRarity || selectedLevel || selectedCollection) {
      fetchData();
    }
  }, [selectedRarity, selectedLevel, selectedCollection]);

  useEffect(() => {
    // Filter configurations based on search term
    const filtered = cardConfigs.filter(config => 
      config.cardType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.collectionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredConfigs(filtered);
  }, [cardConfigs, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data...');
      
      // Build query parameters for filtering
      const params = new URLSearchParams();
      if (selectedRarity) params.append('rarity', selectedRarity);
      if (selectedLevel) params.append('level', selectedLevel);
      if (selectedCollection) params.append('collection', selectedCollection);

      const queryString = params.toString();
      const configsUrl = `/api/admin/card-configs${queryString ? `?${queryString}` : ''}`;

      console.log('Fetching from:', configsUrl);

      // Fetch card configurations with collection information
      const [configsResponse, raritiesResponse, levelsResponse] = await Promise.all([
        fetch(configsUrl),
        fetch('/api/nft_rarities'),
        fetch('/api/nft_mint_levels')
      ]);

      console.log('Responses:', {
        configs: configsResponse.ok,
        rarities: raritiesResponse.ok,
        levels: levelsResponse.ok
      });

      if (configsResponse.ok) {
        const configs = await configsResponse.json();
        console.log('Configs loaded:', configs.length);
        setCardConfigs(configs);
        
        // Extract unique collections for filter dropdown
        const uniqueCollections = [...new Set(configs.map((config: CardConfig) => config.collectionName).filter(Boolean))];
        setCollections(uniqueCollections);
      } else {
        console.error('Configs response not ok:', configsResponse.status);
      }

      if (raritiesResponse.ok) {
        const rarities = await raritiesResponse.json();
        console.log('Rarities loaded:', rarities.length);
        setRarities(rarities);
      } else {
        console.error('Rarities response not ok:', raritiesResponse.status);
      }

      if (levelsResponse.ok) {
        const levels = await levelsResponse.json();
        console.log('Levels loaded:', levels.length);
        setLevels(levels);
      } else {
        console.error('Levels response not ok:', levelsResponse.status);
      }

    } catch (err) {
      setError('Failed to load configuration data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      console.log('Loading finished');
    }
  };

  const handleCardClick = async (config: CardConfig) => {
    setSelectedCard(config);
    setShowModal(true);
    setLoadingDetails(true);
    setCardDetails(null);

    try {
      // Build query parameters for the specific card
      const params = new URLSearchParams();
      params.append('cardTitle', config.cardType);
      if (config.rarity) params.append('rarity', config.rarity);
      if (config.level) params.append('level', config.level.toString());
      if (config.collectionName) params.append('collection', config.collectionName);

      const response = await fetch(`/api/admin/card-details?${params.toString()}`);
      
      if (response.ok) {
        const details = await response.json();
        setCardDetails(details);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch card details');
      }
    } catch (err) {
      setError('Failed to fetch card details');
      console.error('Error fetching card details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCard(null);
    setCardDetails(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading configuration data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          Inspector Gadget NFT Configuration
        </h3>
        <p className="text-blue-700 text-sm">
          View and manage existing NFT types, rarities, and levels in your database.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">❌ {error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Configurations */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">Card Configurations</h4>
            <span className="text-sm text-gray-500">{cardConfigs.length} total cards</span>
          </div>
          
          {/* Search and Filter */}
          <div className="mb-4 space-y-4">
            <input
              type="text"
              placeholder="Search cards (e.g., Arms, Legs, Genesis...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Rarity</label>
                <select
                  value={selectedRarity}
                  onChange={(e) => setSelectedRarity(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Rarities</option>
                  {rarities.map(rarity => (
                    <option key={rarity.rarity_id} value={rarity.rarity_name}>
                      {rarity.rarity_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Level</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Levels</option>
                  {levels.map(level => (
                    <option key={level.level_id} value={level.level_value}>
                      Level {level.level_value}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Collection</label>
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Collections</option>
                  {collections.map(collection => (
                    <option key={collection} value={collection}>
                      {collection}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Clear Filters */}
            {(selectedRarity || selectedLevel || selectedCollection) && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSelectedRarity('');
                    setSelectedLevel('');
                    setSelectedCollection('');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear All Filters
                </button>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Showing {Math.min(filteredConfigs.length, showLimit)} of {filteredConfigs.length} results
                {(selectedRarity || selectedLevel || selectedCollection) && (
                  <span className="ml-2 text-blue-600">(filtered)</span>
                )}
              </span>
              {filteredConfigs.length > showLimit && (
                <button
                  onClick={() => setShowLimit(showLimit + 20)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Show More
                </button>
              )}
            </div>
          </div>

          {filteredConfigs.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredConfigs.slice(0, showLimit).map((config) => (
                <div 
                  key={config.objectId} 
                  className="border border-gray-100 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                  onClick={() => handleCardClick(config)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{config.cardType}</span>
                      <span className="text-xs text-gray-500">{config.mintSupply} NFTs</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span><strong>Collection:</strong> {config.collectionName || 'N/A'}</span>
                        {config.rarity && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            config.rarity === 'Legendary' ? 'bg-yellow-100 text-yellow-800' :
                            config.rarity === 'Epic' ? 'bg-purple-100 text-purple-800' :
                            config.rarity === 'Rare' ? 'bg-blue-100 text-blue-800' :
                            config.rarity === 'Uncommon' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {config.rarity}
                          </span>
                        )}
                        {config.level && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                            Lv.{config.level}
                          </span>
                        )}
                      </div>
                      <div><strong>Edition:</strong> {config.edition}</div>
                      <div><strong>Set:</strong> {config.set}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {config.description}
                    </div>
                    <div className="text-xs text-blue-600 font-medium mt-2">
                      Click to view details and users →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">
                {searchTerm ? `No cards found matching "${searchTerm}"` : 'No card configurations found'}
              </p>
            </div>
          )}
        </div>

        {/* Rarities */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Rarities</h4>
          {rarities.length > 0 ? (
            <div className="space-y-2">
              {rarities.map((rarity) => (
                <div key={rarity.rarity_id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                      rarity.rarity_name.toLowerCase() === 'common' ? 'bg-gray-100 text-gray-800' :
                      rarity.rarity_name.toLowerCase() === 'uncommon' ? 'bg-green-100 text-green-800' :
                      rarity.rarity_name.toLowerCase() === 'rare' ? 'bg-blue-100 text-blue-800' :
                      rarity.rarity_name.toLowerCase() === 'epic' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rarity.rarity_name}
                    </span>
                    <span className="text-xs text-gray-500">ID: {rarity.rarity_id}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">No rarities found</p>
            </div>
          )}
        </div>

        {/* Levels */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Mint Levels</h4>
          {levels.length > 0 ? (
            <div className="space-y-2">
              {levels.map((level) => (
                <div key={level.level_id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">Level {level.level_value}</span>
                    <span className="text-xs text-gray-500">ID: {level.level_id}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">No levels found</p>
            </div>
          )}
        </div>
      </div>

      {/* Database Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Database Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Database:</span>
            <span className="ml-2 text-gray-600">tradingdb</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Schema:</span>
            <span className="ml-2 text-gray-600">Original NFT Schema</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Total Tables:</span>
            <span className="ml-2 text-gray-600">14 tables</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Status:</span>
            <span className="ml-2 text-green-600">✅ Connected</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Refresh Data
        </button>
      </div>

      {/* Card Details Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedCard?.cardType}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {selectedCard?.collectionName} Collection
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {loadingDetails ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading card details...</p>
                </div>
              ) : cardDetails ? (
                <div className="space-y-6">
                  {/* Card Overview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Card Overview</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{cardDetails.cardDetails.totalNfts}</div>
                        <div className="text-sm text-gray-600">Total NFTs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{cardDetails.cardDetails.uniqueOwners}</div>
                        <div className="text-sm text-gray-600">Unique Owners</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{cardDetails.cardDetails.serialRange.min}</div>
                        <div className="text-sm text-gray-600">Min Serial</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{cardDetails.cardDetails.serialRange.max}</div>
                        <div className="text-sm text-gray-600">Max Serial</div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center space-x-4">
                      {cardDetails.cardDetails.rarity && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          cardDetails.cardDetails.rarity === 'Legendary' ? 'bg-yellow-100 text-yellow-800' :
                          cardDetails.cardDetails.rarity === 'Epic' ? 'bg-purple-100 text-purple-800' :
                          cardDetails.cardDetails.rarity === 'Rare' ? 'bg-blue-100 text-blue-800' :
                          cardDetails.cardDetails.rarity === 'Uncommon' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {cardDetails.cardDetails.rarity}
                        </span>
                      )}
                      {cardDetails.cardDetails.level && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                          Level {cardDetails.cardDetails.level}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Top Owners */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Top Owners</h4>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="max-h-64 overflow-y-auto">
                        {cardDetails.topOwners.map((owner, index) => (
                          <div key={owner.userId} className="border-b border-gray-100 last:border-b-0 p-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">
                                  #{index + 1} {owner.email}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Serial Range: {owner.serialRange.first} - {owner.serialRange.last}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-blue-600">{owner.ownedCount}</div>
                                <div className="text-xs text-gray-500">owned</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent NFTs */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Recent NFTs</h4>
                    <p className="text-sm text-gray-600 mb-3">Most recently added NFTs of this type in the database</p>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="max-h-64 overflow-y-auto">
                        {cardDetails.recentActivity.map((activity) => (
                          <div key={activity.nftId} className="border-b border-gray-100 last:border-b-0 p-3 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">NFT #{activity.nftId}</div>
                                <div className="text-sm text-gray-600">{activity.userEmail}</div>
                                <div className="text-xs text-gray-500">Owner</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">Serial #{activity.serialNumber}</div>
                                {activity.rarity && (
                                  <div className={`text-xs px-2 py-1 rounded ${
                                    activity.rarity === 'Legendary' ? 'bg-yellow-100 text-yellow-800' :
                                    activity.rarity === 'Epic' ? 'bg-purple-100 text-purple-800' :
                                    activity.rarity === 'Rare' ? 'bg-blue-100 text-blue-800' :
                                    activity.rarity === 'Uncommon' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {activity.rarity}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Failed to load card details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
