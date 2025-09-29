// components/Header.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="bg-gray-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold">
          <Link href="/" className="hover:text-gray-300">
            Inspector Gadget
          </Link>
        </div>
        <div className="space-x-4 flex items-center">
          {isAuthenticated ? (
            <>
              <Link href="/" className="hover:text-gray-300">
                Home
              </Link>
              <Link href="/admin" className="hover:text-gray-300">
                Admin
              </Link>
              <span className="text-gray-300">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hover:text-gray-300">
                Login
              </Link>
              <Link href="/auth/signup" className="hover:text-gray-300">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;