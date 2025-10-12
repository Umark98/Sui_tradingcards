"use client";

import { useState, useEffect } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useContractAddresses } from '@/hooks/useContractAddresses';
import { transactionHandler } from '@/utils/transactionUtils';
import { FormField, SelectField, InputField } from '@/components/common/FormField';
import { StatusMessage, LoadingSpinner } from '@/components/common/StatusMessage';
import { Button } from '@/components/common/Button';
import { bcs } from '@mysten/sui/bcs';

export default function GenesisDisplayInterface() {
  const { currentAccount, currentWallet } = useWalletKit();
  
  // Contract addresses
  const [contractAddresses, setContractAddresses] = useState<{
    packageId?: string;
    publisherId?: string;
    adminCapId?: string;
    upgradeCapId?: string;
  }>({});
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  
  // Genesis card types (loaded dynamically)
  const [genesisCardTypes, setGenesisCardTypes] = useState<string[]>([]);
  const [loadingCardTypes, setLoadingCardTypes] = useState(false);
  
  // Display objects for genesis cards
  const [displayObjects, setDisplayObjects] = useState<{[key: string]: any}>({});
  const [loadingDisplays, setLoadingDisplays] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Display fields for each card type
  const [displayFields, setDisplayFields] = useState<{[key: string]: {
    name: string;
    image_url: string;
    description: string;
    project_url: string;
    creator: string;
    category: string;
    type: string;
    mint_number: string;
    edition: string;
    royalty: string;
    artist: string;
    copyright: string;
    [key: string]: string; // Allow custom fields
  }}>({});

  // Custom fields for each card type
  const [customFields, setCustomFields] = useState<{[key: string]: Array<{key: string, value: string}>}>({});

  // Currently selected card type for editing
  const [selectedCardType, setSelectedCardType] = useState<string | null>(null);

  // Sui client

  // Load contract addresses
  const loadContractAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const response = await fetch('/api/admin/contract-addresses');
      if (response.ok) {
        const data = await response.json();
        // Extract contractAddresses from the response structure
        if (data.success && data.contractAddresses) {
          setContractAddresses(data.contractAddresses);
          console.log('Loaded contract addresses:', data.contractAddresses);
        } else {
          console.error('Invalid contract addresses response structure:', data);
        }
      }
    } catch (error) {
      console.error('Failed to load contract addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Load display objects for genesis cards
  const loadDisplayObjects = async () => {
    setLoadingDisplays(true);
    try {
      const response = await fetch('/api/admin/genesis-displays');
      if (response.ok) {
        const data = await response.json();
        setDisplayObjects(data);
      }
    } catch (error) {
      console.error('Failed to load display objects:', error);
    } finally {
      setLoadingDisplays(false);
    }
  };

  // Load genesis card types
  const loadGenesisCardTypes = async () => {
    setLoadingCardTypes(true);
    try {
      const response = await fetch('/genesis-card-types.json');
      if (response.ok) {
        const data = await response.json();
        setGenesisCardTypes(data.genesisCardTypes || []);
      }
    } catch (error) {
      console.error('Failed to load genesis card types:', error);
      // Fallback to hardcoded types if file doesn't exist
      setGenesisCardTypes(['CommemorativeCard1', 'CommemorativeCard2', 'CommemorativeCard3', 'CommemorativeCard4']);
    } finally {
      setLoadingCardTypes(false);
    }
  };

  // Initialize display fields for a card type
  const initializeDisplayFields = (cardType: string) => {
    if (!displayFields[cardType]) {
      setDisplayFields(prev => ({
        ...prev,
        [cardType]: {
          name: "",
          image_url: "",
          description: "",
          project_url: "",
          creator: "",
          category: "",
          type: "",
          mint_number: "",
          edition: "",
          royalty: "",
          artist: "",
          copyright: ""
        }
      }));
    }
  };

  // Update display field for a card type
  const updateDisplayField = (cardType: string, field: string, value: string) => {
    setDisplayFields(prev => ({
      ...prev,
      [cardType]: {
        ...prev[cardType],
        [field]: value
      }
    }));
  };

  // Handle card type selection for editing
  const handleCardTypeSelection = (cardType: string) => {
    setSelectedCardType(cardType);
    // Initialize fields if not already done
    initializeDisplayFields(cardType);
    initializeCustomFields(cardType);
  };

  // Initialize custom fields for a card type
  const initializeCustomFields = (cardType: string) => {
    if (!customFields[cardType]) {
      setCustomFields(prev => ({
        ...prev,
        [cardType]: []
      }));
    }
  };

  // Add a new custom field
  const addCustomField = (cardType: string) => {
    setCustomFields(prev => ({
      ...prev,
      [cardType]: [
        ...(prev[cardType] || []),
        { key: '', value: '' }
      ]
    }));
  };

  // Update custom field key
  const updateCustomFieldKey = (cardType: string, index: number, key: string) => {
    setCustomFields(prev => ({
      ...prev,
      [cardType]: prev[cardType].map((field, i) => 
        i === index ? { ...field, key } : field
      )
    }));
  };

  // Update custom field value
  const updateCustomFieldValue = (cardType: string, index: number, value: string) => {
    setCustomFields(prev => ({
      ...prev,
      [cardType]: prev[cardType].map((field, i) => 
        i === index ? { ...field, value } : field
      )
    }));
  };

  // Remove custom field
  const removeCustomField = (cardType: string, index: number) => {
    setCustomFields(prev => ({
      ...prev,
      [cardType]: prev[cardType].filter((_, i) => i !== index)
    }));
  };

  // Load contract addresses, display objects and genesis card types on component mount
  useEffect(() => {
    loadContractAddresses();
    loadDisplayObjects();
    loadGenesisCardTypes();
  }, []);

  // Initialize display fields when card types are loaded
  useEffect(() => {
    genesisCardTypes.forEach(cardType => {
      initializeDisplayFields(cardType);
    });
  }, [genesisCardTypes]);

  const createDisplayForCardType = async (cardType: string) => {
    if (!currentAccount) {
      setError('Please connect your wallet first');
      return;
    }

    if (!contractAddresses.packageId || !contractAddresses.publisherId) {
      setError('Contract addresses not loaded. Please wait and try again.');
      return;
    }

    // Get display fields for this card type
    const fields = displayFields[cardType];
    if (!fields) {
      setError(`Display fields not initialized for ${cardType}. Please refresh the page.`);
      return;
    }

    // Note: We now provide fallback values for all fields, so no validation needed

    setLoading(true);
    setError(null);

    try {
      console.log(`Creating display for ${cardType}...`);

      // Get custom fields for this card type
      const customFieldsForCard = customFields[cardType] || [];
      
      // Create display object using the fields from state
      const standardKeys = [
        "name",
        "image_url",
        "description",
        "project_url",
        "creator",
        "category",
        "type",
        "mint_number",
        "edition",
        "royalty",
        "artist",
        "copyright"
      ];
      
      const standardValues = [
        fields.name || cardType, // Use cardType as fallback for name
        fields.image_url || "https://example.com/placeholder.jpg", // Fallback for image
        fields.description || `A unique Genesis ${cardType} commemorative card`, // Fallback for description
        fields.project_url || "https://example.com", // Fallback for project_url
        fields.creator || "TradingCard Team", // Fallback for creator
        fields.category || "Collectible", // Fallback for category
        fields.type || "Genesis Card", // Fallback for type
        fields.mint_number || "{mint_number}", // Fallback for mint_number
        fields.edition || "Limited Edition", // Fallback for edition
        fields.royalty || "5%", // Fallback for royalty
        fields.artist || "Card Artist", // Fallback for artist
        fields.copyright || "© 2025 TradingCard" // Fallback for copyright
      ];

      // Add custom fields (only include fields with non-empty keys and values)
      const customKeys = customFieldsForCard
        .filter(field => field.key.trim() !== '' && field.value.trim() !== '')
        .map(field => field.key);
      const customValues = customFieldsForCard
        .filter(field => field.key.trim() !== '' && field.value.trim() !== '')
        .map(field => field.value);

      const displayObject = {
        keys: [...standardKeys, ...customKeys],
        values: [...standardValues, ...customValues]
      };

      // Ensure keys and values arrays have the same length
      if (displayObject.keys.length !== displayObject.values.length) {
        throw new Error('Keys and values arrays must have the same length');
      }

      // Ensure we have at least some fields
      if (displayObject.keys.length === 0) {
        throw new Error('Display object must have at least one field');
      }

      console.log('Display object:', displayObject);
      console.log('Package ID:', contractAddresses.packageId);
      console.log('Publisher ID:', contractAddresses.publisherId);
      console.log('Card Type:', cardType);
      console.log('Keys length:', displayObject.keys.length);
      console.log('Values length:', displayObject.values.length);

      // Build transaction
      const tx = new Transaction();
      tx.setSender(currentAccount.address);
      tx.setGasBudget(10000000);

      // Create display object
      const display = tx.moveCall({
        target: "0x2::display::new_with_fields",
        arguments: [
          tx.object(contractAddresses.publisherId),
          tx.pure(bcs.vector(bcs.string()).serialize(displayObject.keys)),
          tx.pure(bcs.vector(bcs.string()).serialize(displayObject.values))
        ],
        typeArguments: [`${contractAddresses.packageId}::trading_card_genesis::Genesis<${contractAddresses.packageId}::trading_card_genesis::${cardType}>`],
      });

      // Update display version
      tx.moveCall({
        target: "0x2::display::update_version",
        arguments: [display],
        typeArguments: [`${contractAddresses.packageId}::trading_card_genesis::Genesis<${contractAddresses.packageId}::trading_card_genesis::${cardType}>`],
      });

      // Transfer display object to signer
      tx.transferObjects([display], currentAccount.address);

      // Sign the transaction using the connected wallet
      // Check if the wallet supports signTransactionBlock feature
      if (!currentWallet.features['sui:signTransactionBlock']) {
        throw new Error('signTransactionBlock feature is not supported by the current wallet');
      }
      
      const signTransaction = currentWallet.features['sui:signTransactionBlock'].signTransactionBlock;
      const signedTransaction = await signTransaction({
        transactionBlock: tx,
        account: currentAccount,
      });

      console.log('Transaction signed successfully');

      // Execute the signed transaction via backend
      const executeResponse = await fetch('/api/admin/create-genesis-display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cardType,
          signedTransaction: signedTransaction
        })
      });

      if (!executeResponse.ok) {
        const errorData = await executeResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to execute transaction: ${errorData.error || 'Unknown error'}`);
      }

      const result = await executeResponse.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Transaction execution failed');
      }

      setSuccess(`Display created successfully for ${cardType}! Display ID: ${result.displayId}`);
      
      // Reload display objects
      loadDisplayObjects();
      
    } catch (err) {
      console.error('Display creation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create display';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  const deleteDisplayForCardType = async (cardType: string) => {
    if (!currentAccount) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/delete-genesis-display', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardType })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to delete display: ${errorData.error || 'Unknown error'}`);
      }

      setSuccess(`Display deleted successfully for ${cardType}!`);
      
      // Reload display objects
      loadDisplayObjects();
      
    } catch (err) {
      console.error('Display deletion error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete display';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!currentAccount && (
        <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-4">
          <p className="text-white font-medium">
            ⚠️ Please connect your wallet to manage display objects
          </p>
        </div>
      )}

      {/* Contract Addresses Status */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-200 mb-2">Contract Addresses Status</h4>
        {loadingAddresses ? (
          <p className="text-gray-300 text-sm">Loading contract addresses...</p>
        ) : contractAddresses.packageId && contractAddresses.publisherId ? (
          <div className="text-sm text-white">
            ✅ Contract addresses loaded successfully
            <div className="mt-1 text-xs text-gray-300">
              Package ID: {contractAddresses.packageId?.slice(0, 8)}...{contractAddresses.packageId?.slice(-8)}
            </div>
          </div>
        ) : (
          <p className="text-red-200 text-sm">❌ Contract addresses not loaded</p>
        )}
      </div>

      {/* Display Fields Configuration */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Configure Display Fields</h4>
        <p className="text-gray-300 text-sm mb-4">
          Select a Genesis card type to configure its display fields. These fields will be used when creating display objects.
        </p>
        
        {loadingCardTypes ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
            <p className="mt-2 text-gray-300">Loading card types...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Card Type Selection Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {genesisCardTypes.map((cardType) => (
                <button
                  key={cardType}
                  onClick={() => handleCardTypeSelection(cardType)}
                  className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                    selectedCardType === cardType
                      ? 'border-purple-400 bg-purple-600 text-white'
                      : 'border-white/20 bg-white/10 backdrop-blur-lg text-gray-200 hover:border-white/30 hover:bg-white/20/5'
                  }`}
                >
                  <div className="text-sm font-medium">{cardType}</div>
                  <div className="text-xs text-gray-300 mt-1">
                    {displayObjects[cardType] ? 'Display exists' : 'No display'}
                  </div>
                </button>
              ))}
            </div>

            {/* Display Fields Form - Only show when a card type is selected */}
            {selectedCardType && (
              <div className="border border-white/20 rounded-lg p-4 bg-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-semibold text-gray-200">Configure {selectedCardType}</h5>
                  <button
                    onClick={() => setSelectedCardType(null)}
                    className="text-gray-300 hover:text-gray-200 text-sm"
                  >
                    ✕ Close
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Name</label>
                    <input
                      type="text"
                      value={displayFields[selectedCardType]?.name || ''}
                      onChange={(e) => updateDisplayField(selectedCardType, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/15 transition-all text-sm"
                      placeholder="Card name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Image URL</label>
                    <input
                      type="url"
                      value={displayFields[selectedCardType]?.image_url || ''}
                      onChange={(e) => updateDisplayField(selectedCardType, 'image_url', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/15 transition-all text-sm"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-200 mb-1">Description</label>
                    <textarea
                      value={displayFields[selectedCardType]?.description || ''}
                      onChange={(e) => updateDisplayField(selectedCardType, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/15 transition-all text-sm"
                      rows={2}
                      placeholder="Card description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Project URL</label>
                    <input
                      type="url"
                      value={displayFields[selectedCardType]?.project_url || ''}
                      onChange={(e) => updateDisplayField(selectedCardType, 'project_url', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/15 transition-all text-sm"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Creator</label>
                    <input
                      type="text"
                      value={displayFields[selectedCardType]?.creator || ''}
                      onChange={(e) => updateDisplayField(selectedCardType, 'creator', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/15 transition-all text-sm"
                      placeholder="Creator name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Category</label>
                    <input
                      type="text"
                      value={displayFields[selectedCardType]?.category || ''}
                      onChange={(e) => updateDisplayField(selectedCardType, 'category', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/15 transition-all text-sm"
                      placeholder="Category"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Type</label>
                    <input
                      type="text"
                      value={displayFields[selectedCardType]?.type || ''}
                      onChange={(e) => updateDisplayField(selectedCardType, 'type', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/15 transition-all text-sm"
                      placeholder="Card type"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Edition</label>
                    <input
                      type="text"
                      value={displayFields[selectedCardType]?.edition || ''}
                      onChange={(e) => updateDisplayField(selectedCardType, 'edition', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/15 transition-all text-sm"
                      placeholder="Edition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Royalty</label>
                    <input
                      type="text"
                      value={displayFields[selectedCardType]?.royalty || ''}
                      onChange={(e) => updateDisplayField(selectedCardType, 'royalty', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/15 transition-all text-sm"
                      placeholder="Royalty percentage"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Artist</label>
                    <input
                      type="text"
                      value={displayFields[selectedCardType]?.artist || ''}
                      onChange={(e) => updateDisplayField(selectedCardType, 'artist', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/15 transition-all text-sm"
                      placeholder="Artist name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Copyright</label>
                    <input
                      type="text"
                      value={displayFields[selectedCardType]?.copyright || ''}
                      onChange={(e) => updateDisplayField(selectedCardType, 'copyright', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/15 transition-all text-sm"
                      placeholder="Copyright notice"
                    />
                  </div>
                </div>

                {/* Custom Fields Section */}
                <div className="mt-6 pt-4 border-t border-white/30">
                  <div className="flex items-center justify-between mb-4">
                    <h6 className="text-sm font-semibold text-gray-200">Custom Fields</h6>
                    <button
                      onClick={() => addCustomField(selectedCardType)}
                      className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs rounded hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                    >
                      + Add Field
                    </button>
                  </div>
                  
                  {customFields[selectedCardType] && customFields[selectedCardType].length > 0 ? (
                    <div className="space-y-3">
                      {customFields[selectedCardType].map((field, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={field.key}
                              onChange={(e) => updateCustomFieldKey(selectedCardType, index, e.target.value)}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/15 transition-all text-sm"
                              placeholder="Field name (e.g., rarity, collection)"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => updateCustomFieldValue(selectedCardType, index, e.target.value)}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/15 transition-all text-sm"
                              placeholder="Field value"
                            />
                          </div>
                          <button
                            onClick={() => removeCustomField(selectedCardType, index)}
                            className="px-2 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs rounded hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-300 text-sm">No custom fields added yet. Click "Add Field" to add custom metadata.</p>
                  )}
                </div>
                
                {/* Submit Button */}
                <div className="mt-6 pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-300">
                      {displayObjects[selectedCardType] ? (
                        <span className="text-green-200">✅ Display object already exists</span>
                      ) : (
                        <span className="text-green-200">✅ Ready to create display object</span>
                      )}
                    </div>
                    <button
                      onClick={() => createDisplayForCardType(selectedCardType)}
                      disabled={loading || !currentAccount || displayObjects[selectedCardType]}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {loading ? 'Creating...' : displayObjects[selectedCardType] ? 'Already Created' : 'Create Display'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
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

    </div>
  );
}

