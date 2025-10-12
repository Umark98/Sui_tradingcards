import CollectionUsersList from '@/components/admin/CollectionUsersList';

export default function MomentsUsersPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Moments Collection Users</h1>
          <p className="mt-2 text-gray-300">
            Complete list of users who own NFTs from the Moments collection. This exclusive collection has 863 minted NFTs capturing special moments.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow">
          <div className="px-6 py-4 border-b border-white/20">
            <h2 className="text-xl font-semibold text-white">Moments NFT Owners</h2>
            <p className="text-sm text-gray-300 mt-1">
              Browse through all users who own Moments NFTs. These users have exclusive access to special moment-based NFTs.
            </p>
          </div>
          <div className="p-6">
            <CollectionUsersList 
              collectionName="Moments"
              pageTitle="Moments Collection Users"
              pageDescription="Users who own Moments NFTs"
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-200 mb-2">Moments Collection</h3>
            <div className="text-blue-100 space-y-2">
              <p>• <strong>863 NFTs</strong> minted</p>
              <p>• <strong>Exclusive Collection</strong> limited edition</p>
              <p>• <strong>Special Moments</strong> captured</p>
              <p>• <strong>High Rarity</strong> premium NFTs</p>
            </div>
          </div>

          <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-200 mb-2">User Profile</h3>
            <div className="text-green-100 space-y-2">
              <p>• <strong>Collectors</strong> focused users</p>
              <p>• <strong>Exclusive Access</strong> seekers</p>
              <p>• <strong>Premium Buyers</strong> high value</p>
              <p>• <strong>Moment Enthusiasts</strong> special interest</p>
            </div>
          </div>

          <div className="bg-purple-500/20 border border-purple-400/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-200 mb-2">Marketing Strategy</h3>
            <div className="text-purple-100 space-y-2">
              <p>• <strong>Exclusive Releases</strong> targeting</p>
              <p>• <strong>Premium Products</strong> promotion</p>
              <p>• <strong>Limited Editions</strong> marketing</p>
              <p>• <strong>VIP Treatment</strong> for collectors</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
