import CollectionUsersList from '@/components/admin/CollectionUsersList';

export default function GenesisUsersPage() {

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Genesis Collection Users</h1>
          <p className="mt-2 text-gray-300">
            Complete list of users who own NFTs from the Genesis collection. This is the largest collection with 29,994 minted NFTs.
          </p>
          <div className="mt-2 p-3 bg-blue-500/20 border border-blue-400/50 rounded-lg">
            <p className="text-blue-200 text-sm">
              <strong>Note:</strong> This is the original "Genesis" collection. For the new mission-based trading cards from the genesis_missoncards contract, see the "Mission Cards Collection Users" page.
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow">
          <div className="px-6 py-4 border-b border-white/20">
            <h2 className="text-xl font-semibold text-white">Genesis NFT Owners</h2>
            <p className="text-sm text-gray-300 mt-1">
              Browse through all users who own Genesis NFTs. Use the search and filter options to find specific users or NFT types.
            </p>
          </div>
          <div className="p-6">
            <CollectionUsersList 
              collectionName="Genesis"
              pageTitle="Genesis Collection Users"
              pageDescription="Users who own Genesis NFTs"
              missionCardTypes={undefined}
              hideRarityAndLevel={true}
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-200 mb-2">Genesis Collection</h3>
            <div className="text-blue-100 space-y-2">
              <p>• <strong>29,994 NFTs</strong> minted</p>
              <p>• <strong>Largest Collection</strong> in your database</p>
              <p>• <strong>Premium NFTs</strong> with high value</p>
              <p>• <strong>Genesis Holders</strong> are VIP users</p>
            </div>
          </div>

          <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-200 mb-2">User Benefits</h3>
            <div className="text-green-100 space-y-2">
              <p>• <strong>Early Access</strong> to new features</p>
              <p>• <strong>Exclusive Events</strong> for Genesis holders</p>
              <p>• <strong>Premium Support</strong> priority</p>
              <p>• <strong>Special Rewards</strong> and bonuses</p>
            </div>
          </div>

          <div className="bg-purple-500/20 border border-purple-400/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-200 mb-2">Marketing Value</h3>
            <div className="text-purple-100 space-y-2">
              <p>• <strong>High Engagement</strong> users</p>
              <p>• <strong>Premium Audience</strong> for marketing</p>
              <p>• <strong>Brand Ambassadors</strong> potential</p>
              <p>• <strong>Revenue Opportunities</strong> with VIP users</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
