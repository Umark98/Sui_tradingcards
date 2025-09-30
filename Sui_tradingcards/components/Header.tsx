// components/Header.tsx
"use client";

import Link from "next/link";

const Header: React.FC = () => {
  return (
    <header className="bg-gray-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold">
          <Link href="/" className="hover:text-gray-300">
            Inspector Gadget
          </Link>
        </div>
        <div className="space-x-4 flex items-center">
          <Link href="/" className="hover:text-gray-300">
            Home
          </Link>
          <Link href="/admin" className="hover:text-gray-300">
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;