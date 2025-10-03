import { LoginButton } from '@/components/LoginButton';

interface HomeProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { error } = await searchParams;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Error Message */}
      {error && (
        <div className="max-w-4xl mx-auto pt-8 px-4">
          <div className="bg-red-500/10 backdrop-blur-md rounded-xl p-4 border border-red-500/20 mb-8">
            <p className="text-red-300 text-center">
              {error === 'no_code' ? 'No authorization code received' :
               error === 'config' ? 'OAuth configuration missing' :
               error === 'login_failed' ? 'Login failed—please try again' :
               error === 'no_token' ? 'No access token received' :
               error === 'callback_error' ? 'Authentication error occurred' :
               'Login failed—please try again'}
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto pt-16 pb-12 px-4 text-center">
        <h1 className="text-5xl font-bold text-white mb-6">
          Welcome to <span className="text-orange-500">Community Hub</span>
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Track engagement, climb tiers, and unlock rewards in your Whop community. Similar to Skool—chat, forums, courses all count!
        </p>
        <LoginButton /> {/* Embedded—logs in & redirects to /dashboard */}
      </div>

      {/* Feature Cards */}
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Engagement Tracking</h2>
          <p className="text-gray-300">Earn points for chat messages (weighted by length/quality), forum posts/replies, and course completions.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Leaderboards & Tiers</h2>
          <p className="text-gray-300">See your rank, climb from Bronze to Diamond, with badges and progress bars. View everyone's status.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Auto Rewards</h2>
          <p className="text-gray-300">Unlock discounts and perks as you tier up—config by owners, integrated with Whop payments.</p>
        </div>
      </div>

      {/* Getting Started */}
      <div className="text-center">
        <p className="text-gray-400">Login to see your leaderboard and start engaging!</p>
      </div>
    </div>
  );
}