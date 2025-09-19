import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { ReactNode } from 'react';

interface LayoutProviderProps {
  children: ReactNode;
}

const LayoutProvider = ({ children }: LayoutProviderProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow p-6">{children}</main>
      <Footer />
    </div>
  );
};

export default LayoutProvider;
