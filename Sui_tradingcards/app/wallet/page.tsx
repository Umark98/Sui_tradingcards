"use client";

import { useWalletKit } from '@mysten/wallet-kit';
import { ConnectButton } from '@mysten/wallet-kit';
import WalletInfo from '@/components/WalletInfo';
export default function WalletPage() {
  const { currentAccount, disconnect } = useWalletKit();

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6 min-h-full">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">
          Sui Wallet Connection
        </h1>
        <p className="text-lg text-gray-300">
          Connect your Sui wallet to view your assets and manage your trading cards
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-center mb-8">
          <ConnectButton />
        </div>

        {currentAccount ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Wallet Connected Successfully!
              </h2>
              <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-4">
                <p className="text-green-100">
                  Your Sui wallet is now connected and ready to use.
                </p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    // Set flag to force disconnect on next page load
                    sessionStorage.setItem('forceWalletDisconnect', 'true');
                    disconnect();
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Disconnect Wallet
                </button>
              </div>
            </div>

            <WalletInfo />
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Wallet Connected
              </h3>
              <p className="text-gray-600">
                Please connect your Sui wallet to view your assets and trading cards.
              </p>
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-4">
                  Supported wallets include Sui Wallet, Suiet, and other Sui-compatible wallets.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
