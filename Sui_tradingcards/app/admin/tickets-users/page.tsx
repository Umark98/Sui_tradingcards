import CollectionUsersList from '@/components/admin/CollectionUsersList';

export default function TicketsUsersPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Brain Train Tickets Users</h1>
          <p className="mt-2 text-gray-300">
            Complete list of users who own Brain Train Tickets. This ultra-rare collection has only 22 minted NFTs, making these users extremely exclusive.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow">
          <div className="px-6 py-4 border-b border-white/20">
            <h2 className="text-xl font-semibold text-white">Brain Train Ticket Owners</h2>
            <p className="text-sm text-gray-300 mt-1">
              Browse through all users who own Brain Train Tickets. These are your most exclusive and valuable users with ultra-rare NFTs.
            </p>
          </div>
          <div className="p-6">
            <CollectionUsersList 
              collectionName="Brain Train Tickets"
              pageTitle="Brain Train Tickets Users"
              pageDescription="Users who own Brain Train Tickets"
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-200 mb-2">Brain Train Tickets</h3>
            <div className="text-blue-100 space-y-2">
              <p>• <strong>22 NFTs</strong> minted (ultra-rare)</p>
              <p>• <strong>Exclusive Access</strong> tickets</p>
              <p>• <strong>Highest Value</strong> NFTs</p>
              <p>• <strong>VIP Status</strong> holders</p>
            </div>
          </div>

          <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-200 mb-2">User Value</h3>
            <div className="text-green-100 space-y-2">
              <p>• <strong>Ultra-Exclusive</strong> users</p>
              <p>• <strong>High Net Worth</strong> individuals</p>
              <p>• <strong>Premium Customers</strong> top tier</p>
              <p>• <strong>Brand Ambassadors</strong> potential</p>
            </div>
          </div>

          <div className="bg-purple-500/20 border border-purple-400/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-200 mb-2">Marketing Priority</h3>
            <div className="text-purple-100 space-y-2">
              <p>• <strong>Personal Outreach</strong> required</p>
              <p>• <strong>Exclusive Events</strong> invitations</p>
              <p>• <strong>Premium Services</strong> offerings</p>
              <p>• <strong>VIP Treatment</strong> always</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
