import DuplicateNFTAnalysis from '@/components/admin/DuplicateNFTAnalysis';

export default function DuplicateAnalysisPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Duplicate NFT Analysis</h1>
          <p className="mt-2 text-gray-300">
            Analyze similar and duplicate NFTs in your database to identify bundling opportunities.
            This analysis shows you exactly how many similar items you have and where the biggest bundling potential lies.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow">
          <div className="px-6 py-4 border-b border-white/20">
            <h2 className="text-xl font-semibold text-white">Duplicate Analysis Dashboard</h2>
            <p className="text-sm text-gray-300 mt-1">
              Use the tabs below to explore different types of duplicates and identify the best bundling strategies.
            </p>
          </div>
          <div className="p-6">
            <DuplicateNFTAnalysis />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-200 mb-2">Bundling Strategy</h3>
            <div className="text-green-100 space-y-2">
              <p>• <strong>Exact Duplicates:</strong> Perfect candidates for bundling - same title, type, rarity, and level</p>
              <p>• <strong>Title Duplicates:</strong> Same title with different attributes - create upgradeable cards</p>
              <p>• <strong>Type/Collection:</strong> Group by type and collection for maximum efficiency</p>
              <p>• <strong>High Duplicate Counts:</strong> Focus on items with 10+ duplicates first</p>
            </div>
          </div>

          <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-200 mb-2">Implementation Tips</h3>
            <div className="text-blue-100 space-y-2">
              <p>• Start with the highest duplicate counts for maximum impact</p>
              <p>• Create collection bundles for items with same type and collection</p>
              <p>• Implement upgradeable cards for same-title items with different levels</p>
              <p>• Keep rare items separate to maintain their value</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
