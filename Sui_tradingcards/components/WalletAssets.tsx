"use client";

import { useWalletKit } from '@mysten/wallet-kit';
import { useState, useEffect } from 'react';

interface SuiObject {
  objectId: string;
  version: string;
  digest: string;
  type: string;
  owner: {
    AddressOwner?: string;
    ObjectOwner?: string;
    Shared?: {
      initial_shared_version: string;
    };
  };
  previousTransaction: string;
  storageRebate: string;
  reference: {
    objectId: string;
    version: string;
    digest: string;
  };
  data?: {
    objectId: string;
    version: string;
    digest: string;
    type: string;
    owner: any;
    previousTransaction: string;
    storageRebate: string;
    reference: any;
    display?: {
      name?: string;
      description?: string;
      image_url?: string;
      link?: string;
      project_url?: string;
    };
  };
}

interface AssetType {
  type: string;
  count: number;
  objects: SuiObject[];
}

export default function WalletAssets() {
  const { currentAccount } = useWalletKit();
  const [assets, setAssets] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentAccount) {
      fetchWalletAssets();
    }
  }, [currentAccount]);

  const fetchWalletAssets = async () => {
    if (!currentAccount) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get all objects owned by the wallet
      const response = await fetch(`https://fullnode.testnet.sui.io`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_getOwnedObjects',
          params: [
            currentAccount.address,
            {
              options: {
                showType: true,
                showOwner: true,
                showPreviousTransaction: true,
                showDisplay: true,
                showContent: true,
                showBcs: false,
                showStorageRebate: false
              }
            }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      console.log('Assets response:', text); // Debug log
      
      if (!text) {
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(text);
      
      if (data.error) {
        throw new Error(data.error.message || 'Unknown error');
      }

      // Group objects by type, excluding Inspector Gadget trading cards
      const objects = data.result.data || [];
      const groupedAssets = objects.reduce((acc: Record<string, AssetType>, obj: SuiObject) => {
        const type = obj.data?.type || obj.type || 'Unknown';
        
        // Skip Inspector Gadget trading cards as they have their own dedicated component
        const isInspectorGadget = type.includes('GadgetGameplayItem') || 
                                 type.includes('TradingCard') ||
                                 type.includes('collectable_gameplay_items');
        
        if (isInspectorGadget) {
          return acc;
        }
        
        if (!acc[type]) {
          acc[type] = {
            type,
            count: 0,
            objects: []
          };
        }
        
        acc[type].count++;
        acc[type].objects.push(obj);
        
        return acc;
      }, {});

      setAssets(Object.values(groupedAssets));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assets');
      console.error('Error fetching wallet assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatObjectId = (objectId: string) => {
    if (!objectId) return '';
    return `${objectId.slice(0, 8)}...${objectId.slice(-8)}`;
  };

  const getAssetTypeDisplayName = (type: string) => {
    // Extract meaningful name from the type
    const parts = type.split('::');
    return parts[parts.length - 1] || type;
  };

  if (!currentAccount) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">
          Other Wallet Assets
        </h3>
        <button
          onClick={fetchWalletAssets}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading assets...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {!loading && !error && assets.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📦</div>
          <p className="text-gray-600">No other assets found in your wallet</p>
          <p className="text-sm text-gray-500 mt-2">
            Your Inspector Gadget trading cards are displayed above. Other NFTs and assets will appear here.
          </p>
        </div>
      )}

      {!loading && !error && assets.length > 0 && (
        <div className="space-y-6">
          {assets.map((assetType) => (
            <div key={assetType.type} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white">
                  {getAssetTypeDisplayName(assetType.type)}
                </h4>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {assetType.count} item{assetType.count !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assetType.objects.slice(0, 6).map((obj, index) => (
                  <div key={`${assetType.type}-${obj.objectId}-${index}`} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="space-y-2">
                      {obj.data?.display?.image_url && (
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={obj.data.display.image_url}
                            alt={obj.data.display.name || 'NFT'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      <div>
                        <h5 className="font-medium text-sm text-white truncate">
                          {obj.data?.display?.name || 'Unnamed Asset'}
                        </h5>
                        <p className="text-xs text-gray-500 font-mono">
                          {formatObjectId(obj.objectId)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {assetType.objects.length > 6 && (
                <div className="mt-3 text-center">
                  <p className="text-sm text-gray-500">
                    And {assetType.objects.length - 6} more...
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
