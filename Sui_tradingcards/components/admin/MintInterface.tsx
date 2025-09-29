"use client";

import { useState, useEffect } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

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
  
  // Initialize Sui client
  const client = new SuiClient({ url: getFullnodeUrl('testnet') });
  
  // Form state
  const [cardType, setCardType] = useState('');
  const [metadataObjectId, setMetadataObjectId] = useState('');
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState(1);
  const [metadataId, setMetadataId] = useState('');
  const [mintedNumber, setMintedNumber] = useState(1);
  const [recipient, setRecipient] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mintedCardObjectId, setMintedCardObjectId] = useState<string | null>(null);
  
  // Contract addresses from published contracts
  const [contractAddresses, setContractAddresses] = useState<{
    packageId: string;
    adminCapId: string;
  } | null>(null);
  
  // Available card types with metadata
  const [availableCardTypes, setAvailableCardTypes] = useState<{[key: string]: any}>({});
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  
  // Selected card metadata for preview
  const [selectedCardMetadata, setSelectedCardMetadata] = useState<any>(null);

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

  // Load available card types with metadata
  const loadAvailableCardTypes = async () => {
    setLoadingMetadata(true);
    try {
      const response = await fetch('/api/admin/metadata-ids');
      if (response.ok) {
        const data = await response.json();
        
        // Filter metadata to only include those that match the current package ID
        const currentPackageId = contractAddresses?.packageId;
        if (currentPackageId) {
          const validMetadata: {[key: string]: any} = {};
          
          Object.entries(data).forEach(([cardType, metadata]: [string, any]) => {
            // Check if the metadata's objectType contains the current package ID
            if (metadata.objectType && metadata.objectType.includes(currentPackageId)) {
              validMetadata[cardType] = metadata;
            } else {
              console.log(`Filtering out ${cardType} - package ID mismatch. Expected: ${currentPackageId}, Found in: ${metadata.objectType}`);
            }
          });
          
          setAvailableCardTypes(validMetadata);
          console.log(`Loaded ${Object.keys(validMetadata).length} valid card types for package ${currentPackageId}`);
        } else {
          // If no contract addresses loaded yet, show all metadata (will be filtered later)
          setAvailableCardTypes(data);
        }
      }
    } catch (error) {
      console.error('Failed to load available card types:', error);
    } finally {
      setLoadingMetadata(false);
    }
  };

  // Load contract addresses and available card types on component mount
  useEffect(() => {
    loadContractAddresses();
    loadAvailableCardTypes();
    
    // Listen for metadata updates from other components
    const handleMetadataUpdate = () => {
      loadAvailableCardTypes();
    };
    
    window.addEventListener('metadataUpdated', handleMetadataUpdate);
    
    return () => {
      window.removeEventListener('metadataUpdated', handleMetadataUpdate);
    };
  }, []);

  // Re-filter metadata when contract addresses change
  useEffect(() => {
    if (contractAddresses?.packageId) {
      loadAvailableCardTypes();
    }
  }, [contractAddresses]);

  // Inspector Gadget card types
  const CARD_TYPES = [
    'AlarmClock', 'AmazonFan', 'Arms', 'Badge', 'BallpointPen', 'BeachShovel',
    'Binoculars', 'BlackDuster', 'BlackMagnifyingGlass', 'BlueBlowDryer',
    'BlueStripedHandkerchief', 'BoatPropellerFan', 'BolloBalls', 'Bone',
    'Brella', 'BucketOfWater', 'CanOpener', 'Candy', 'Card', 'CarMechanicFan',
    'ChopSticks', 'Clippers', 'Coat', 'Coin', 'Copter', 'CopterSpare',
    'CountDraculasHauntedCastleTouristBrochure', 'Daffodils', 'Daisies',
    'DemagnetizedCompass', 'DeskLamp', 'DistressSignalFlag', 'Doll',
    'DuckCall', 'Ears', 'EgyptFan', 'Emergency', 'EverestIslandFan',
    'FeatherDuster', 'FingerprintDustingKit', 'FirecrackerSkates',
    'FishNet', 'FiveHands', 'FlashbulbCamera', 'FlashcubeCamera',
    'Flashlight', 'FlightSafetyLiterature', 'Flippers', 'Fork',
    'FountainPen', 'GadgetMobileKeys', 'GardeningShovel', 'Geraniums',
    'Hand', 'HandOfCards', 'HandheldFlashlight', 'HatTip', 'HeadWheel',
    'IceSkates', 'IdentificationPaper', 'Key', 'Keyboard', 'KitchenKnife',
    'Laser', 'LeftArm', 'LeftArmRetractor', 'LeftBinocular', 'LeftCuff',
    'LeftEar', 'LeftLeg', 'LeftSkate', 'LightBulb', 'Lighter', 'LongShovel',
    'Magnet', 'MagnetShoes', 'Mallet', 'MapOfSouthAfrica', 'MapOfTibet',
    'Match', 'Megaphone', 'MetalFlySwatter', 'Neck', 'Net',
    'NorthPoleCompass', 'Note', 'Notepad', 'OilCan', 'PaperFan',
    'Parachute', 'Pencil', 'Peonies', 'PinkEnvelope', 'PinkHandkerchief',
    'PizzaChefHat', 'PlasticFan', 'PlasticFlySwatter', 'PocketWatch',
    'PocketWatchOnChain', 'PoliceId', 'PoolTube', 'Pot', 'Primroses',
    'PrototypeRadar', 'Pulley', 'Radar', 'RedBlowDryer', 'RedCup',
    'RedDottedHandkerchief', 'RedDuster', 'RedHandleScissors',
    'RedMagnifyingGlass', 'Respirator', 'RightArm', 'RightArmRetractor',
    'RightCuff', 'RightEar', 'RightLeg', 'RocketSkates', 'Roses',
    'SafetyScissors', 'Sail', 'Saw', 'Scissors', 'Screwdriver', 'Shears',
    'Shoehorn', 'Skates', 'Skis', 'SmallCamera', 'SmallMallet', 'Sponge',
    'Spoon', 'Spring', 'Squeegee', 'SteelMagnifyingGlass', 'StrawHat',
    'SurrenderFlag', 'Superbells', 'Telescope', 'TelescopingLegs',
    'Teeth', 'Tie', 'Toothbrush', 'Toothpaste', 'TopSecretGadgetPhone',
    'TrickFlower', 'TwoHands', 'TwoLeftCuffs', 'WaterCannon',
    'WaterGun', 'WaterSkiPropeller', 'WeldingMask', 'WhiteHandkerchief',
    'WinnerFlag', 'WorkLight', 'Wrench', 'YellowHandkerchief', 'Yoyo'
  ];

  const handleMint = async () => {
    if (!currentAccount || !cardType || !metadataObjectId || !title || !metadataId || !recipient) {
      setError('Please connect wallet and fill all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setMintedCardObjectId(null);

    try {
      // Check if contract addresses are loaded
      if (!contractAddresses) {
        throw new Error('Contract addresses not loaded. Please refresh the page to load contract data.');
      }

      const { packageId: PACKAGE_ID, adminCapId: ADMIN_CAP_ID } = contractAddresses;

      // Build the transaction
      const tx = new Transaction();
      
      // Set sender address
      tx.setSender(currentAccount.address);
      
      // Get the type argument based on card type
      const TYPE_T = `${PACKAGE_ID}::gadget_gameplay_items::TradingCard<${PACKAGE_ID}::gadget_gameplay_items_titles::${cardType}>`;
      
      // Call mint_and_transfer function
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

      // Execute the signed transaction via backend
      const executeResponse = await fetch('/api/admin/mint-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cardType: cardType,
          metadataObjectId: metadataObjectId,
          title: title,
          level: level,
          metadataId: metadataId,
          mintedNumber: mintedNumber,
          recipient: recipient,
          transactionBytes: signedTransaction.transaction || signedTransaction.transactionBytes || signedTransaction.bytes || tx.serialize(),
          signature: signedTransaction.signature
        })
      });

      if (!executeResponse.ok) {
        const errorData = await executeResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to execute transaction: ${errorData.error || 'Unknown error'}`);
      }

      const txResponse = await executeResponse.json();

      // Check if the transaction was successful
      if (txResponse?.effects?.status?.status === "success") {
        const createdObjects = txResponse.effects.created || [];
        
        // Find the minted card object from the created objects
        const mintedCard = createdObjects?.find(
          (item) => item.objectType?.includes('TradingCard')
        );

        // Extract the object ID of the minted card
        const cardObjectId = mintedCard?.reference?.objectId || mintedCard?.objectId;
        
        if (cardObjectId) {
          setMintedCardObjectId(cardObjectId);
          setSuccess(`Card minted successfully! Type: ${cardType}, Level: ${level}, Recipient: ${recipient}`);
        } else {
          setSuccess(`Card minted successfully! Type: ${cardType}, Level: ${level}, Recipient: ${recipient} (Object ID not found)`);
        }
        
        // Reset form fields but keep card type and metadata for potential second mint
        setTitle('');
        setMintedNumber(1);
        setRecipient('');
        // Don't reset cardType, metadataObjectId, metadataId, or level to allow easy second mint
      } else {
        throw new Error(`Transaction failed: ${txResponse?.effects?.status?.error || 'Unknown error'}`);
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
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          Mint and Transfer
        </h3>
        <p className="text-green-700 text-sm">
          Mint Inspector Gadget trading cards using the mint_and_transfer function. 
          Ensure you have created metadata first and have the admin capabilities.
        </p>
      </div>

      {!currentAccount && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">
            ⚠️ Please connect your wallet to mint cards
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mint Configuration */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Mint Configuration</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Type *
              </label>
              <div className="flex gap-2">
                <select
                  value={cardType}
                  onChange={(e) => {
                    setCardType(e.target.value);
                    // Auto-populate metadata object ID when card type is selected
                    if (e.target.value && availableCardTypes[e.target.value]) {
                      const metadata = availableCardTypes[e.target.value];
                      setMetadataObjectId(metadata.objectId);
                      setMetadataId(metadata.objectId);
                      setSelectedCardMetadata(metadata);
                    } else {
                      setSelectedCardMetadata(null);
                    }
                  }}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choose a card type</option>
                  {Object.keys(availableCardTypes).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={loadAvailableCardTypes}
                  disabled={loadingMetadata}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loadingMetadata ? '...' : '↻'}
                </button>
              </div>
              {Object.keys(availableCardTypes).length === 0 && (
                <p className="text-sm text-red-600 mt-1">
                  No card types with metadata available. Create metadata first.
                </p>
              )}
            </div>

            {/* Image Preview */}
            {selectedCardMetadata && selectedCardMetadata.imageUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Preview
                </label>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <img
                        src={selectedCardMetadata.imageUrl}
                        alt={`${cardType} card preview`}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCAyMEMzMS4xNjM0IDIwIDI0IDI3LjE2MzQgMjQgMzZDMjQgNDQuODM2NiAzMS4xNjM0IDUyIDQwIDUyQzQ4LjgzNjYgNTIgNTYgNDQuODM2NiA1NiAzNkM1NiAyNy4xNjM0IDQ4LjgzNjYgMjAgNDAgMjBaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yNCA2MEMyNCA2OC44MzY2IDMxLjE2MzQgNzYgNDAgNzZINDhDNTYuODM2NiA3NiA2NCA2OC44MzY2IDY0IDYwVjUySDI0VjYwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-800">{cardType}</h4>
                      <p className="text-sm text-gray-600">{selectedCardMetadata.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Version: {selectedCardMetadata.version} • Created: {new Date(selectedCardMetadata.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metadata Object ID *
              </label>
              <input
                type="text"
                value={metadataObjectId}
                onChange={(e) => setMetadataObjectId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0x..."
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                The object ID of the metadata created from mint_metadata
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metadata ID *
              </label>
              <input
                type="text"
                value={metadataId}
                onChange={(e) => setMetadataId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0x..."
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                The ID of the metadata (usually same as Object ID)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Example Yoyo Card"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level
                </label>
                <input
                  type="number"
                  value={level || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setLevel(isNaN(value) ? 1 : value);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minted Number
                </label>
                <input
                  type="number"
                  value={mintedNumber || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setMintedNumber(isNaN(value) ? 1 : value);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Address *
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={currentAccount?.address || "0x..."}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                The address that will receive the minted card
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Preview */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Transaction Preview</h4>
          
          {cardType && metadataObjectId && title && metadataId && recipient ? (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-800 mb-3">Function Call</h5>
                <div className="text-sm font-mono text-gray-600 space-y-1">
                  <div><span className="text-blue-600">target:</span> gadget_gameplay_items::mint_and_transfer</div>
                  <div><span className="text-blue-600">type:</span> TradingCard&lt;{cardType}&gt;</div>
                  <div><span className="text-blue-600">admin_cap:</span> ✓ Loaded</div>
                  <div><span className="text-blue-600">item_metadata:</span> {metadataObjectId ? '✓ Set' : 'Not set'}</div>
                  <div><span className="text-blue-600">title:</span> "{title}"</div>
                  <div><span className="text-blue-600">level:</span> {level}</div>
                  <div><span className="text-blue-600">metadata:</span> {metadataId.substring(0, 20)}...</div>
                  <div><span className="text-blue-600">minted_number:</span> {mintedNumber}</div>
                  <div><span className="text-blue-600">recipient:</span> {recipient.substring(0, 20)}...</div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-semibold text-blue-800 mb-2">Card Details</h5>
                <div className="text-sm text-blue-700 space-y-1">
                  <div><strong>Type:</strong> {cardType}</div>
                  <div><strong>Title:</strong> {title}</div>
                  <div><strong>Level:</strong> {level}</div>
                  <div><strong>Minted Number:</strong> {mintedNumber}</div>
                  <div><strong>Recipient:</strong> {recipient}</div>
                </div>
              </div>

              <button
                onClick={handleMint}
                disabled={!currentAccount || loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Minting Card...' : 'Mint Card'}
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">🪙</div>
              <p className="text-gray-600">Fill in the configuration to preview the transaction</p>
            </div>
          )}
        </div>
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
          {mintedCardObjectId && (
            <div className="mt-3 p-3 bg-white border border-green-200 rounded-lg">
              <h5 className="font-semibold text-green-800 mb-2">Minted Card Object ID:</h5>
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono text-gray-800 break-all">
                  {mintedCardObjectId}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(mintedCardObjectId);
                    // You could add a toast notification here
                  }}
                  className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => {
            setCardType('');
            setMetadataObjectId('');
            setTitle('');
            setLevel(1);
            setMetadataId('');
            setMintedNumber(1);
            setRecipient('');
            setSelectedCardMetadata(null);
            setError(null);
            setSuccess(null);
            setMintedCardObjectId(null);
          }}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
        >
          Reset Form
        </button>
        <div className="text-sm text-gray-600">
          {Object.keys(availableCardTypes).length} card types available
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">How to Use</h4>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Step 1:</strong> First create metadata using the "Mint Metadata" tab</p>
          <p><strong>Step 2:</strong> Copy the metadata object ID from the successful metadata creation</p>
          <p><strong>Step 3:</strong> Fill in the card details above</p>
          <p><strong>Step 4:</strong> Click "Mint Card" to execute the transaction directly with your wallet</p>
        </div>
        
        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
          <h5 className="font-semibold text-gray-800 mb-2">Example Values</h5>
          <div className="text-xs text-gray-600 space-y-1">
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