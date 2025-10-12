"use client";

import { useWalletKit } from '@mysten/wallet-kit';
import { useState, useEffect } from 'react';

interface WalletBalance {
  coinType: string;
  coinObjectCount: number;
  totalBalance: string;
  lockedBalance: Record<string, string>;
}

export default function WalletInfo() {
  const { currentAccount, currentWallet, disconnect } = useWalletKit();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (currentAccount) {
      fetchWalletBalance();
    }
  }, [currentAccount]);

  const fetchWalletBalance = async () => {
    if (!currentAccount) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Try multiple Sui RPC endpoints for better reliability
      const endpoints = [
        'https://fullnode.testnet.sui.io',
        'https://sui-testnet.blockvision.org',
        'https://testnet.sui.io'
      ];
      
      let response;
      let lastError;
      
      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'suix_getBalance',
              params: [currentAccount.address],
            }),
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });
          
          if (response.ok) {
            break; // Success, exit the loop
          }
        } catch (error) {
          lastError = error;
          console.warn(`Failed to fetch from ${endpoint}:`, error);
          continue; // Try next endpoint
        }
      }
      
      if (!response || !response.ok) {
        throw lastError || new Error('All RPC endpoints failed');
      }

      const text = await response.text();
      console.log('Balance response:', text); // Debug log
      
      if (!text) {
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(text);
      
      if (data.error) {
        throw new Error(data.error.message || 'Unknown error');
      }

      setBalance(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
      console.error('Error fetching wallet balance:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string) => {
    // Convert from MIST to SUI (1 SUI = 1,000,000,000 MIST)
    const suiBalance = parseInt(balance) / 1_000_000_000;
    return suiBalance.toFixed(4);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!currentAccount) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-4">
        Wallet Information
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Wallet Address
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-white">
                  {formatAddress(currentAccount.address)}
                </span>
                <button
                  onClick={() => copyToClipboard(currentAccount.address)}
                  className={`text-sm font-medium transition-colors ${
                    copied 
                      ? 'text-green-600' 
                      : 'text-blue-600 hover:text-blue-800'
                  }`}
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Wallet Name
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <span className="text-sm text-white">
                {currentWallet?.name || 'Unknown Wallet'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Network
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <span className="text-sm text-white">
                Sui Testnet
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              SUI Balance
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              {loading ? (
                <span className="text-sm text-gray-500">Loading...</span>
              ) : error ? (
                <span className="text-sm text-red-500">Error: {error}</span>
              ) : balance ? (
                <span className="text-sm text-white">
                  {formatBalance(balance.totalBalance)} SUI
                </span>
              ) : (
                <span className="text-sm text-gray-500">Unable to fetch</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between">
        <button
          onClick={fetchWalletBalance}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {loading ? 'Refreshing...' : 'Refresh Balance'}
        </button>
        <button
          onClick={() => {
            // Set flag to force disconnect on next page load
            sessionStorage.setItem('forceWalletDisconnect', 'true');
            disconnect();
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
        >
          Disconnect Wallet
        </button>
      </div>
    </div>
  );
}
