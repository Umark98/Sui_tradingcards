"use client";

import { useState, useEffect } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useContractAddresses } from '@/hooks/useContractAddresses';
import { FormField, SelectField, InputField } from '@/components/common/FormField';
import { StatusMessage, LoadingSpinner } from '@/components/common/StatusMessage';
import { Button } from '@/components/common/Button';
import { bcs } from '@mysten/sui/bcs';

export default function MissionDisplayInterface() {
  const { currentAccount, currentWallet } = useWalletKit();
  
  // Contract addresses
  const [contractAddresses, setContractAddresses] = useState<{
    packageId?: string;
    publisherId?: string;
    adminCapId?: string;
    upgradeCapId?: string;
  }>({});
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  
  // Mission card types (loaded dynamically)
  const [missionCardTypes, setMissionCardTypes] = useState<string[]>([]);
  const [loadingCardTypes, setLoadingCardTypes] = useState(false);
  
  // Display objects for mission cards
  const [displayObjects, setDisplayObjects] = useState<{[key: string]: any}>({});
  const [loadingDisplays, setLoadingDisplays] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mission card descriptions based on city and rarity
  const missionDescriptions: {[key: string]: string} = {
    // Paris Mission Cards
    'MissionParisRare': 'Join Inspector Gadget, Penny, and Brain on their Mission to Paris with this Rare Collector\'s Edition.',
    'MissionParisEpic': 'Join Inspector Gadget, Penny, and Brain on their Mission to Paris with this Epic Collector\'s Edition.',
    'MissionParisLegendary': 'Join Inspector Gadget, Penny, and Brain on their Mission to Paris with this Legendary Collector\'s Edition.',
    'MissionParisUltraCommon': 'Join Inspector Gadget, Penny, and Brain on their Mission to Paris with this Ultra-Common Open Edition.',
    'MissionParisUltraCommonSigned': 'Join Inspector Gadget, Penny, and Brain on their Mission to Paris with this Ultra-Common (Signed) Open Edition. This collectible might be an Open Edition, but it\'s only available as a special giveaway.',
    
    // Dublin Mission Cards
    'MissionDublinSuperLegendary': 'Join Inspector Gadget, Penny, and Brain on their Mission to Dublin with this ANIMATED Super-Legendary Collector\'s Edition. Only the first 50 original Complete Set collectors receive this exclusive animated collectible card.',
    'MissionDublinLegendary': 'Join Inspector Gadget, Penny, and Brain on their Mission to Dublin with this Legendary Collector\'s Edition.',
    'MissionDublinEpic': 'Join Inspector Gadget, Penny, and Brain on their Mission to Dublin with this Epic Collector\'s Edition.',
    'MissionDublinRare': 'Join Inspector Gadget, Penny, and Brain on their Mission to Dublin with this Rare Collector\'s Edition.',
    'MissionDublinUltraCommonSigned': 'Join Inspector Gadget, Penny, and Brain on their Mission to Dublin with this Ultra-Common (Signed) Open Edition. This collectible might be an Open Edition, but it\'s only available as a special giveaway.',
    'MissionDublinUltraCommon': 'Join Inspector Gadget, Penny, and Brain on their Mission to Dublin with this Ultra-Common Open Edition.',
    
    // New York City Mission Cards
    'MissionNewYorkCityUltraCommon': 'Join Inspector Gadget, Penny, and Brain on their Mission to New York City with this Ultra-Common Open Edition.',
    'MissionNewYorkCityLegendary': 'Join Inspector Gadget, Penny, and Brain on their Mission to New York City with this Legendary Collector\'s Edition.',
    'MissionNewYorkCityEpic': 'Join Inspector Gadget, Penny, and Brain on their Mission to New York City with this Epic Collector\'s Edition.',
    'MissionNewYorkCityRare': 'Join Inspector Gadget, Penny, and Brain on their Mission to New York City with this Rare Collector\'s Edition.',
    'MissionNewYorkCityUltraCommonSigned': 'Join Inspector Gadget, Penny, and Brain on their Mission to New York City with this Ultra-Common (Signed) Open Edition. This collectible might be an Open Edition, but it\'s only available as a special giveaway.',
    
    // Sydney Mission Cards
    'MissionSydneyUltraCommon': 'Join Inspector Gadget, Penny, and Brain on their Mission to Sydney with this Ultra-Common Open Edition.',
    'MissionSydneyUltraCommonSigned': 'Join Inspector Gadget, Penny, and Brain on their Mission to Sydney with this Ultra-Common (Signed) Open Edition. This collectible might be an Open Edition, but it\'s only available as a special giveaway.',
    'MissionSydneyRare': 'Join Inspector Gadget, Penny, and Brain on their Mission to Sydney with this Rare Collector\'s Edition.',
    'MissionSydneyEpic': 'Join Inspector Gadget, Penny, and Brain on their Mission to Sydney with this Epic Collector\'s Edition.',
    'MissionSydneyLegendary': 'Join Inspector Gadget, Penny, and Brain on their Mission to Sydney with this Legendary Collector\'s Edition.',
    
    // San Diego Mission Cards
    'MissionSanDiegoUltraCommon': 'Join Inspector Gadget, Penny, and Brain on a thrilling adventure around San Diego, California. The Mission: San Diego Ultra-Common Card starts off with a selfie in the historical "Gadgetland Quarter." An open-edition gem, this is the perfect addition to your Mission Collection of digital cards.',
    'MissionSanDiegoUltraCommonSigned': 'Join Inspector Gadget, Penny, and Brain on a thrilling adventure around San Diego, California. The Mission: San Diego Ultra-Common Card starts off with a selfie in the historical "Gadgetland Quarter." This collectible might be an Open Edition, but it\'s only available as a special giveaway.',
    'MissionSanDiegoRare': 'Join Penny and Brain as they strike a pose in front of the "Gadgetland Quarter" sign in Downtown San Diego. Inspector Gadget, ever the gadgeteer, extends his Go Go Gadget neck high above the sign, adding a touch of whimsy to this fun-filled card.',
    'MissionSanDiegoEpic': 'Embark on an unforgettable adventure at the world-famous San Diego Zoo, where our trio of characters captures a special moment in front of the iconic bronze lion statue. Inspector Gadget\'s Go Go Gadget Coat sends him soaring high in the air, bringing an extra dose of excitement to this epic card.',
    'MissionSanDiegoLegendary': 'Immerse yourself in the breathtaking beauty of Balboa Park as Inspector Gadget, Penny, and Brain leisurely walk amidst the iconic arches. Witness Inspector Gadget\'s Go Go Gadget Legs in action as they explore the park, appreciating San Diego\'s tranquility and natural splendor.',
    
    // Singapore Mission Cards
    'MissionSingaporeUltraCommon': 'Join Inspector Gadget, Penny, and Brain on their Mission to Singapore with this Ultra-Common Collector\'s Edition.',
    
    // Transylvania Mission Cards
    'MissionTransylvaniaUltraCommon': 'Join Inspector Gadget, Penny, and Brain on their Mission to Transylvania with this Ultra-Common Collector\'s Edition.',
    'MissionTransylvaniaUltraCommonSigned': 'Join Inspector Gadget, Penny, and Brain on their Mission to Transylvania with this Ultra-Common Signed Collector\'s Edition.'
  };

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

  // Load display objects for mission cards
  const loadDisplayObjects = async () => {
    setLoadingDisplays(true);
    try {
      const response = await fetch('/api/admin/mission-displays');
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

  // Load mission card types
  const loadMissionCardTypes = async () => {
    setLoadingCardTypes(true);
    try {
      const response = await fetch('/mission-card-types.json');
      if (response.ok) {
        const data = await response.json();
        setMissionCardTypes(data.missionCardTypes || []);
      }
    } catch (error) {
      console.error('Failed to load mission card types:', error);
      // Fallback to hardcoded types if file doesn't exist
      setMissionCardTypes([
        'MissionParisRare', 'MissionParisEpic', 'MissionParisLegendary',
        'MissionDublinSuperLegendary', 'MissionDublinLegendary', 'MissionDublinEpic',
        'MissionNewYorkCityUltraCommon', 'MissionNewYorkCityLegendary', 'MissionNewYorkCityEpic',
        'MissionSydneyUltraCommon', 'MissionSydneyRare', 'MissionSydneyEpic',
        'MissionSanDiegoUltraCommon', 'MissionSanDiegoRare', 'MissionSanDiegoEpic',
        'MissionSingaporeUltraCommon', 'MissionTransylvaniaUltraCommon'
      ]);
    } finally {
      setLoadingCardTypes(false);
    }
  };

  // Load all data on component mount
  useEffect(() => {
    loadContractAddresses();
    loadDisplayObjects();
    loadMissionCardTypes();
  }, []);

  // Initialize display fields for a card type
  const initializeDisplayFields = (cardType: string) => {
    if (!displayFields[cardType]) {
      setDisplayFields(prev => ({
        ...prev,
        [cardType]: {
          name: cardType,
          image_url: '',
          description: `${cardType} - A special mission card`,
          project_url: '',
          creator: 'Trading Card Game',
          category: 'Mission Card',
          type: cardType,
          mint_number: '1',
          edition: 'Genesis',
          royalty: '0',
          artist: 'Mission Artist',
          copyright: '© 2024 Gamisodes & WildBrain. "Inspector Gadget (Classic)" courtesy of DHX Media (Toronto) Ltd. -FR3- Field Communication. All rights reserved.'
        }
      }));
    }
    
    if (!customFields[cardType]) {
      setCustomFields(prev => ({
        ...prev,
        [cardType]: []
      }));
    }
  };

  // Handle card type selection
  const handleCardTypeSelect = (cardType: string) => {
    setSelectedCardType(cardType);
    // Initialize fields if they don't exist
    if (!displayFields[cardType]) {
      initializeDisplayFields(cardType);
    }
  };

  // Update display field
  const updateDisplayField = (cardType: string, field: string, value: string) => {
    setDisplayFields(prev => ({
      ...prev,
      [cardType]: {
        ...prev[cardType],
        [field]: value
      }
    }));
  };

  // Function to auto-fill description for a card type
  const autoFillDescription = (cardType: string) => {
    const description = missionDescriptions[cardType];
    if (description) {
      updateDisplayField(cardType, 'description', description);
    }
  };

  // Function to auto-fill all fields for a card type
  const autoFillAllFields = (cardType: string) => {
    const city = cardType.replace(/^Mission/, '').replace(/(Rare|Epic|Legendary|UltraCommon|UltraCommonSigned|SuperLegendary)$/, '');
    const rarity = cardType.match(/(Rare|Epic|Legendary|UltraCommon|UltraCommonSigned|SuperLegendary)$/)?.[1] || 'Common';
    const description = missionDescriptions[cardType];
    
    setDisplayFields(prev => ({
      ...prev,
      [cardType]: {
        name: `${city} Mission Card`,
        description: description || `${city} mission trading card`,
        image_url: 'https://example.com/mission-card.png',
        project_url: 'https://example.com',
        creator: 'Mission Card Creator',
        category: 'Mission Card',
        type: rarity,
        mint_number: '1',
        edition: 'Genesis',
        royalty: '0',
        artist: 'Mission Artist',
        copyright: '© 2024 Gamisodes & WildBrain. "Inspector Gadget (Classic)" courtesy of DHX Media (Toronto) Ltd. -FR3- Field Communication. All rights reserved.'
      }
    }));
  };

  // Add custom field
  const addCustomField = (cardType: string) => {
    setCustomFields(prev => ({
      ...prev,
      [cardType]: [
        ...(prev[cardType] || []),
        { key: '', value: '' }
      ]
    }));
  };

  // Update custom field
  const updateCustomField = (cardType: string, index: number, key: string, value: string) => {
    setCustomFields(prev => ({
      ...prev,
      [cardType]: prev[cardType].map((field, i) => 
        i === index ? { key, value } : field
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

  // Update existing display object
  const updateDisplayObject = async (cardType: string) => {
    if (!currentAccount) {
      setError('Please connect your wallet first');
      return;
    }

    if (!displayObjects[cardType]) {
      setError('No existing display found for this card type');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const fields = displayFields[cardType];
      
      // Validate required fields
      if (!fields?.name || !fields?.description || !fields?.image_url || 
          !fields?.project_url || !fields?.creator || !fields?.category || 
          !fields?.type || !fields?.edition || !fields?.artist || !fields?.copyright) {
        setError('Please fill in all required fields before updating the display object');
        setLoading(false);
        return;
      }

      const displayId = displayObjects[cardType].displayId;
      console.log('Updating display object:', displayId, 'for card type:', cardType);

      // Build the transaction to update the display
      const tx = new Transaction();
      tx.setSender(currentAccount.address);
      tx.setGasBudget(10000000);

      // Edit the image_url field
      tx.moveCall({
        target: '0x2::display::edit',
        arguments: [
          tx.object(displayId),
          tx.pure(bcs.string().serialize('image_url').toBytes()),
          tx.pure(bcs.string().serialize(fields.image_url).toBytes())
        ],
        typeArguments: [
          `${contractAddresses.packageId}::genesis_missoncards::Genesis<${contractAddresses.packageId}::genesis_missoncards::${cardType}>`
        ]
      });

      // Edit other fields as needed
      const fieldsToUpdate = [
        { key: 'name', value: fields.name },
        { key: 'description', value: fields.description },
        { key: 'project_url', value: fields.project_url },
        { key: 'creator', value: fields.creator },
        { key: 'category', value: fields.category },
        { key: 'type', value: fields.type },
        { key: 'edition', value: fields.edition },
        { key: 'artist', value: fields.artist },
        { key: 'copyright', value: fields.copyright }
      ];

      for (const field of fieldsToUpdate) {
        tx.moveCall({
          target: '0x2::display::edit',
          arguments: [
            tx.object(displayId),
            tx.pure(bcs.string().serialize(field.key).toBytes()),
            tx.pure(bcs.string().serialize(field.value).toBytes())
          ],
          typeArguments: [
            `${contractAddresses.packageId}::genesis_missoncards::Genesis<${contractAddresses.packageId}::genesis_missoncards::${cardType}>`
          ]
        });
      }

      // Update the display version
      tx.moveCall({
        target: '0x2::display::update_version',
        arguments: [tx.object(displayId)],
        typeArguments: [
          `${contractAddresses.packageId}::genesis_missoncards::Genesis<${contractAddresses.packageId}::genesis_missoncards::${cardType}>`
        ]
      });

      // Sign and execute
      if (!currentWallet.features['sui:signTransactionBlock']) {
        throw new Error('signTransactionBlock feature is not supported by the current wallet');
      }
      
      const signTransaction = currentWallet.features['sui:signTransactionBlock'].signTransactionBlock;
      const signedTransaction = await signTransaction({
        transactionBlock: tx,
        account: currentAccount,
      });

      console.log('Transaction signed successfully');

      // Execute via backend
      const executeResponse = await fetch('/api/admin/create-mission-display', {
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

      setSuccess(`Display updated successfully for ${cardType}! All minted cards will now show the updated information.`);
      loadDisplayObjects();
      
    } catch (err) {
      console.error('Display update error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update display';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Create display object
  const createDisplayObject = async (cardType: string) => {
    if (!currentAccount) {
      setError('Please connect your wallet first');
      return;
    }

    if (!contractAddresses?.packageId || !contractAddresses?.publisherId) {
      setError('Contract addresses not loaded. Please ensure contracts are published.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const fields = displayFields[cardType];
      
      // Validate required fields
      if (!fields?.name || !fields?.description || !fields?.image_url || 
          !fields?.project_url || !fields?.creator || !fields?.category || 
          !fields?.type || !fields?.edition || !fields?.artist || !fields?.copyright) {
        setError('Please fill in all required fields before creating the display object');
        setLoading(false);
        return;
      }

      const customFieldsData = customFields[cardType] || [];
      
      // Create display fields object
      const displayData = {
        ...fields,
        ...customFieldsData.reduce((acc, field) => {
          if (field.key && field.value) {
            acc[field.key] = field.value;
          }
          return acc;
        }, {} as {[key: string]: string})
      };

      console.log('Creating display object for:', cardType);
      console.log('Display data:', displayData);

      // Build the transaction
      const tx = new Transaction();
      tx.setSender(currentAccount.address);
      tx.setGasBudget(10000000);

      // Prepare display keys and values (same as genesis display)
      const displayKeys = [
        'name',
        'image_url',
        'description',
        'project_url',
        'creator',
        'category',
        'type',
        'mint_number',
        'edition',
        'royalty',
        'artist',
        'copyright'
      ];

      const displayValues = [
        displayData.name,
        displayData.image_url,
        displayData.description,
        displayData.project_url,
        displayData.creator,
        displayData.category,
        displayData.type,
        '{mint_number}', // Template variable for dynamic mint number
        displayData.edition,
        displayData.royalty || '0',
        displayData.artist,
        displayData.copyright
      ];

      // Create the display object using Sui's built-in display module (same as genesis cards)
      const display = tx.moveCall({
        target: '0x2::display::new_with_fields',
        arguments: [
          tx.object(contractAddresses.publisherId), // publisher
          tx.pure(bcs.vector(bcs.string()).serialize(displayKeys).toBytes()), // keys
          tx.pure(bcs.vector(bcs.string()).serialize(displayValues).toBytes()) // values
        ],
        typeArguments: [
          `${contractAddresses.packageId}::genesis_missoncards::Genesis<${contractAddresses.packageId}::genesis_missoncards::${cardType}>`
        ]
      });

      // Update the display version
      tx.moveCall({
        target: '0x2::display::update_version',
        arguments: [display],
        typeArguments: [
          `${contractAddresses.packageId}::genesis_missoncards::Genesis<${contractAddresses.packageId}::genesis_missoncards::${cardType}>`
        ]
      });

      // Transfer the display object to the sender
      tx.transferObjects([display], currentAccount.address);

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
      const executeResponse = await fetch('/api/admin/create-mission-display', {
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

  return (
    <div className="space-y-6">
      {!currentAccount && (
        <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-4">
          <p className="text-white font-medium">
            ⚠️ Please connect your wallet to create display objects
          </p>
        </div>
      )}

      {/* Contract Addresses Status */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Contract Addresses Status</h4>
        {loadingAddresses ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
            <p className="mt-2 text-gray-300">Loading contract addresses...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border border-white/20 rounded-lg">
              <span className="font-medium text-gray-200">Package ID</span>
              <div className="flex items-center space-x-2">
                {contractAddresses.packageId ? (
                  <span className="text-green-200 text-sm">✅ Loaded</span>
                ) : (
                  <span className="text-red-200 text-sm">❌ Not loaded</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border border-white/20 rounded-lg">
              <span className="font-medium text-gray-200">Publisher ID</span>
              <div className="flex items-center space-x-2">
                {contractAddresses.publisherId ? (
                  <span className="text-green-200 text-sm">✅ Loaded</span>
                ) : (
                  <span className="text-red-200 text-sm">❌ Not loaded</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Display Objects Status */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-lg font-semibold text-white">Display Objects Status</h4>
            <p className="text-sm text-gray-300 mt-1">
              Manage display objects for mission cards by city and rarity
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                const missingDisplays = missionCardTypes.filter(type => !displayObjects[type]);
                if (missingDisplays.length > 0) {
                  if (confirm(`Create display objects for all ${missingDisplays.length} missing mission card types?`)) {
                    // Set up default fields for all missing types using proper descriptions
                    missingDisplays.forEach(type => {
                      autoFillAllFields(type);
                    });
                  }
                } else {
                  alert('All mission card types already have display objects!');
                }
              }}
              className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              disabled={loadingDisplays}
            >
              Bulk Setup
            </button>
            <button
              onClick={loadDisplayObjects}
              className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              disabled={loadingDisplays}
            >
              {loadingDisplays ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        {loadingDisplays ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
            <p className="mt-3 text-gray-200">Loading display objects...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-600 p-4 rounded-lg shadow-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <span className="text-white text-lg">✅</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-100">Display Objects</p>
                    <p className="text-2xl font-bold text-white">
                      {Object.values(displayObjects).filter(Boolean).length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-red-600 p-4 rounded-lg shadow-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <span className="text-white text-lg">❌</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-100">Missing Displays</p>
                    <p className="text-2xl font-bold text-white">
                      {missionCardTypes.length - Object.values(displayObjects).filter(Boolean).length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-600 p-4 rounded-lg shadow-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-100">Total Types</p>
                    <p className="text-2xl font-bold text-white">{missionCardTypes.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Grouped by City */}
            {(() => {
              const groupedByCity = missionCardTypes.reduce((acc, cardType) => {
                const city = cardType.replace(/^Mission/, '').replace(/(Rare|Epic|Legendary|UltraCommon|UltraCommonSigned|SuperLegendary)$/, '');
                if (!acc[city]) acc[city] = [];
                acc[city].push(cardType);
                return acc;
              }, {} as Record<string, string[]>);

              return Object.entries(groupedByCity).map(([city, cardTypes]) => (
                <div key={city} className="border border-white/20 rounded-lg overflow-hidden">
                  <div className="bg-white/5 px-4 py-3 border-b border-white/20">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-white">{city} Mission Cards</h5>
                      <span className="text-sm text-gray-300">
                        {cardTypes.filter(type => displayObjects[type]).length} / {cardTypes.length} displays
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {cardTypes.map((cardType) => (
                        <div key={cardType} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/20">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className={`text-xs ${displayObjects[cardType] ? 'text-green-200' : 'text-red-200'}`}>
                              {displayObjects[cardType] ? '✅' : '❌'}
                            </span>
                            <span className="text-sm font-medium text-gray-200 truncate" title={cardType}>
                              {cardType.replace(/^Mission/, '')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleCardTypeSelect(cardType)}
                              className="px-2 py-1 text-xs rounded bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                            >
                              {displayObjects[cardType] ? 'Edit' : 'Create'}
                            </button>
                            {!displayObjects[cardType] && (
                              <button
                                onClick={() => {
                                  // Set selected card type first
                                  setSelectedCardType(cardType);
                                  // Then auto-fill all fields
                                  setTimeout(() => {
                                    autoFillAllFields(cardType);
                                  }, 100);
                                }}
                                className="px-2 py-1 text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                                title="Quick setup with auto-filled description"
                              >
                                Quick
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Display Object Editor */}
      {selectedCardType && (
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">
              Edit Display Object: {selectedCardType}
            </h4>
            <button
              onClick={() => setSelectedCardType(null)}
              className="px-3 py-1 text-sm bg-white/10 border-2 border-white/30 text-white rounded hover:bg-white/20 hover:border-white/40 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <InputField
                label="Name"
                value={displayFields[selectedCardType]?.name || ''}
                onChange={(value) => updateDisplayField(selectedCardType, 'name', value)}
                placeholder="Card name"
              />
              <InputField
                label="Image URL"
                value={displayFields[selectedCardType]?.image_url || ''}
                onChange={(value) => updateDisplayField(selectedCardType, 'image_url', value)}
                placeholder="https://example.com/image.png"
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-200">Description</label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => autoFillDescription(selectedCardType)}
                      className="px-3 py-1 text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                      disabled={!missionDescriptions[selectedCardType]}
                    >
                      Auto-fill
                    </button>
                    <button
                      type="button"
                      onClick={() => autoFillAllFields(selectedCardType)}
                      className="px-3 py-1 text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                    >
                      Fill All
                    </button>
                  </div>
                </div>
                <InputField
                  type="textarea"
                  value={displayFields[selectedCardType]?.description || ''}
                  onChange={(value) => updateDisplayField(selectedCardType, 'description', value)}
                  placeholder="Card description"
                  rows={4}
                />
                {missionDescriptions[selectedCardType] && (
                  <div className="text-xs text-gray-300 bg-white/5 p-2 rounded border">
                    <strong>Suggested:</strong> {missionDescriptions[selectedCardType]}
                  </div>
                )}
              </div>
              <InputField
                label="Project URL"
                value={displayFields[selectedCardType]?.project_url || ''}
                onChange={(value) => updateDisplayField(selectedCardType, 'project_url', value)}
                placeholder="https://example.com"
              />
              <InputField
                label="Creator"
                value={displayFields[selectedCardType]?.creator || ''}
                onChange={(value) => updateDisplayField(selectedCardType, 'creator', value)}
                placeholder="Creator name"
              />
            </div>

            <div className="space-y-4">
              <InputField
                label="Category"
                value={displayFields[selectedCardType]?.category || ''}
                onChange={(value) => updateDisplayField(selectedCardType, 'category', value)}
                placeholder="Mission Card"
              />
              <InputField
                label="Type"
                value={displayFields[selectedCardType]?.type || ''}
                onChange={(value) => updateDisplayField(selectedCardType, 'type', value)}
                placeholder="Card type"
              />
              <InputField
                label="Mint Number"
                value={displayFields[selectedCardType]?.mint_number || ''}
                onChange={(value) => updateDisplayField(selectedCardType, 'mint_number', value)}
                placeholder="1"
              />
              <InputField
                label="Edition"
                value={displayFields[selectedCardType]?.edition || ''}
                onChange={(value) => updateDisplayField(selectedCardType, 'edition', value)}
                placeholder="Genesis"
              />
              <InputField
                label="Artist"
                value={displayFields[selectedCardType]?.artist || ''}
                onChange={(value) => updateDisplayField(selectedCardType, 'artist', value)}
                placeholder="Artist name"
              />
              <InputField
                label="Copyright"
                value={displayFields[selectedCardType]?.copyright || ''}
                onChange={(value) => updateDisplayField(selectedCardType, 'copyright', value)}
                placeholder="© 2024 Gamisodes & WildBrain. &quot;Inspector Gadget (Classic)&quot; courtesy of DHX Media (Toronto) Ltd. -FR3- Field Communication. All rights reserved."
              />
            </div>
          </div>

          {/* Custom Fields */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-md font-semibold text-white">Custom Fields</h5>
              <button
                onClick={() => addCustomField(selectedCardType)}
                className="px-3 py-1 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Add Custom Field
              </button>
            </div>
            
            <div className="space-y-3">
              {customFields[selectedCardType]?.map((field, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Field name"
                    value={field.key}
                    onChange={(e) => updateCustomField(selectedCardType, index, e.target.value, field.value)}
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/15 transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Field value"
                    value={field.value}
                    onChange={(e) => updateCustomField(selectedCardType, index, field.key, e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:bg-white/15 transition-all"
                  />
                  <button
                    onClick={() => removeCustomField(selectedCardType, index)}
                    className="px-3 py-2 text-sm bg-gradient-to-r from-red-600 to-red-700 text-white rounded hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Create/Update Display Object Button */}
          <div className="mt-6 pt-6 border-t border-white/20">
            {displayObjects[selectedCardType] ? (
              <div className="space-y-3">
                <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-3">
                  <p className="text-blue-200 text-sm">
                    <strong>Display exists!</strong> Display ID: <span className="font-mono text-xs">{displayObjects[selectedCardType].displayId}</span>
                  </p>
                  <p className="text-white text-xs mt-1">
                    You can update the display fields below. This will affect all minted and future cards of this type.
                  </p>
                </div>
                <button
                  onClick={() => updateDisplayObject(selectedCardType)}
                  disabled={!currentAccount || loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Updating Display...' : 'Update Display'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => createDisplayObject(selectedCardType)}
                disabled={!currentAccount || !contractAddresses?.packageId || !contractAddresses?.publisherId || loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Creating Display Object...' : 'Create Display Object'}
              </button>
            )}
          </div>
        </div>
      )}

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
