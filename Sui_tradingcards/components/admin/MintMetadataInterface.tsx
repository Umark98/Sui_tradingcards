"use client";

import { useState, useEffect } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

interface MetadataLevel {
  key: number;
  rarity: string;
  enhancement: string;
  unlockThreshold: number;
  mediaUrlPrimary: string;
  mediaUrlDisplay: string;
  rank: number;
}

interface MintMetadataRequest {
  cardType: string;
  version: number;
  keys: number[];
  game?: string;
  description: string;
  rarityValues: string[];
  enhancementValues: string[];
  episodeUtility?: number;
  transferability: string;
  royalty: number;
  unlockCurrency?: string;
  unlockThresholdValues: number[];
  edition?: string;
  set?: string;
  upgradeable: boolean;
  mediaUrlsPrimaryValues: string[];
  mediaUrlsDisplayValues: string[];
  rankValues: number[];
  subType: string;
  season?: number;
}

export default function MintMetadataInterface() {
  const { currentAccount, currentWallet } = useWalletKit();
  
  // Initialize Sui client
  const client = new SuiClient({ url: getFullnodeUrl('testnet') });
  
  // Form state
  const [cardType, setCardType] = useState('');
  const [version, setVersion] = useState(1);
  // Keys are derived from levels array
  const [game, setGame] = useState('');
  
  
  // Contract addresses from published contracts
  const [contractAddresses, setContractAddresses] = useState<{
    packageId: string;
    adminCapId: string;
  } | null>(null);

  // Load contract addresses from published contracts
  const loadContractAddresses = async () => {
    try {
      const response = await fetch('/contract-objects.json');
      if (response.ok) {
        const data = await response.json();
        if (data.packageId && data.adminCapId) {
          setContractAddresses({
            packageId: data.packageId,
            adminCapId: data.adminCapId
          });
        }
      }
    } catch (error) {
      console.error('Failed to load contract addresses:', error);
    }
  };
  const [description, setDescription] = useState('');
  const [episodeUtility, setEpisodeUtility] = useState<number | undefined>();
  const [transferability, setTransferability] = useState('Platform');
  const [royalty, setRoyalty] = useState(500);
  const [unlockCurrency, setUnlockCurrency] = useState('');
  const [edition, setEdition] = useState('');
  const [set, setSet] = useState('');
  const [upgradeable, setUpgradeable] = useState(true);
  const [subType, setSubType] = useState('TradingCard');
  const [season, setSeason] = useState<number | undefined>();
  
  // Levels array
  const [levels, setLevels] = useState<MetadataLevel[]>([
    { key: 1, rarity: 'Common', enhancement: 'Basic', unlockThreshold: 100, mediaUrlPrimary: '', mediaUrlDisplay: '', rank: 1 },
    { key: 2, rarity: 'Uncommon', enhancement: 'Enhanced', unlockThreshold: 200, mediaUrlPrimary: '', mediaUrlDisplay: '', rank: 2 },
    { key: 3, rarity: 'Rare', enhancement: 'Advanced', unlockThreshold: 500, mediaUrlPrimary: '', mediaUrlDisplay: '', rank: 3 }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingMetadata, setExistingMetadata] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load contract addresses on component mount
  useEffect(() => {
    loadContractAddresses();
  }, []);

  // Check for existing metadata
  const checkExistingMetadata = async (cardType: string) => {
    try {
      const response = await fetch('/api/admin/metadata-ids');
      if (response.ok) {
        const metadataIds = await response.json();
        return metadataIds[cardType] || null;
      }
    } catch (error) {
      console.error('Error checking existing metadata:', error);
    }
    return null;
  };

  // Available Inspector Gadget card types (all 159 items from the Move contract)
  const CARD_TYPES = [
    'AlarmClock', 'AmazonFan', 'Arms', 'Badge', 'BallpointPen', 'BeachShovel',
    'Binoculars', 'BlackDuster', 'BlackMagnifyingGlass', 'BlueBlowDryer',
    'BlueStripedHandkerchief', 'BoatPropellerFan', 'BolloBalls', 'Bone',
    'Brella', 'BucketOfWater', 'CanOpener', 'Candy', 'Card', 'CarMechanicFan',
    'ChopSticks', 'Clippers', 'Coat', 'Coin', 'Copter', 'CopterSpare',
    'CountDraculasHauntedCastleTouristBrochure', 'Daffodils', 'Daisies',
    'DemagnetizedCompass', 'DeskLamp', 'DistressSignalFlag', 'Doll',
    'DuckCall', 'Ears', 'EgyptFan', 'Emergency', 'EverestIslandFan',
    'FeatherDuster', 'FingerprintDustingKit', 'FirecrackerSkates', 'FishNet',
    'FiveHands', 'FlashbulbCamera', 'FlashcubeCamera', 'Flashlight',
    'FlightSafetyLiterature', 'Flippers', 'Fork', 'FountainPen',
    'GadgetMobileKeys', 'GardeningShovel', 'Geraniums', 'Hand', 'HandOfCards',
    'HandheldFlashlight', 'HatTip', 'HeadWheel', 'IceSkates',
    'IdentificationPaper', 'Key', 'Keyboard', 'KitchenKnife', 'Laser',
    'LeftArm', 'LeftArmRetractor', 'LeftBinocular', 'LeftCuff', 'LeftEar',
    'LeftLeg', 'LeftSkate', 'LightBulb', 'Lighter', 'LongShovel', 'Magnet',
    'MagnetShoes', 'Mallet', 'MapOfSouthAfrica', 'MapOfTibet', 'Match',
    'Megaphone', 'MetalFlySwatter', 'Neck', 'Net', 'NorthPoleCompass', 'Note',
    'Notepad', 'OilCan', 'PaperFan', 'Parachute', 'Pencil', 'Peonies',
    'PinkEnvelope', 'PinkHandkerchief', 'PizzaChefHat', 'PlasticFan',
    'PlasticFlySwatter', 'PocketWatch', 'PocketWatchOnChain', 'PoliceId',
    'PoolTube', 'Pot', 'Primroses', 'PrototypeRadar', 'Pulley', 'Radar',
    'RedBlowDryer', 'RedCup', 'RedDottedHandkerchief', 'RedDuster',
    'RedHandleScissors', 'RedMagnifyingGlass', 'Respirator', 'RightArm',
    'RightArmRetractor', 'RightCuff', 'RightEar', 'RightLeg', 'RocketSkates',
    'Roses', 'SafetyScissors', 'Sail', 'Saw', 'Scissors', 'Screwdriver',
    'Shears', 'Shoehorn', 'Skates', 'Skis', 'SmallCamera', 'SmallMallet',
    'Sponge', 'Spoon', 'Spring', 'Squeegee', 'SteelMagnifyingGlass',
    'StrawHat', 'Superbells', 'SurrenderFlag', 'Teeth', 'Telescope',
    'TelescopingLegs', 'Tie', 'Toothbrush', 'Toothpaste',
    'TopSecretGadgetPhone', 'TrickFlower', 'TwoHands', 'TwoLeftCuffs',
    'WaterCannon', 'WaterGun', 'WaterSkiPropeller', 'WeldingMask',
    'WhiteHandkerchief', 'WinnerFlag', 'WorkLight', 'Wrench',
    'YellowHandkerchief', 'Yoyo'
  ];

  const addLevel = () => {
    const newKey = Math.max(...levels.map(l => l.key)) + 1;
    setLevels([...levels, {
      key: newKey,
      rarity: 'Common',
      enhancement: 'Basic',
      unlockThreshold: 100,
      mediaUrlPrimary: '',
      mediaUrlDisplay: '',
      rank: newKey
    }]);
  };

  const removeLevel = (index: number) => {
    if (levels.length > 1) {
      setLevels(levels.filter((_, i) => i !== index));
    }
  };

  const updateLevel = (index: number, field: keyof MetadataLevel, value: string | number) => {
    const newLevels = [...levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setLevels(newLevels);
  };

  const handleSubmit = async () => {
    if (!currentAccount || !cardType || !description) {
      setError('Please connect wallet and fill required fields');
      return;
    }

    // Check for existing metadata first
    const existing = await checkExistingMetadata(cardType);
    if (existing) {
      setExistingMetadata(existing);
      setShowConfirmDialog(true);
      return;
    }

    // Proceed with minting if no existing metadata
    await proceedWithMinting();
  };

  const proceedWithMinting = async () => {
    setLoading(true);
    setError(null);
    setShowConfirmDialog(false);

    try {
      // Check if contract addresses are loaded
      if (!contractAddresses) {
        throw new Error('Contract addresses not loaded. Please click "Refresh" to load contract data first.');
      }

      const { packageId: PACKAGE_ID, adminCapId: ADMIN_CAP_ID } = contractAddresses;

      // Build the transaction
      const tx = new Transaction();
      
      // Set sender address
      tx.setSender(currentAccount.address);
      
      console.log('Transaction object before signing:', tx);
      console.log('Transaction bytes before signing:', tx.serialize());
      
      // Get the type argument based on card type
      const TYPE_T = `${PACKAGE_ID}::gadget_gameplay_items::TradingCard<${PACKAGE_ID}::gadget_gameplay_items_titles::${cardType}>`;
      
      // Call mint_metadata function
      tx.moveCall({
        target: `${PACKAGE_ID}::gadget_gameplay_items::mint_metadata`,
        typeArguments: [TYPE_T],
        arguments: [
          tx.object(ADMIN_CAP_ID), // admin_cap
          tx.pure.u16(version), // version
          tx.pure.vector('u16', levels.map(l => l.key)), // keys
          tx.pure.option('string', game || undefined), // game
          tx.pure.string(description), // description
          tx.pure.vector('string', levels.map(l => l.rarity)), // rarity_values
          tx.pure.vector('string', levels.map(l => l.enhancement)), // enhancement_values
          tx.pure.option('u64', episodeUtility), // episode_utility
          tx.pure.string(transferability), // transferability
          tx.pure.u16(royalty), // royalty
          tx.pure.option('string', unlockCurrency || undefined), // unlock_currency
          tx.pure.vector('u64', levels.map(l => l.unlockThreshold)), // unlock_threshold_values
          tx.pure.option('string', edition || undefined), // edition
          tx.pure.option('string', set || undefined), // set
          tx.pure.bool(upgradeable), // upgradeable
          tx.pure.vector('string', levels.map(l => l.mediaUrlPrimary)), // media_urls_primary_values
          tx.pure.vector('string', levels.map(l => l.mediaUrlDisplay)), // media_urls_display_values
          tx.pure.vector('u16', levels.map(l => l.rank)), // rank_values
          tx.pure.string(subType), // sub_type
          tx.pure.option('u16', season), // season
        ]
      });

      // Set gas budget
      tx.setGasBudget(10000000);

      // Sign the transaction using the connected wallet
      // Check if the wallet supports signTransaction feature
      if (!currentWallet.features['sui:signTransaction']) {
        throw new Error('signTransaction feature is not supported by the current wallet');
      }
      
      const signTransaction = currentWallet.features['sui:signTransaction'].signTransaction;
      const signedTransaction = await signTransaction({
        transaction: tx,
        account: currentAccount,
      });

      console.log('Transaction signed successfully');
      console.log('Signed transaction object:', signedTransaction);
      console.log('Signed transaction keys:', Object.keys(signedTransaction));
      console.log('signedTransaction.transaction:', signedTransaction.transaction);
      console.log('signedTransaction.transactionBytes:', signedTransaction.transactionBytes);
      console.log('signedTransaction.bytes:', signedTransaction.bytes);

      // Execute the signed transaction via backend
      const requestData = { 
        cardType: cardType,
        version: version,
        keys: levels.map(l => l.key),
        game: game,
        description: description,
        rarityValues: levels.map(l => l.rarity),
        enhancementValues: levels.map(l => l.enhancement),
        episodeUtility: episodeUtility,
        transferability: transferability,
        royalty: royalty,
        unlockCurrency: unlockCurrency,
        unlockThresholdValues: levels.map(l => l.unlockThreshold),
        edition: edition,
        set: set,
        upgradeable: upgradeable,
        mediaUrlsPrimaryValues: levels.map(l => l.mediaUrlPrimary),
        mediaUrlsDisplayValues: levels.map(l => l.mediaUrlDisplay),
        rankValues: levels.map(l => l.rank),
        subType: subType,
        season: season,
        transactionBytes: signedTransaction.transaction || signedTransaction.transactionBytes || signedTransaction.bytes || tx.serialize(),
        signature: signedTransaction.signature
      };
      
      console.log('Sending request data:', requestData);
      console.log('Transaction bytes:', requestData.transactionBytes);
      console.log('Signature:', requestData.signature);
      
      const executeResponse = await fetch('/api/admin/mint-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (!executeResponse.ok) {
        const errorData = await executeResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to execute transaction: ${errorData.error || 'Unknown error'}`);
      }

      const txResponse = await executeResponse.json();

      // Check if the transaction was successful
      if (txResponse?.effects?.status?.status === "success") {
        const createdObjects = txResponse.effects.created || [];
        
        // Find the metadata object ID from the created objects
        const metadataObject = createdObjects?.find(
          (item) => item.objectType?.includes('Metadata')
        );

        setSuccess(`Metadata created successfully! Card Type: ${cardType}`);
        
        // Trigger a refresh of available card types in the mint interface
        // This will be handled by the parent component or a global state update
        window.dispatchEvent(new CustomEvent('metadataUpdated', { 
          detail: { cardType, objectId: metadataObject?.reference.objectId } 
        }));
      } else {
        throw new Error(`Transaction failed: ${txResponse?.effects?.status?.error || 'Unknown error'}`);
      }
      
      // Reset form
      setCardType('');
      setDescription('');
      setLevels([
        { key: 1, rarity: 'Common', enhancement: 'Basic', unlockThreshold: 100, mediaUrlPrimary: '', mediaUrlDisplay: '', rank: 1 },
        { key: 2, rarity: 'Uncommon', enhancement: 'Enhanced', unlockThreshold: 200, mediaUrlPrimary: '', mediaUrlDisplay: '', rank: 2 },
        { key: 3, rarity: 'Rare', enhancement: 'Advanced', unlockThreshold: 500, mediaUrlPrimary: '', mediaUrlDisplay: '', rank: 3 }
      ]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mint metadata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          Mint Trading Card Metadata
        </h3>
        <p className="text-blue-700 text-sm">
          Create metadata for Inspector Gadget trading cards. This defines the properties and levels for a new card type.
        </p>
      </div>


      {!currentAccount && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">
            ⚠️ Please connect your wallet to mint metadata
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metadata Configuration */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Metadata Configuration</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Type *
              </label>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Choose a card type</option>
                {CARD_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Describe this trading card..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Version
                </label>
                <input
                  type="number"
                  value={version || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setVersion(isNaN(value) ? 1 : value);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Royalty (basis points)
                </label>
                <input
                  type="number"
                  value={royalty || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setRoyalty(isNaN(value) ? 500 : value);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="10000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Game
              </label>
              <input
                type="text"
                value={game}
                onChange={(e) => setGame(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Inspector Gadget Game"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edition
                </label>
                <input
                  type="text"
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="First Edition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Set
                </label>
                <input
                  type="text"
                  value={set}
                  onChange={(e) => setSet(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Season 1"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="upgradeable"
                checked={upgradeable}
                onChange={(e) => setUpgradeable(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="upgradeable" className="text-sm font-medium text-gray-700">
                Upgradeable
              </label>
            </div>
          </div>
        </div>

        {/* Levels Configuration */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">Levels Configuration</h4>
            <button
              onClick={addLevel}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Add Level
            </button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {levels.map((level, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-800">Level {level.key}</h5>
                  {levels.length > 1 && (
                    <button
                      onClick={() => removeLevel(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Rarity</label>
                    <select
                      value={level.rarity}
                      onChange={(e) => updateLevel(index, 'rarity', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Common">Common</option>
                      <option value="Uncommon">Uncommon</option>
                      <option value="Rare">Rare</option>
                      <option value="Epic">Epic</option>
                      <option value="Legendary">Legendary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Enhancement</label>
                    <input
                      type="text"
                      value={level.enhancement}
                      onChange={(e) => updateLevel(index, 'enhancement', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Rank</label>
                    <input
                      type="number"
                      value={level.rank || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        updateLevel(index, 'rank', isNaN(value) ? 1 : value);
                      }}
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Unlock Threshold</label>
                    <input
                      type="number"
                      value={level.unlockThreshold || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        updateLevel(index, 'unlockThreshold', isNaN(value) ? 100 : value);
                      }}
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Primary Media URL</label>
                    <input
                      type="url"
                      value={level.mediaUrlPrimary}
                      onChange={(e) => updateLevel(index, 'mediaUrlPrimary', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/image.png"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Display Media URL</label>
                    <input
                      type="url"
                      value={level.mediaUrlDisplay}
                      onChange={(e) => updateLevel(index, 'mediaUrlDisplay', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/display.png"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!currentAccount || loading || !cardType || !description}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Creating Metadata...' : 'Create Metadata'}
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">❌ {error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">✅ {success}</p>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && existingMetadata && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="text-yellow-500 text-2xl mr-3">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-800">
                Metadata Already Exists
              </h3>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-3">
                Metadata for <strong>{cardType}</strong> already exists:
              </p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                <div className="mb-2">
                  <span className="font-medium text-gray-700">Object ID:</span>
                  <span className="ml-2 text-gray-600 font-mono text-xs">
                    {existingMetadata.objectId}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="font-medium text-gray-700">Version:</span>
                  <span className="ml-2 text-gray-600">{existingMetadata.version}</span>
                </div>
                <div className="mb-2">
                  <span className="font-medium text-gray-700">Description:</span>
                  <span className="ml-2 text-gray-600">{existingMetadata.description}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(existingMetadata.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-4">
              Are you sure you want to create new metadata for this card type? This will create a duplicate entry.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setExistingMetadata(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={proceedWithMinting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Yes, Create Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
