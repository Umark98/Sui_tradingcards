import GadgetUsersList from '@/components/admin/GadgetUsersList';

export default function GadgetUsersListPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Gadget Card Users</h1>
          <p className="mt-2 text-gray-300">
            Complete list of users who own Inspector Gadget cards. These users have NFTs matching the 165+ gadget types from your Move contract.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow">
          <div className="px-6 py-4 border-b border-white/20">
            <h2 className="text-xl font-semibold text-white">Gadget Card Owners</h2>
            <p className="text-sm text-gray-300 mt-1">
              Browse through all users who own gadget cards. Use the search and filter options to find specific users or gadget types.
            </p>
          </div>
          <div className="p-6">
            <GadgetUsersList />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-200 mb-2">Gadget Types</h3>
            <div className="text-blue-100 space-y-2">
              <p>• <strong>165+ Types</strong> from Move contract</p>
              <p>• <strong>Classic:</strong> Brella, Mallet, Laser</p>
              <p>• <strong>Body Parts:</strong> Arms, Legs, Hands</p>
              <p>• <strong>Tools:</strong> Binoculars, Flashlight, Key</p>
            </div>
          </div>

          <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-200 mb-2">User Benefits</h3>
            <div className="text-green-100 space-y-2">
              <p>• <strong>Targeted Marketing</strong> for new releases</p>
              <p>• <strong>Community Building</strong> with collectors</p>
              <p>• <strong>Analytics</strong> on user preferences</p>
              <p>• <strong>Engagement</strong> opportunities</p>
            </div>
          </div>

          <div className="bg-purple-500/20 border border-purple-400/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-200 mb-2">Data Insights</h3>
            <div className="text-purple-100 space-y-2">
              <p>• <strong>Collection Patterns</strong> analysis</p>
              <p>• <strong>Rarity Distribution</strong> tracking</p>
              <p>• <strong>User Segmentation</strong> by gadget types</p>
              <p>• <strong>Minting Strategy</strong> optimization</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
