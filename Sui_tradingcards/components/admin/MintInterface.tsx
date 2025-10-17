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

interface MintCardRequest {
  cardType: string;
  metadataObjectId: string;
  title: string;
  level: number;
  metadataId: string;
  mintedNumber: number;
  recipient: string;
}

export default function MintInterface() {
  const { currentAccount, currentWallet } = useWalletKit();
  
  // Form state
  const [cardType, setCardType] = useState('');
  const [metadataObjectId, setMetadataObjectId] = useState('');
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState<number | ''>('');
  const [metadataId, setMetadataId] = useState('');
  const [mintedNumber, setMintedNumber] = useState<number | ''>('');
  const [recipient, setRecipient] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mintedCardObjectId, setMintedCardObjectId] = useState<string | null>(null);
  
  // Selected card metadata for preview
  const [selectedCardMetadata, setSelectedCardMetadata] = useState<any>(null);

  // Custom hooks
  const { contractAddresses, loading: contractLoading, error: contractError, refetch: refetchContracts } = useContractAddresses();
  const { metadata: availableCardTypes, loading: loadingMetadata, error: metadataError, refetch: refetchMetadata } = useFrontendMetadata();

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

  // Function to get level-specific image
  const getLevelImage = (metadata: any, level: number | '') => {
    // If no level selected, show base image
    if (level === '') {
      return metadata.imageUrl || metadata.mediaUrlPrimary || metadata.mediaUrlDisplay || '';
    }
    
    // Check if metadata has level-specific images
    if (metadata.levelImages && metadata.levelImages[level.toString()]) {
      return metadata.levelImages[level.toString()];
    }
    
    // Check if metadata has levels array with images
    if (metadata.levels && Array.isArray(metadata.levels)) {
      const levelData = metadata.levels.find((l: any) => l.key === level);
      if (levelData && levelData.mediaUrlPrimary) {
        return levelData.mediaUrlPrimary;
      }
      if (levelData && levelData.mediaUrlDisplay) {
        return levelData.mediaUrlDisplay;
      }
    }
    
    // Fallback to base image
    return metadata.imageUrl || metadata.mediaUrlPrimary || metadata.mediaUrlDisplay || '';
  };


  const handleMint = async () => {
    if (!currentAccount || !cardType || !metadataObjectId || !title || !metadataId || level === '' || mintedNumber === '' || !recipient) {
      setError('Please connect wallet and fill all required fields');
      return;
    }

    if (!contractAddresses) {
      setError('Contract addresses not loaded. Please refresh the page to load contract data.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setMintedCardObjectId(null);

    try {
      const { packageId: PACKAGE_ID, adminCapId: ADMIN_CAP_ID } = contractAddresses;
      const TYPE_T = transactionHandler.generateTypeArgument(PACKAGE_ID, cardType);

      // Build the transaction
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::gadget_gameplay_items::mint_and_transfer`,
        typeArguments: [TYPE_T],
        arguments: [
          tx.object(ADMIN_CAP_ID), // admin_cap
          tx.object(metadataObjectId), // item_metadata
          tx.pure.string(title), // title
          tx.pure.u16(level), // level
          tx.pure.id(metadataId), // metadata
          tx.pure.u64(mintedNumber), // minted_number
          tx.pure.address(recipient), // recipient
        ]
      });

      // Execute transaction using the transaction handler
      const result = await transactionHandler.executeTransaction(
        tx,
        currentAccount,
        currentWallet,
        '/api/admin/mint-card',
        {
          cardType,
          metadataObjectId,
          title,
          level,
          metadataId,
          mintedNumber,
          recipient
        }
      );

      if (result.success) {
        if (result.objectId) {
          setMintedCardObjectId(result.objectId);
          setSuccess(`Card minted successfully! Type: ${cardType}, Level: ${level}, Recipient: ${recipient}`);
        } else {
          setSuccess(`Card minted successfully! Type: ${cardType}, Level: ${level}, Recipient: ${recipient} (Object ID not found)`);
        }
        
        // Reset form fields but keep card type and metadata for potential second mint
        setTitle('');
        setMintedNumber(1);
        setRecipient('');
      } else {
        setError(`Mint failed: ${result.error}`);
      }
      
    } catch (err) {
      console.error('Mint error details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to mint card';
      setError(`Mint failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!currentAccount && (
        <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-4">
          <p className="text-white font-medium">
            ⚠️ Please connect your wallet to mint cards
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mint Configuration */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Mint Configuration</h4>
          
          <div className="space-y-4">
            <FormField label="Card Type" required>
              <div className="flex gap-2">
                <SelectField
                  value={cardType}
                  onChange={(value) => {
                    setCardType(value);
                    setLevel(''); // Reset level when card type changes
                    // Auto-populate metadata object ID when card type is selected
                    if (value && availableCardTypes[value]) {
                      const metadata = availableCardTypes[value];
                      setMetadataObjectId(metadata.objectId);
                      setMetadataId(metadata.objectId);
                      setSelectedCardMetadata(metadata);
                    } else {
                      setSelectedCardMetadata(null);
                    }
                  }}
                  options={Object.keys(availableCardTypes).map(type => ({
                    value: type,
                    label: type
                  }))}
                  placeholder="Choose a card type"
                  loading={loadingMetadata}
                  className="flex-1"
                />
                <Button
                  onClick={refetchMetadata}
                  disabled={loadingMetadata}
                  size="sm"
                  className="px-3 py-2"
                >
                  {loadingMetadata ? '...' : '↻'}
                </Button>
              </div>
              {Object.keys(availableCardTypes).length === 0 && !loadingMetadata && (
                <p className="text-sm text-red-200 mt-1">
                  No card types with metadata available. Create metadata first.
                </p>
              )}
            </FormField>

            {/* Image Preview */}
            {selectedCardMetadata && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Card Preview {level !== '' ? `(Level ${level})` : '(Select Level)'}
                </label>
                <div className="border border-white/20 rounded-lg p-4 bg-white/5">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <img
                        src={getLevelImage(selectedCardMetadata, level)}
                        alt={`${cardType} card preview level ${level}`}
                        className="w-20 h-20 object-cover rounded-lg border border-white/30"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCAyMEMzMS4xNjM0IDIwIDI0IDI3LjE2MzQgMjQgMzZDMjQgNDQuODM2NiAzMS4xNjM0IDUyIDQwIDUyQzQ4LjgzNjYgNTIgNTYgNDQuODM2NiA1NiAzNkM1NiAyNy4xNjM0IDQ4LjgzNjYgMjAgNDAgMjBaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yNCA2MEMyNCA2OC44MzY2IDMxLjE2MzQgNzYgNDAgNzZINDhDNTYuODM2NiA3NiA2NCA2OC44MzY2IDY0IDYwVjUySDI0VjYwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white">{cardType}</h4>
                      <p className="text-sm text-gray-300">{selectedCardMetadata.description}</p>
                      <p className="text-xs text-gray-300 mt-1">
                        {level !== '' ? `Level: ${level}` : 'Select a level'} • Version: {selectedCardMetadata.version} • Created: {new Date(selectedCardMetadata.timestamp).toLocaleDateString()}
                      </p>
                      {level !== '' && selectedCardMetadata.levels && selectedCardMetadata.levels.find((l: any) => l.key === level) && (
                        <p className="text-xs text-blue-300 mt-1">
                          {(() => {
                            const levelData = selectedCardMetadata.levels.find((l: any) => l.key === level);
                            return `${levelData.rarity} • ${levelData.enhancement} • Threshold: ${levelData.unlockThreshold}`;
                          })()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <FormField 
              label="Metadata Object ID" 
              required 
              helpText="The object ID of the metadata created from mint_metadata"
            >
              <InputField
                value={metadataObjectId}
                onChange={setMetadataObjectId}
                placeholder="0x..."
              />
            </FormField>

            <FormField 
              label="Metadata ID" 
              required 
              helpText="The ID of the metadata (usually same as Object ID)"
            >
              <InputField
                value={metadataId}
                onChange={setMetadataId}
                placeholder="0x..."
              />
            </FormField>

            <FormField label="Card Title" required>
              <InputField
                value={title}
                onChange={setTitle}
                placeholder="Example Yoyo Card"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Level">
                <select
                  value={level}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setLevel('');
                    } else {
                      const numValue = parseInt(value);
                      setLevel(isNaN(numValue) ? '' : numValue);
                    }
                  }}
                  className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/10 text-white"
                >
                  <option value="">Select a level</option>
                  {selectedCardMetadata && selectedCardMetadata.levels && selectedCardMetadata.levels.map((levelData: any) => (
                    <option key={levelData.key} value={levelData.key}>
                      Level {levelData.key} - {levelData.rarity} ({levelData.enhancement})
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Minted Number">
                <input
                  type="number"
                  value={mintedNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setMintedNumber('');
                    } else {
                      const numValue = parseInt(value);
                      setMintedNumber(isNaN(numValue) ? '' : numValue);
                    }
                  }}
                  className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/10 text-white placeholder-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="1"
                  placeholder="Enter minted number"
                />
              </FormField>
            </div>

            <FormField 
              label="Recipient Address" 
              required 
              helpText="The address that will receive the minted card"
            >
              <InputField
                value={recipient}
                onChange={setRecipient}
                placeholder={currentAccount?.address || "0x..."}
              />
            </FormField>
          </div>
        </div>

        {/* Transaction Preview */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Transaction Preview</h4>
          
          {cardType && metadataObjectId && title && metadataId && recipient ? (
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h5 className="font-semibold text-white mb-3">Function Call</h5>
                <div className="text-sm font-mono text-gray-300 space-y-1">
                  <div><span className="text-blue-200">target:</span> gadget_gameplay_items::mint_and_transfer</div>
                  <div><span className="text-blue-200">type:</span> TradingCard&lt;{cardType}&gt;</div>
                  <div><span className="text-blue-200">admin_cap:</span> ✓ Loaded</div>
                  <div><span className="text-blue-200">item_metadata:</span> {metadataObjectId ? '✓ Set' : 'Not set'}</div>
                  <div><span className="text-blue-200">title:</span> "{title}"</div>
                  <div><span className="text-blue-200">level:</span> {level}</div>
                  <div><span className="text-blue-200">metadata:</span> {metadataId.substring(0, 20)}...</div>
                  <div><span className="text-blue-200">minted_number:</span> {mintedNumber}</div>
                  <div><span className="text-blue-200">recipient:</span> {recipient.substring(0, 20)}...</div>
                </div>
              </div>

              <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-4">
                <h5 className="font-semibold text-blue-200 mb-2">Card Details</h5>
                <div className="text-sm text-white space-y-1">
                  <div><strong>Type:</strong> {cardType}</div>
                  <div><strong>Title:</strong> {title}</div>
                  <div><strong>Level:</strong> {level}</div>
                  <div><strong>Minted Number:</strong> {mintedNumber}</div>
                  <div><strong>Recipient:</strong> {recipient}</div>
                </div>
              </div>

              <Button
                onClick={handleMint}
                disabled={!currentAccount || loading}
                loading={loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Minting Card...' : 'Mint Card'}
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-300 text-4xl mb-2">🪙</div>
              <p className="text-gray-300">Fill in the configuration to preview the transaction</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <StatusMessage
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {success && (
        <div>
          <StatusMessage
            type="success"
            message={success}
            onClose={() => setSuccess(null)}
          />
          {mintedCardObjectId && (
            <div className="mt-3 p-3 bg-green-500/20 border border-green-400/50 rounded-lg">
              <h5 className="font-semibold text-green-200 mb-2">Minted Card Object ID:</h5>
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono text-white break-all">
                  {mintedCardObjectId}
                </p>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(mintedCardObjectId);
                    // You could add a toast notification here
                  }}
                  size="sm"
                  variant="primary"
                  className="ml-2"
                >
                  Copy
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-between items-center">
        <Button
          onClick={() => {
            setCardType('');
            setMetadataObjectId('');
            setTitle('');
            setLevel('');
            setMetadataId('');
            setMintedNumber('');
            setRecipient('');
            setSelectedCardMetadata(null);
            setError(null);
            setSuccess(null);
            setMintedCardObjectId(null);
          }}
          variant="secondary"
        >
          Reset Form
        </Button>
        <div className="text-sm text-gray-300">
          {Object.keys(availableCardTypes).length} card types available
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">How to Use</h4>
        <div className="text-sm text-gray-300 space-y-2">
          <p><strong>Step 1:</strong> First create metadata using the "Mint Metadata" tab</p>
          <p><strong>Step 2:</strong> Copy the metadata object ID from the successful metadata creation</p>
          <p><strong>Step 3:</strong> Fill in the card details above</p>
          <p><strong>Step 4:</strong> Click "Mint Card" to execute the transaction directly with your wallet</p>
        </div>
        
        <div className="mt-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-4">
          <h5 className="font-semibold text-white mb-2">Example Values</h5>
          <div className="text-xs text-gray-300 space-y-1">
            <div><strong>Metadata Object ID:</strong> (from metadata creation)</div>
            <div><strong>Metadata ID:</strong> (same as object ID)</div>
            <div><strong>Title:</strong> Example Yoyo Card</div>
            <div><strong>Level:</strong> 1</div>
            <div><strong>Minted Number:</strong> 12001</div>
          </div>
        </div>
      </div>
    </div>
  );
}