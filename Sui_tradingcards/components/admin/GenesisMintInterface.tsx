"use client";

import { useState, useEffect } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useContractAddresses } from '@/hooks/useContractAddresses';
import { transactionHandler } from '@/utils/transactionUtils';
import { FormField, SelectField, InputField } from '@/components/common/FormField';
import { StatusMessage, LoadingSpinner } from '@/components/common/StatusMessage';
import { Button } from '@/components/common/Button';

interface GenesisMintRequest {
  cardType: string;
  mintNumber: number;
  recipient: string;
}

export default function GenesisMintInterface() {
  const { currentAccount, currentWallet } = useWalletKit();
  
  // Genesis card types (loaded dynamically)
  const [genesisCardTypes, setGenesisCardTypes] = useState<string[]>([]);
  const [loadingCardTypes, setLoadingCardTypes] = useState(false);
  
  // Form state
  const [cardType, setCardType] = useState('');
  const [mintNumber, setMintNumber] = useState(1);
  const [recipient, setRecipient] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mintedCardObjectId, setMintedCardObjectId] = useState<string | null>(null);
  
  // Custom hooks
  const { contractAddresses, loading: contractLoading, error: contractError, refetch: refetchContracts } = useContractAddresses();
  
  // Display objects status (read-only for reference)
  const [displayObjects, setDisplayObjects] = useState<{[key: string]: any}>({});
  const [loadingDisplays, setLoadingDisplays] = useState(false);

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

  // Load display objects and genesis card types on component mount
  useEffect(() => {
    loadDisplayObjects();
    loadGenesisCardTypes();
  }, []);

  // Note: Recipient field is left empty by default so users can enter any address

  const handleMintGenesisCard = async () => {
    if (!currentAccount) {
      setError('Please connect your wallet first');
      return;
    }

    if (!contractAddresses) {
      setError('Contract addresses not loaded. Please ensure contracts are published.');
      return;
    }

    if (!cardType || !recipient || mintNumber <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setMintedCardObjectId(null);

    try {
      console.log('Starting genesis card minting process...');
      console.log('Card Type:', cardType);
      console.log('Mint Number:', mintNumber);
      console.log('Recipient:', recipient);
      console.log('Package ID:', contractAddresses.packageId);
      console.log('Admin Cap ID:', contractAddresses.adminCapId);

      // Build the transaction on frontend
      const tx = new Transaction();
      
      // Set sender address
      tx.setSender(currentAccount.address);
      
      // Set gas budget
      tx.setGasBudget(10000000);

      // Call the mint_and_transfer function from trading_card_genesis module
      tx.moveCall({
        target: `${contractAddresses.packageId}::trading_card_genesis::mint_and_transfer`,
        typeArguments: [`${contractAddresses.packageId}::trading_card_genesis::${cardType}`],
        arguments: [
          tx.object(contractAddresses.adminCapId), // AdminCap
          tx.pure.u64(mintNumber),                // mint_number
          tx.pure.address(recipient),             // recipient
        ],
      });

      console.log('Transaction prepared successfully');

      // Sign the transaction using the connected wallet
      console.log('Signing transaction with wallet...');
      
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
      console.log('Executing transaction via backend...');
      
      const requestData = { 
        transactionBytes: signedTransaction.transactionBlockBytes || tx.serialize(),
        signature: signedTransaction.signature
      };
      
      const executeResponse = await fetch('/api/admin/mint-genesis-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardType,
          mintNumber,
          recipient,
          transactionBytes: requestData.transactionBytes,
          signature: requestData.signature
        })
      });

      if (!executeResponse.ok) {
        const errorData = await executeResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to execute transaction: ${errorData.error || 'Unknown error'}`);
      }

      const txResponse = await executeResponse.json();
      console.log('Transaction executed:', txResponse);

      // Check if the transaction was successful
      if (txResponse?.success === true) {
        setMintedCardObjectId(txResponse.mintedCardObjectId);
        setSuccess(`Genesis ${cardType} minted successfully! Mint Number: ${mintNumber}. Transaction: ${txResponse.transactionDigest}`);
        
        // Reset form for next mint
        setMintNumber(prev => prev + 1);
      } else {
        throw new Error(`Transaction failed: ${txResponse?.error || 'Unknown error'}`);
      }
      
    } catch (err) {
      console.error('Minting error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to mint genesis card';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-purple-800 mb-2">
          🎴 Genesis Card Minting
        </h3>
        <p className="text-purple-700 text-sm">
          Mint commemorative Genesis trading cards using the trading_card_genesis contract
        </p>
      </div>

      {!currentAccount && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">
            ⚠️ Please connect your wallet to mint genesis cards
          </p>
        </div>
      )}


      {/* Display Objects Status (Read-Only Reference) */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Display Objects Status</h4>
        <p className="text-gray-600 text-sm mb-4">
          Display objects are managed in the <strong>Genesis Display</strong> tab. This is a read-only reference.
        </p>
        
        {loadingDisplays ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading display objects...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {genesisCardTypes.map((cardType) => (
              <div key={cardType} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="font-medium text-gray-700">{cardType}</span>
                <div className="flex items-center space-x-2">
                  {displayObjects[cardType] ? (
                    <span className="text-green-600 text-sm">✅ Display exists</span>
                  ) : (
                    <span className="text-red-600 text-sm">❌ No display</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Minting Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Mint Genesis Card</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Card Type *
              </label>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="">Select a card type</option>
                {loadingCardTypes ? (
                  <option disabled>Loading card types...</option>
                ) : (
                  genesisCardTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Mint Number *
              </label>
              <input
                type="number"
                value={mintNumber}
                onChange={(e) => setMintNumber(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Unique serial number for this card
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Recipient Address *
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Wallet address to receive the minted card
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={handleMintGenesisCard}
                disabled={!currentAccount || !contractAddresses || !cardType || !recipient || loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Minting...' : 'Mint Genesis Card'}
              </button>
            </div>
          </div>
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
            <div className="mt-2 p-3 bg-green-100 rounded border border-green-300">
              <p className="text-green-800 text-sm">
                <strong>Minted Card Object ID:</strong>
              </p>
              <p className="text-green-700 text-xs font-mono break-all">
                {mintedCardObjectId}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-800 mb-3">Instructions</h4>
        <div className="text-blue-700 text-sm space-y-2">
          <p><strong>1. Publish Contracts:</strong> First, publish the contracts using the "Publish Contracts" tab to get the Package ID and Admin Cap ID.</p>
          <p><strong>2. Create Displays:</strong> Go to the "Genesis Display" tab to create display objects for each genesis card type.</p>
          <p><strong>3. Mint Cards:</strong> Use the form above to mint genesis cards with unique mint numbers.</p>
          <p><strong>4. View in Wallet:</strong> Minted cards will appear in the recipient's wallet with rich display metadata.</p>
        </div>
      </div>
    </div>
  );
}
