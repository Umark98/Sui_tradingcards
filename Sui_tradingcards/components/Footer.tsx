const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 text-white py-6 border-t border-white/10">
      <div className="max-w-7xl mx-auto text-center text-gray-300">
        &copy; {new Date().getFullYear()} Inspector Gadget NFT Portal. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
