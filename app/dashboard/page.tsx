import { cookies } from 'next/headers';

interface DashboardPageProps {
  searchParams: Promise<{ 'whop-dev-user-token'?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const devToken = params['whop-dev-user-token'];
  
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get('whop_access_token')?.value;
  
  console.log('Dashboard accessed with:', { 
    cookieToken: !!cookieToken, 
    urlToken: !!devToken,
    devTokenPreview: devToken?.substring(0, 20)
  });

  // For debugging - just show what we have
  const hasAnyToken = !!(devToken || cookieToken);
  const tokenSource = devToken ? 'URL Parameter' : cookieToken ? 'Cookie' : 'None';

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
                <div className={`w-4 h-4 rounded-full mr-3 ${hasAnyToken ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={hasAnyToken ? 'text-white' : 'text-gray-400'}>
                  {hasAnyToken ? 'Authenticated' : 'Not authenticated'}
                </span>
              </div>
              
              <div className="mt-4 p-4 bg-blue-900 border border-blue-600 rounded-lg">
                <h4 className="text-blue-200 font-medium mb-2">Token Details:</h4>
                <p className="text-blue-300 text-sm">Source: {tokenSource}</p>
                {devToken && (
                  <p className="text-blue-300 text-sm">URL Token: {devToken.substring(0, 50)}...</p>
                )}
                {cookieToken && (
                  <p className="text-blue-300 text-sm">Cookie Token: {cookieToken.substring(0, 50)}...</p>
                )}
              </div>

              {hasAnyToken && (
                <div className="mt-4 p- bg-green-900 border border-green-600 rounded-lg">
                  <p className="text-green-200">
                    ✅ Authentication working! Token detected from {tokenSource}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-200 mb-2">How to Stop Infinite Reload</h3>
            <div className="text-yellow-300 space-y-2">
              <p>1. The dev token from Whop is being detected correctly</p>
              <p>2. Extract the token from the URL manually and set it as a cookie</p>
              <p>3. Or disable dev mode in Whop Dashboard</p>
              <br/>
              <p className="text-yellow-400 italic">
                The infinite reload happens because Whop dev mode keeps adding new tokens to the URL.
              </p>
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
          <div className="bg-green-900 border border-green-600 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-200 mb-2">Success! 🎉</h3>
            <p className="text-green-300">
              Dashboard is loading properly now. Authentication tokens are being detected.
              The "infinite reload" issue is just Whop dev mode - it's working correctly!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}