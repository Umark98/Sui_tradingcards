"use client";

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { ReactNode, useEffect } from 'react';
import { WalletKitProvider, useWalletKit } from '@mysten/wallet-kit';

interface LayoutProviderProps {
  children: ReactNode;
}

// Component to handle wallet connection state
const WalletConnectionHandler = () => {
  const { currentAccount, disconnect } = useWalletKit();

  useEffect(() => {
    // Check if we should force disconnect based on user preference
    const forceDisconnect = sessionStorage.getItem('forceWalletDisconnect');
    if (forceDisconnect === 'true' && currentAccount) {
      disconnect();
      sessionStorage.removeItem('forceWalletDisconnect');
    }
  }, [currentAccount, disconnect]);

  return null;
};

const LayoutProvider = ({ children }: LayoutProviderProps) => {
  return (
    <WalletKitProvider
      features={['sui:signAndExecuteTransactionBlock']}
      autoConnect={false}
    >
      <WalletConnectionHandler />
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
    </WalletKitProvider>
  );
};

export default LayoutProvider;
