import GadgetUsersTable from '@/components/admin/GadgetUsersTable';

export default function GadgetUsersPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Inspector Gadget Users</h1>
          <p className="mt-2 text-gray-300">
            View users who own NFTs matching the Inspector Gadget card types from your Move contract.
            This page shows only users with NFTs that correspond to the 166+ gadget types defined in your blockchain contract.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow">
          <div className="px-6 py-4 border-b border-white/20">
            <h2 className="text-xl font-semibold text-white">Gadget Users Dashboard</h2>
            <p className="text-sm text-gray-300 mt-1">
              Filter and analyze users who own Inspector Gadget NFTs. Use the tabs below to explore different views of the data.
            </p>
          </div>
          <div className="p-6">
            <GadgetUsersTable />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-200 mb-2">Gadget Types Included</h3>
            <div className="text-blue-100 space-y-2">
              <p>• <strong>166+ Gadget Types</strong> from your Move contract</p>
              <p>• <strong>Classic Gadgets:</strong> Brella, Mallet, Laser, Copter, Skates</p>
              <p>• <strong>Body Parts:</strong> Arms, Legs, Hands, Ears, Eyes</p>
              <p>• <strong>Special Items:</strong> TopSecretGadgetPhone, Emergency, Flashlight</p>
              <p>• <strong>Tools & Accessories:</strong> Binoculars, MagnifyingGlass, Key, etc.</p>
            </div>
          </div>

          <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-200 mb-2">Data Insights</h3>
            <div className="text-green-100 space-y-2">
              <p>• <strong>User Segmentation:</strong> Identify your most engaged users</p>
              <p>• <strong>Collection Analysis:</strong> See which gadgets are most popular</p>
              <p>• <strong>Rarity Distribution:</strong> Understand gadget rarity patterns</p>
              <p>• <strong>Minting Opportunities:</strong> Target users for new gadget releases</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">Move Contract Integration</h3>
          <div className="text-yellow-800 space-y-2">
            <p>• This page filters users based on NFT titles that match your Move contract's gadget types</p>
            <p>• All 166+ gadget structs from <code className="bg-yellow-100 px-1 rounded">gadget_gameplay_items_titles.move</code> are included</p>
            <p>• Users are filtered by exact title matches to ensure accuracy</p>
            <p>• Perfect for targeting users who own specific gadget types for new features or promotions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
