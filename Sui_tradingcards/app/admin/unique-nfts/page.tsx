import UniqueNFTTable from '@/components/admin/UniqueNFTTable';

export default function UniqueNFTsPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Unique NFT Analysis</h1>
          <p className="mt-2 text-gray-300">
            View all unique NFT combinations in your database without user/wallet information.
            This table shows distinct NFT types, collections, rarities, and levels to help identify bundling opportunities.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow">
          <div className="px-6 py-4 border-b border-white/20">
            <h2 className="text-xl font-semibold text-white">Unique NFT Data</h2>
            <p className="text-sm text-gray-300 mt-1">
              Each row represents a unique combination of NFT title, collection, type, rarity, and level.
              Use the filters below to analyze specific subsets of your NFT data.
            </p>
          </div>
          <div className="p-6">
            <UniqueNFTTable />
          </div>
        </div>

        <div className="mt-8 bg-blue-500/20 border border-blue-400/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-200 mb-2">Bundling Opportunities</h3>
          <div className="text-blue-100 space-y-2">
            <p>• <strong>High Instance Count:</strong> Look for NFTs with many instances that could be bundled into collections</p>
            <p>• <strong>Same Collection + Type:</strong> Group NFTs by collection and type for maximum bundling efficiency</p>
            <p>• <strong>Rarity Patterns:</strong> Bundle common rarities together while keeping rare items separate</p>
            <p>• <strong>Level Progression:</strong> Create upgradeable cards instead of separate level NFTs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
