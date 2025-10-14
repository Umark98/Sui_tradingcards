// components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Header: React.FC = () => {
  const pathname = usePathname();
  
  // Hide admin navigation items on portal page
  const isPortalPage = pathname === '/portal';
  return (
    <header className="bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 text-white shadow-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold">
          <Link href="/" className="hover:text-gray-300">
            Inspector Gadget
          </Link>
        </div>
        <div className="space-x-4 flex items-center">
          {!isPortalPage && (
            <>
              <Link href="/portal" className="hover:text-gray-300 flex items-center space-x-1 px-3 py-2 rounded-md transition-colors hover:bg-gray-800">
                <span>🎴</span>
                <span>Portal</span>
              </Link>
              <Link href="/test-email" className="hover:text-gray-300 flex items-center space-x-1 px-3 py-2 rounded-md transition-colors hover:bg-gray-800">
                <span>📧</span>
                <span>Email Test</span>
              </Link>
              <Link href="/card-config" className="hover:text-gray-300 flex items-center space-x-1 px-3 py-2 rounded-md transition-colors hover:bg-gray-800">
                <span>⚙️</span>
                <span>Card Config</span>
              </Link>
              <div className="relative group">
                <button className="hover:text-gray-300 flex items-center px-3 py-2 rounded-md transition-colors hover:bg-gray-800">
                  Collections
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-lg border border-purple-500/30 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link href="/admin/gadget-users-list" className="block px-4 py-2 text-sm text-gray-200 hover:bg-blue-500/20 hover:text-blue-200 transition-colors">
                      Gadget Users (46,902 NFTs)
                    </Link>
                    <Link href="/admin/genesis-users" className="block px-4 py-2 text-sm text-gray-200 hover:bg-blue-500/20 hover:text-blue-200 transition-colors">
                      Genesis (29,994 NFTs)
                    </Link>
                    <Link href="/admin/missions-users" className="block px-4 py-2 text-sm text-gray-200 hover:bg-blue-500/20 hover:text-blue-200 transition-colors">
                      Missions (5,950 NFTs)
                    </Link>
                    <Link href="/admin/moments-users" className="block px-4 py-2 text-sm text-gray-200 hover:bg-blue-500/20 hover:text-blue-200 transition-colors">
                      Moments (863 NFTs)
                    </Link>
                    <Link href="/admin/tickets-users" className="block px-4 py-2 text-sm text-gray-200 hover:bg-blue-500/20 hover:text-blue-200 transition-colors">
                      Brain Train Tickets (22 NFTs)
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;