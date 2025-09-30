"use client";

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { ReactNode } from 'react';
import { WalletKitProvider } from '@mysten/wallet-kit';

interface LayoutProviderProps {
  children: ReactNode;
}

const LayoutProvider = ({ children }: LayoutProviderProps) => {
  return (
    <WalletKitProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow p-6">{children}</main>
        <Footer />
      </div>
    </WalletKitProvider>
  );
};

export default LayoutProvider;
