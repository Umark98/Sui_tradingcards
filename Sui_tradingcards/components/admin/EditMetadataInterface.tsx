"use client";

import { useState, useEffect } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useContractAddresses } from '@/hooks/useContractAddresses';
import { useFrontendMetadata } from '@/hooks/useMetadata';
import { transactionHandler } from '@/utils/transactionUtils';
import { FormField, SelectField, InputField } from '@/components/common/FormField';
import { StatusMessage, LoadingSpinner } from '@/components/common/StatusMessage';
import { Button } from '@/components/common/Button';

interface MetadataLevel {
  key: number;
  rarity: string;
  enhancement: string;
  unlockThreshold: number;
  mediaUrlPrimary: string;
  mediaUrlDisplay: string;
  rank: number;
}

interface EditMetadataRequest {
  cardType: string;
  metadataObjectId: string;
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

export default function EditMetadataInterface() {
  const { currentAccount, currentWallet } = useWalletKit();
  
  // Form state
  const [cardType, setCardType] = useState('');
  const [metadataObjectId, setMetadataObjectId] = useState('');
  const [version, setVersion] = useState(1);
  const [game, setGame] = useState('');
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
  const [selectedMetadata, setSelectedMetadata] = useState<any>(null);

  // Custom hooks
  const { contractAddresses, loading: contractLoading, error: contractError, refetch: refetchContracts } = useContractAddresses();
  const { metadata: availableMetadata, loading: loadingMetadata, error: metadataError, refetch: refetchMetadata } = useFrontendMetadata();

  // Listen for metadata updates from other components
  useEffect(() => {
    const handleMetadataUpdate = () => {
      refetchMetadata();
    };
    
    window.addEventListener('metadataUpdated', handleMetadataUpdate);
    
    return () => {
      window.removeEventListener('metadataUpdated', handleMetadataUpdate);
    };
  }, [refetchMetadata]);

  // Load metadata details when card type is selected
  useEffect(() => {
    if (cardType && availableMetadata[cardType]) {
      const metadata = availableMetadata[cardType];
      setMetadataObjectId(metadata.objectId);
      setVersion(metadata.version || 1);
      setGame(metadata.game || '');
      setDescription(metadata.description || '');
      setEpisodeUtility(metadata.episodeUtility);
      setTransferability(metadata.transferability || 'Platform');
      setRoyalty(metadata.royalty || 500);
      setUnlockCurrency(metadata.unlockCurrency || '');
      setEdition(metadata.edition || '');
      setSet(metadata.set || '');
      setUpgradeable(metadata.upgradeable !== false);
      setSubType(metadata.subType || 'TradingCard');
      setSeason(metadata.season);
      
      // Load levels if available
      if (metadata.levels && Array.isArray(metadata.levels)) {
        setLevels(metadata.levels);
      }
      
      setSelectedMetadata(metadata);
    }
  }, [cardType, availableMetadata]);

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
    if (!currentAccount || !cardType || !metadataObjectId || !description) {
      setError('Please connect wallet and fill required fields');
      return;
    }

    setLoading(true);
    setError(null);

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
      
      // Call edit_metadata function
      tx.moveCall({
        target: `${PACKAGE_ID}::gadget_gameplay_items::edit_metadata`,
        typeArguments: [TYPE_T],
        arguments: [
          tx.object(ADMIN_CAP_ID), // admin_cap
          tx.object(metadataObjectId), // metadata object
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
      tx.setGasBudget(100000000); // 0.1 SUI

      // Sign the transaction using the connected wallet
      if (!currentWallet?.features?.['sui:signTransactionBlock']) {
        throw new Error('signTransactionBlock feature is not supported by the current wallet');
      }
      
      const signTransaction = currentWallet.features['sui:signTransactionBlock'].signTransactionBlock;
      const signedTransaction = await signTransaction({
        transactionBlock: tx as any,
        account: currentAccount,
        chain: 'sui:testnet',
      });

      console.log('Transaction signed successfully');

      // Execute the signed transaction via backend
      const requestData = { 
        cardType: cardType,
        metadataObjectId: metadataObjectId,
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
        transactionBytes: signedTransaction.transactionBlockBytes || tx.serialize(),
        signature: signedTransaction.signature
      };
      
      console.log('Sending request data:', requestData);
      
      const executeResponse = await fetch('/api/admin/edit-metadata', {
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
        setSuccess(`Metadata updated successfully! Card Type: ${cardType}`);
        
        // Trigger a refresh of metadata
        window.dispatchEvent(new CustomEvent('metadataUpdated', { 
          detail: { cardType, objectId: metadataObjectId } 
        }));
      } else {
        throw new Error(`Transaction failed: ${txResponse?.effects?.status?.error || 'Unknown error'}`);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit metadata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!currentAccount && (
        <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-4">
          <p className="text-white font-medium">
            ⚠️ Please connect your wallet to edit metadata
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metadata Configuration */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Edit Metadata Configuration</h4>
          
          <div className="space-y-4">
            <FormField label="Card Type" required>
              <SelectField
                value={cardType}
                onChange={setCardType}
                options={Object.keys(availableMetadata).map(type => ({
                  value: type,
                  label: type
                }))}
                placeholder="Choose a card type to edit"
                loading={loadingMetadata}
                disabled={Object.keys(availableMetadata).length === 0 && !loadingMetadata}
              />
              {Object.keys(availableMetadata).length === 0 && !loadingMetadata && (
                <p className="text-sm text-green-200 mt-1">
                  ✅ No metadata available to edit. Create metadata first using the "Create Metadata" tab.
                </p>
              )}
            </FormField>

            {selectedMetadata && (
              <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-4">
                <h5 className="font-semibold text-blue-200 mb-2">Current Metadata Info</h5>
                <div className="text-sm text-white space-y-1">
                  <p><strong>Object ID:</strong> {selectedMetadata.objectId}</p>
                  <p><strong>Version:</strong> {selectedMetadata.version}</p>
                  <p><strong>Description:</strong> {selectedMetadata.description}</p>
                  <p><strong>Created:</strong> {new Date(selectedMetadata.timestamp).toLocaleString()}</p>
                </div>
              </div>
            )}

            <FormField label="Description" required>
              <InputField
                type="textarea"
                value={description}
                onChange={setDescription}
                placeholder="Describe this trading card..."
                rows={3}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Version">
                <InputField
                  type="number"
                  value={version}
                  onChange={(value) => {
                    const numValue = parseInt(value);
                    setVersion(isNaN(numValue) ? 1 : numValue);
                  }}
                />
              </FormField>
              <FormField label="Royalty (basis points)">
                <InputField
                  type="number"
                  value={royalty}
                  onChange={(value) => {
                    const numValue = parseInt(value);
                    setRoyalty(isNaN(numValue) ? 500 : numValue);
                  }}
                />
              </FormField>
            </div>

            <FormField label="Game">
              <InputField
                value={game}
                onChange={setGame}
                placeholder="Inspector Gadget Game"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Edition
                </label>
                <input
                  type="text"
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                  className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="First Edition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Set
                </label>
                <input
                  type="text"
                  value={set}
                  onChange={(e) => setSet(e.target.value)}
                  className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label htmlFor="upgradeable" className="text-sm font-medium text-gray-200">
                Upgradeable
              </label>
            </div>
          </div>
        </div>

        {/* Levels Configuration */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Levels Configuration</h4>
            <button
              onClick={addLevel}
              className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded text-sm hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Add Level
            </button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {levels.map((level, index) => (
              <div key={index} className="border border-white/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-white">Level {level.key}</h5>
                  {levels.length > 1 && (
                    <button
                      onClick={() => removeLevel(index)}
                      className="text-red-200 hover:text-red-200 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Rarity</label>
                    <select
                      value={level.rarity}
                      onChange={(e) => updateLevel(index, 'rarity', e.target.value)}
                      className="w-full p-2 border border-white/30 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Common">Common</option>
                      <option value="Uncommon">Uncommon</option>
                      <option value="Rare">Rare</option>
                      <option value="Epic">Epic</option>
                      <option value="Legendary">Legendary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Enhancement</label>
                    <input
                      type="text"
                      value={level.enhancement}
                      onChange={(e) => updateLevel(index, 'enhancement', e.target.value)}
                      className="w-full p-2 border border-white/30 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Rank</label>
                    <input
                      type="number"
                      value={level.rank || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        updateLevel(index, 'rank', isNaN(value) ? 1 : value);
                      }}
                      className="w-full p-2 border border-white/30 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Unlock Threshold</label>
                    <input
                      type="number"
                      value={level.unlockThreshold || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        updateLevel(index, 'unlockThreshold', isNaN(value) ? 100 : value);
                      }}
                      className="w-full p-2 border border-white/30 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Primary Media URL</label>
                    <input
                      type="url"
                      value={level.mediaUrlPrimary}
                      onChange={(e) => updateLevel(index, 'mediaUrlPrimary', e.target.value)}
                      className="w-full p-2 border border-white/30 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/image.png"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Display Media URL</label>
                    <input
                      type="url"
                      value={level.mediaUrlDisplay}
                      onChange={(e) => updateLevel(index, 'mediaUrlDisplay', e.target.value)}
                      className="w-full p-2 border border-white/30 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
          disabled={!currentAccount || loading || !cardType || !metadataObjectId || !description}
          className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Updating Metadata...' : 'Update Metadata'}
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4">
          <p className="text-red-200 font-medium">❌ {error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-4">
          <p className="text-green-200 font-medium">✅ {success}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-orange-500/20 border border-orange-400/50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-orange-200 mb-3">How to Edit Metadata</h4>
        <div className="text-white text-sm space-y-2">
          <p><strong>1. Select Card Type:</strong> Choose from existing metadata that you want to edit.</p>
          <p><strong>2. Modify Fields:</strong> Update any metadata fields including description, levels, and properties.</p>
          <p><strong>3. Update Metadata:</strong> Click "Update Metadata" to save your changes to the blockchain.</p>
          <p><strong>4. Changes Take Effect:</strong> Updated metadata will be used for all future card minting.</p>
        </div>
        
        <div className="mt-4 bg-white/10 backdrop-blur-lg border border-orange-200 rounded-lg p-4">
          <h5 className="font-semibold text-orange-200 mb-2">⚠️ Important Notes</h5>
          <div className="text-white text-sm space-y-1">
            <p>• Editing metadata will affect all future cards minted with this metadata</p>
            <p>• Existing cards will not be affected by metadata changes</p>
            <p>• Make sure to test your changes before updating production metadata</p>
          </div>
        </div>
      </div>
    </div>
  );
}
