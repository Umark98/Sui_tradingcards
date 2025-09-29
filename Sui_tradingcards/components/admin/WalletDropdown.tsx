"use client";

import { useWalletKit } from '@mysten/wallet-kit';
import { ConnectButton } from '@mysten/wallet-kit';
import { useState, useEffect } from 'react';

interface WalletBalance {
  coinType: string;
  coinObjectCount: number;
  totalBalance: string;
  lockedBalance: Record<string, string>;
}


export default function WalletDropdown() {
  const { currentAccount, currentWallet } = useWalletKit();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (currentAccount) {
      fetchWalletBalance();
      // Show success message only once when wallet connects
      setShowSuccessMessage(true);
      // Hide success message after 3 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentAccount]);

  const fetchWalletBalance = async () => {
    if (!currentAccount) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://fullnode.testnet.sui.io`, {
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
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      
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
    const suiBalance = parseInt(balance) / 1_000_000_000;
    return suiBalance.toFixed(4);
  };


  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
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
    return (
      <div className="relative">
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <span className="text-sm font-medium">Connect Wallet</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Wallet Info</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Success Message - Only shows once when wallet connects */}
            {showSuccessMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-green-800 text-sm">
                  ✅ Wallet Connected Successfully!
                </p>
              </div>
            )}

            <div className="space-y-4">
              {/* Wallet Address */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Wallet Address
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-gray-800">
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

              {/* SUI Balance */}
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
                    <span className="text-sm text-gray-800 font-medium">
                      {formatBalance(balance.totalBalance)} SUI
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">Unable to fetch</span>
                  )}
                </div>
              </div>

              {/* Wallet Name */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Wallet Name
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <span className="text-sm text-gray-800">
                    {currentWallet?.name || 'Unknown Wallet'}
                  </span>
                </div>
              </div>

              {/* Network */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Network
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <span className="text-sm text-gray-800">
                    Sui Testnet
                  </span>
                </div>
              </div>

              {/* Refresh Button */}
              <div className="pt-2">
                <button
                  onClick={fetchWalletBalance}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {loading ? 'Refreshing...' : 'Refresh Balance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}