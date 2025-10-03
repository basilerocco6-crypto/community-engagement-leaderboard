import { cookies } from 'next/headers';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('whop_access_token')?.value;
  
  console.log('Dashboard accessed with token:', !!accessToken);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-300">
              Welcome to your community dashboard
            </p>
          </div>

          {/* Authentication Status */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Authentication Status</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-3 ${accessToken ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={accessToken ? 'text-white' : 'text-gray-400'}>
                  {accessToken ? 'Authenticated' : 'Not authenticated'}
                </span>
              </div>
              
              {accessToken && (
                <div className="mt-4 p-4 bg-green-900 border border-green-600 rounded-lg">
                  <p className="text-green-200">
                    ✅ Authentication working! Token: {accessToken.substring(0, 20)}...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">📊</div>
                <div className="text-blue-200">Leaderboard</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">🏆</div>
                <div className="text-purple-200">Rewards</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">⚡</div>
                <div className="text-green-200">Activity</div>
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className="bg-blue-900 border border-blue-600 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-200 mb-2">System Status</h3>
            <p className="text-blue-300">
              Dashboard is operational! Authentication status is displayed above.
              Full functionality will be restored once backend services are re-enabled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}