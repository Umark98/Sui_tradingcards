"use client";

import { useState } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

export default function PublishContractsInterface() {
  const { currentAccount, currentWallet } = useWalletKit();
  
  // Initialize Sui client
  const client = new SuiClient({ url: getFullnodeUrl(process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet') });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [existingData, setExistingData] = useState<any>(null);

  // Check for existing published contracts data
  const checkExistingData = async () => {
    try {
      console.log('Checking for existing published contracts data...');
      const response = await fetch('/api/admin/publish-contracts/save');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Existing data found:', data);
        console.log('Package ID:', data.packageId);
        console.log('Admin Cap ID:', data.adminCapId);
        
        if (data.packageId && (data.adminCapId || data.adminCapObjectId)) {
          console.log('Setting existing data and showing confirmation popup');
          // Normalize the data structure
          const normalizedData = {
            ...data,
            adminCapId: data.adminCapId || data.adminCapObjectId
          };
          setExistingData(normalizedData);
          setShowConfirmation(true);
          return true;
        } else {
          console.log('Package ID or Admin Cap ID missing from existing data');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.log('API error:', errorData);
      }
    } catch (error) {
      console.log('Error checking existing data:', error);
    }
    console.log('No existing data found or data incomplete');
    return false;
  };

  const handlePublishContracts = async () => {
    if (!currentAccount) {
      setError('Please connect your wallet first');
      return;
    }

    console.log('Starting handlePublishContracts...');
    
    // Check for existing data first
    const hasExistingData = await checkExistingData();
    console.log('Has existing data:', hasExistingData);
    
    if (hasExistingData) {
      console.log('Existing data found, showing confirmation popup');
      return; // Wait for user confirmation
    }

    console.log('No existing data, proceeding with publishing...');
    await proceedWithPublishing();
  };

  const proceedWithPublishing = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setPublishResult(null);
    setLoadingStep('Initializing...');
    setShowConfirmation(false);

    try {
      console.log('Starting contract publishing process...');
      console.log('Connected wallet address:', currentAccount.address);
      
      // Get the compiled modules from backend
      setLoadingStep('Compiling contracts...');
      console.log('Compiling contracts...');
      const buildResponse = await fetch('/api/admin/publish-contracts/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderAddress: currentAccount.address })
      });

      console.log('Build response status:', buildResponse.status);

      if (!buildResponse.ok) {
        const errorData = await buildResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Build failed:', errorData);
        throw new Error(`Failed to compile contracts: ${errorData.error || 'Unknown error'}`);
      }

      const { modules, dependencies } = await buildResponse.json();
      console.log('Compilation successful, got modules and dependencies');
      
      if (!modules || !dependencies) {
        throw new Error('No modules or dependencies received from build endpoint');
      }

      // Build the transaction on frontend
      setLoadingStep('Building transaction...');
      console.log('Building transaction on frontend...');
      const tx = new Transaction();
      
      // Set sender address
      tx.setSender(currentAccount.address);
      
      // Let the wallet handle gas estimation automatically
      // tx.setGasBudget() - removed to let wallet calculate optimal gas

      // Publish the package
      const [upgradeCap] = tx.publish({
        modules,
        dependencies,
      });

      // Transfer the upgrade capability to the signer's address
      tx.transferObjects(
        [upgradeCap],
        tx.pure.address(currentAccount.address)
      );

      console.log('Transaction prepared successfully');

      // Sign the transaction using the connected wallet
      setLoadingStep('Signing transaction... Please check your wallet extension for a popup or notification.');
      console.log('Signing transaction with wallet...');
      
      // Check if the wallet supports signTransactionBlock feature
      if (!currentWallet.features['sui:signTransactionBlock']) {
        throw new Error('signTransactionBlock feature is not supported by the current wallet');
      }
      
      const signTransaction = currentWallet.features['sui:signTransactionBlock'].signTransactionBlock;
      
      // Add timeout to wallet signing process
      const signingPromise = signTransaction({
        transactionBlock: tx,
        account: currentAccount,
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        }
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Wallet signing timed out. Please check if your wallet popup is blocked or if you need to approve the transaction in your wallet extension.'));
        }, 120000); // 2 minute timeout
      });
      
      const signedTransaction = await Promise.race([signingPromise, timeoutPromise]);

      console.log('Transaction signed successfully');
      console.log('Signed transaction object:', signedTransaction);
      console.log('Signed transaction keys:', Object.keys(signedTransaction));
      console.log('Signed transaction values:', {
        transaction: signedTransaction.transaction,
        transactionBlock: signedTransaction.transactionBlock,
        bytes: signedTransaction.bytes,
        transactionBytes: signedTransaction.transactionBytes,
        signature: signedTransaction.signature,
        signatures: signedTransaction.signatures
      });

      // Execute the signed transaction via backend
      setLoadingStep('Executing transaction...');
      console.log('Executing transaction via backend...');
      
      // Extract transaction bytes and signature with better error handling
      let transactionBytes, signature;
      
      // Try different possible property names for transaction bytes
      if (signedTransaction.transaction) {
        transactionBytes = signedTransaction.transaction;
      } else if (signedTransaction.transactionBlock) {
        transactionBytes = signedTransaction.transactionBlock;
      } else if (signedTransaction.bytes) {
        transactionBytes = signedTransaction.bytes;
      } else if (signedTransaction.transactionBytes) {
        transactionBytes = signedTransaction.transactionBytes;
      } else if (signedTransaction.transactionBlockBytes) {
        transactionBytes = signedTransaction.transactionBlockBytes;
      } else if (signedTransaction.serializedTransaction) {
        transactionBytes = signedTransaction.serializedTransaction;
      }
      
      // Try different possible property names for signature
      if (signedTransaction.signature) {
        signature = signedTransaction.signature;
      } else if (signedTransaction.signatures && signedTransaction.signatures.length > 0) {
        signature = signedTransaction.signatures[0];
      } else if (signedTransaction.signatures && Array.isArray(signedTransaction.signatures)) {
        // Handle case where signatures is an array of objects
        signature = signedTransaction.signatures[0]?.signature || signedTransaction.signatures[0];
      }
      
      console.log('Extracted transaction data:', {
        hasTransactionBytes: !!transactionBytes,
        hasSignature: !!signature,
        transactionBytesType: typeof transactionBytes,
        signatureType: typeof signature
      });
      
      if (!transactionBytes || !signature) {
        console.error('Failed to extract transaction data. Available properties:', Object.keys(signedTransaction));
        console.error('Full signed transaction object:', signedTransaction);
        
        // Try to serialize the transaction block if we have it
        if (tx && !transactionBytes) {
          try {
            transactionBytes = tx.serialize();
            console.log('Serialized transaction block as fallback');
          } catch (serializeError) {
            console.error('Failed to serialize transaction block:', serializeError);
          }
        }
        
        // If we still don't have transaction bytes, try to get them from the original transaction
        if (!transactionBytes && tx) {
          try {
            // Try to get the serialized bytes from the transaction object
            const serialized = tx.serialize();
            if (serialized && serialized.length > 0) {
              transactionBytes = serialized;
              console.log('Got transaction bytes from transaction.serialize()');
            }
          } catch (error) {
            console.error('Failed to get transaction bytes from transaction object:', error);
          }
        }
        
        if (!transactionBytes || !signature) {
          throw new Error(`Failed to extract transaction data. Transaction bytes: ${!!transactionBytes}, Signature: ${!!signature}. Please check the browser console for detailed information.`);
        }
      }
      
      // Ensure transaction bytes are properly formatted
      let finalTransactionBytes = transactionBytes;
      
      // If transactionBytes is already a Uint8Array or Buffer, convert to base64
      if (transactionBytes instanceof Uint8Array || Buffer.isBuffer(transactionBytes)) {
        finalTransactionBytes = Buffer.from(transactionBytes).toString('base64');
        console.log('Converted transaction bytes from Uint8Array/Buffer to base64');
      } else if (typeof transactionBytes === 'string') {
        // If it's already a string, assume it's base64 encoded
        finalTransactionBytes = transactionBytes;
        console.log('Using transaction bytes as base64 string');
      } else {
        console.error('Unknown transaction bytes format:', typeof transactionBytes);
        throw new Error('Invalid transaction bytes format');
      }
      
      const requestData = { 
        transactionBytes: finalTransactionBytes,
        signature
      };
      console.log('Sending request data with lengths:', {
        transactionBytesLength: finalTransactionBytes?.length || 0,
        signatureLength: signature?.length || 0,
        transactionBytesType: typeof finalTransactionBytes
      });
      
      const executeResponse = await fetch('/api/admin/publish-contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (!executeResponse.ok) {
        const errorData = await executeResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Backend error response:', errorData);
        console.error('Response status:', executeResponse.status);
        console.error('Response headers:', executeResponse.headers);
        throw new Error(`Failed to execute transaction: ${errorData.error || 'Unknown error'}`);
      }

      let txResponse;
      try {
        const responseText = await executeResponse.text();
        console.log('Raw response text:', responseText);
        txResponse = JSON.parse(responseText);
        console.log('Transaction executed:', txResponse);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Response text:', await executeResponse.text());
        throw new Error('Failed to parse transaction response');
      }

      // Check if the transaction was successful
      if (txResponse?.success === true) {
        // Backend has already processed the transaction and saved all data
        const packageID = txResponse.packageId;
        const adminCapId = txResponse.adminCapObjectId || txResponse.adminCapId;
        
        // Prepare transaction data from backend response
        const transactionData = {
          packageId: packageID,
          transactionDigest: txResponse.transactionDigest,
          adminCapObjectId: adminCapId,
          upgradeCapObjectId: txResponse.upgradeCapObjectId,
          publisherObjectId: txResponse.publisherObjectId,
          displayObjectsCount: txResponse.displayObjectsCount,
          allCreatedObjectsCount: txResponse.allCreatedObjectsCount,
          savedToFile: txResponse.savedToFile,
          objectTypesFile: txResponse.objectTypesFile,
          updatedEnvFile: txResponse.updatedEnvFile,
          allObjectTypes: txResponse.allObjectTypes,
          network: 'testnet',
          timestamp: new Date().toISOString()
        };

        setPublishResult(transactionData);
        setSuccess(`Contracts published successfully! Package ID: ${packageID}. All JSON files and environment variables have been updated automatically.`);
        
      } else {
        throw new Error(`Transaction failed: ${txResponse?.error || txResponse?.details || 'Unknown error'}`);
      }
      
    } catch (err) {
      console.error('Publishing error:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to publish contracts';
      
      if (err instanceof Error) {
        if (err.message.includes('timed out')) {
          errorMessage = 'Wallet signing timed out. Please check your wallet extension and try again.';
        } else if (err.message.includes('User rejected')) {
          errorMessage = 'Transaction was rejected by the user.';
        } else if (err.message.includes('popup')) {
          errorMessage = 'Wallet popup was blocked. Please allow popups and try again.';
        } else if (err.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds to pay for gas fees.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="space-y-6">

      {!currentAccount && (
        <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-4">
          <p className="text-white font-medium">
            ⚠️ Please connect your wallet to publish contracts
          </p>
        </div>
      )}

      {/* Confirmation Popup with Glass Effect */}
      {showConfirmation && existingData && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-lg rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">
              Existing Contract Data Found
            </h3>
            <div className="mb-4">
              <p className="text-gray-300 mb-2">
                There is already published contract data:
              </p>
              <div className="bg-white/60 backdrop-blur-sm p-3 rounded-lg text-sm border border-white/30">
                <p><strong>Package ID:</strong> {existingData.packageId}</p>
                <p><strong>Admin Cap ID:</strong> {existingData.adminCapId}</p>
                <p><strong>Timestamp:</strong> {existingData.timestamp}</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4">
              Publishing new contracts will overwrite this data. Are you sure you want to continue?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setExistingData(null);
                }}
                className="flex-1 px-4 py-2 bg-white/60 backdrop-blur-sm text-gray-200 rounded-lg hover:bg-white/20/80 border border-white/30 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={proceedWithPublishing}
                className="flex-1 px-4 py-2 bg-red-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-red-600/90 border border-red-400/30 transition-all duration-200"
              >
                Yes, Overwrite
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Contract Publishing</h4>
        
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h5 className="font-medium text-white mb-2">What will be published:</h5>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Trading Card smart contracts</li>
              <li>• Admin Cap for contract management</li>
              <li>• Upgrade Cap for future updates</li>
              <li>• Display objects for NFT metadata</li>
              <li>• All supporting Move modules</li>
            </ul>
          </div>

          <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-4">
            <h5 className="font-medium text-blue-200 mb-2">Automatic data saving:</h5>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Package ID and transaction digest</li>
              <li>• Admin Cap and Upgrade Cap object IDs</li>
              <li>• All created object IDs and types</li>
              <li>• Display object information</li>
              <li>• Updated .env and Move.toml files</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handlePublishContracts}
            disabled={!currentAccount || loading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (loadingStep || 'Publishing Contracts...') : 'Publish Contracts'}
          </button>
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
        </div>
      )}

      {/* Publish Results */}
      {publishResult && (
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Publishing Results</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300">Package ID</label>
                <p className="text-sm font-mono bg-gray-600 p-2 rounded break-all">
                  {publishResult.packageId}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300">Transaction Digest</label>
                <p className="text-sm font-mono bg-gray-600 p-2 rounded break-all">
                  {publishResult.transactionDigest}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300">Admin Cap Object ID</label>
                <p className="text-sm font-mono bg-gray-600 p-2 rounded break-all">
                  {publishResult.adminCapObjectId}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300">Upgrade Cap Object ID</label>
                <p className="text-sm font-mono bg-gray-600 p-2 rounded break-all">
                  {publishResult.upgradeCapObjectId}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300">Publisher Object ID</label>
                <p className="text-sm font-mono bg-gray-600 p-2 rounded break-all">
                  {publishResult.publisherObjectId}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300">Display Objects Created</label>
                <p className="text-sm bg-gray-600 p-2 rounded">
                  {publishResult.displayObjectsCount} objects
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-500/20 border border-green-400/50 rounded">
            <p className="text-sm text-green-200">
              <strong>Files Updated:</strong> {publishResult.savedToFile}, {publishResult.objectTypesFile}, {publishResult.updatedEnvFile}
            </p>
            <p className="text-sm text-blue-200 mt-2">
              <strong>Note:</strong> Restart your Next.js server to pick up the new environment variables (PACKAGE_ID and ADMIN_CAP_ID).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
