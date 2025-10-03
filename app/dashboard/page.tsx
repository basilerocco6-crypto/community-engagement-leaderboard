import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  // Check for authentication
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('whop_access_token')?.value;
  
  if (!accessToken) {
    // Redirect to login if not authenticated
    redirect('/');
  }

  console.log('Logged in user with valid access token');

  // Check if Supabase is configured
  const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                               process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                               !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  let user = { username: 'You', total_points: 45, current_tier: 'Bronze' }; // Default fallback

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      
      // Fetch your user points/tier from Supabase (use Whop user ID from auth context later)
      const { data: userData } = await supabase
        .from('user_engagement')
        .select('username, total_points, current_tier')
        .eq('user_id', 'user_zTz43UvWWvvtlE') // Your dev user ID from token (update dynamically later)
        .single();

      if (userData) {
        user = userData;
      }
    } catch (error) {
      console.log('Supabase not configured or error:', error);
      // Use fallback data
    }
  }

  // Tier thresholds (per spec: Bronze 0-100, Silver 101-500, etc.)
  const tiers = [
    { name: 'Bronze', min: 0, max: 100, color: 'text-orange-500', badge: '🥉' },
    { name: 'Silver', min: 101, max: 500, color: 'text-gray-400', badge: '🥈' },
    { name: 'Gold', min: 501, max: 1500, color: 'text-yellow-400', badge: '🥇' },
    { name: 'Platinum', min: 1501, max: 5000, color: 'text-blue-400', badge: '💎' },
    { name: 'Diamond', min: 5001, color: 'text-purple-400', badge: '🔥' },
  ];

  const currentTier = tiers.find(t => user.total_points >= t.min) || tiers[0];
  const nextTier = tiers.find(t => t.min > user.total_points) || tiers[tiers.length - 1];
  const progress = ((user.total_points - currentTier.min) / (nextTier.min - currentTier.min)) * 100;

  // Fake top 10 leaderboard data (replace with Supabase query: .order('total_points', { ascending: false }).limit(10))
  const leaderboard = [
    { username: 'Nic Johnson', points: 250, tier: 'Gold' },
    { username: 'Zoe Radmore', points: 180, tier: 'Silver' },
    { username: 'Nick Krasnovsky', points: 120, tier: 'Silver' },
    { username: 'Zoe Cerna', points: 90, tier: 'Bronze' },
    { username: 'Nick Hayrapetyan', points: 75, tier: 'Bronze' },
    { username: 'Len Gurerra', points: 60, tier: 'Bronze' },
    { username: 'Alex Smith', points: 50, tier: 'Bronze' },
    { username: 'Jordan Lee', points: 40, tier: 'Bronze' },
    { username: 'Taylor Kim', points: 30, tier: 'Bronze' },
    { username: 'Casey Patel', points: 20, tier: 'Bronze' },
  ];

  // Rewards based on tier (per spec: Auto-unlock discounts)
  const rewards = currentTier.name === 'Silver' ? ['10% discount code unlocked!'] : 
                  currentTier.name === 'Gold' ? ['20% discount + exclusive access'] : 
                  ['Engage more to unlock perks!'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      {/* Your Stats Card - Highlighted at Top */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-white">Your Status</h1>
            <form action="/auth/logout" method="post">
              <button 
                type="submit"
                className="text-sm text-gray-400 hover:text-red-400 transition-colors"
              >
                Logout
              </button>
            </form>
          </div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className={currentTier.color + ' text-xl'}>{currentTier.badge}</span>
            </div>
            <div>
              <p className="text-xl text-white">{user.username}</p>
              <p className={`text-lg ${currentTier.color}`}>{currentTier.name} Level</p>
            </div>
          </div>
          <p className="text-gray-300 mb-4">Total Points: {user.total_points}</p>
          <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-sm text-gray-400">Next: {nextTier.name} at {nextTier.min} points ({Math.round(progress)}% to go)</p>
          {/* Rewards List */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-white mb-2">Unlocked Rewards</h3>
            <ul className="space-y-1 text-sm text-gray-300">
              {rewards.map((r, i) => <li key={i} className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>{r}</li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* Leaderboard Table - Top 10 */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4">Leaderboard (All Time)</h2>
        <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-white/20">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {leaderboard.map((user, i) => (
                <tr key={i} className={`hover:bg-white/5 ${i === 0 ? 'bg-yellow-500/10' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">#{i + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{user.points}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 rounded-full bg-gray-700 text-xs">{user.tier}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Engagement Tips */}
      <div className="max-w-4xl mx-auto mt-8 text-center">
        <p className="text-gray-400">Track chat messages (5pts), forum posts (10pts), course completions (50pts) to climb!</p>
      </div>
    </div>
  );
}