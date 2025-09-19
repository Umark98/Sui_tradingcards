// components/Header.tsx
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
        <div className="space-x-4">
          <Link href="/auth/login" className="hover:text-gray-300">
            Login
          </Link>
          <Link href="/auth/signup" className="hover:text-gray-300">
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;