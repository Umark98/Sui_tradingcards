"use client";

import { useState, useEffect } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useContractAddresses } from '@/hooks/useContractAddresses';
import { transactionHandler } from '@/utils/transactionUtils';
import { FormField, SelectField, InputField } from '@/components/common/FormField';
import { StatusMessage, LoadingSpinner } from '@/components/common/StatusMessage';
import { Button } from '@/components/common/Button';

interface MissionMintRequest {
  cardType: string;
  mintNumber: number;
  recipient: string;
}

export default function MissionMintInterface() {
  const { currentAccount, currentWallet } = useWalletKit();
  
  // Mission card types (loaded dynamically)
  const [missionCardTypes, setMissionCardTypes] = useState<string[]>([]);
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

  // Get available card types (only those with display objects)
  const availableCardTypes = missionCardTypes.filter(type => displayObjects[type]);

  // Load mission card types and display objects on component mount
  useEffect(() => {
    loadMissionCardTypes();
    loadDisplayObjects();
  }, []);

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

  const handleMintMissionCard = async () => {
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
      console.log('Starting mission card minting process...');
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

      // Call the mint_and_transfer function from genesis_missoncards module
      tx.moveCall({
        target: `${contractAddresses.packageId}::genesis_missoncards::mint_and_transfer`,
        typeArguments: [`${contractAddresses.packageId}::genesis_missoncards::${cardType}`],
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
      
      const executeResponse = await fetch('/api/admin/mint-mission-card', {
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
        setSuccess(`Mission ${cardType} minted successfully! Mint Number: ${mintNumber}. Transaction: ${txResponse.transactionDigest}`);
        
        // Reset form for next mint
        setMintNumber(prev => prev + 1);
      } else {
        throw new Error(`Transaction failed: ${txResponse?.error || 'Unknown error'}`);
      }
      
    } catch (err) {
      console.error('Minting error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to mint mission card';
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
            ⚠️ Please connect your wallet to mint mission cards
          </p>
        </div>
      )}

      {/* Minting Form */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Mint Mission Card</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mission Card Type *
              </label>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
                className="w-full px-3 py-2 border border-white/30 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={loading}
              >
                <option value="">Select a mission card type</option>
                {loadingCardTypes || loadingDisplays ? (
                  <option disabled>Loading card types...</option>
                ) : availableCardTypes.length === 0 ? (
                  <option disabled>No mission card types with displays available</option>
                ) : (
                  availableCardTypes.map((type) => (
                    <option key={type} value={type}>
                      {type} ✅
                    </option>
                  ))
                )}
              </select>
              <p className="text-xs text-gray-300 mt-1">
                Only mission card types with display objects are available for minting
                {availableCardTypes.length > 0 && (
                  <span className="text-green-200"> • {availableCardTypes.length} available</span>
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mint Number *
              </label>
              <input
                type="number"
                value={mintNumber}
                onChange={(e) => setMintNumber(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 border border-white/30 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-300 mt-1">
                Unique serial number for this mission card
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recipient Address *
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-white/30 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-300 mt-1">
                Wallet address to receive the minted mission card
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={handleMintMissionCard}
                disabled={!currentAccount || !contractAddresses || !cardType || !recipient || loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Minting...' : 'Mint Mission Card'}
              </button>
            </div>
          </div>
        </div>
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
          {mintedCardObjectId && (
            <div className="mt-2 p-3 bg-green-600 rounded border border-green-400">
              <p className="text-white text-sm">
                <strong>Minted Mission Card Object ID:</strong>
              </p>
              <p className="text-white text-xs font-mono break-all">
                {mintedCardObjectId}
              </p>
            </div>
          )}
        </div>
      )}


    </div>
  );
}
