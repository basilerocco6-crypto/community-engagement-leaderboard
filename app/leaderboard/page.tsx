'use client';

import React, { useState, useEffect } from 'react';
import { Leaderboard } from '@/components/Leaderboard';
import { RewardList } from '@/components/RewardComponents';
import { LeaderboardEntry, UserRewardUnlock, RewardConfiguration } from '@/lib/types/engagement';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'rewards'>('leaderboard');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [userRewards, setUserRewards] = useState<{
    unlocked: UserRewardUnlock[];
    available: RewardConfiguration[];
  }>({ unlocked: [], available: [] });
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user ID from cookies or auth context
    // This is a placeholder - replace with your actual auth logic
    const userId = document.cookie
      .split('; ')
      .find(row => row.startsWith('user_id='))
      ?.split('=')[1];
    
    setCurrentUserId(userId || null);
    
    // Fetch initial data
    fetchLeaderboard();
    if (userId) {
      fetchUserRewards();
    }
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/engagement/leaderboard?limit=50&includeUserPosition=true');
      const data = await response.json();

      if (data.success) {
        setLeaderboardData(data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRewards = async () => {
    try {
      const response = await fetch('/api/rewards/user');
      const data = await response.json();

      if (data.success) {
        setUserRewards({
          unlocked: data.user_rewards,
          available: data.available_rewards
        });
      }
    } catch (error) {
      console.error('Error fetching user rewards:', error);
    }
  };

  const handleUseReward = async (rewardId: string) => {
    try {
      const response = await fetch('/api/rewards/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reward_config_id: rewardId })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh user rewards
        fetchUserRewards();
        alert('Reward used successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error using reward:', error);
      alert('Failed to use reward');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              🏆 Community Leaderboard
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              See how you rank among the most engaged community members
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="frosted-glass rounded-2xl p-2 border border-white/20 backdrop-blur-xl bg-white/10">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === 'leaderboard'
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  🏆 Leaderboard
                </button>
                <button
                  onClick={() => setActiveTab('rewards')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === 'rewards'
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  🎁 My Rewards
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto">
            {activeTab === 'leaderboard' ? (
              <Leaderboard
                initialData={leaderboardData}
                currentUserId={currentUserId}
              />
            ) : (
              <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">🎁 Your Rewards</h2>
                  <p className="text-white/70">
                    Rewards you've unlocked by reaching different tiers
                  </p>
                </div>
                
                <RewardList
                  unlockedRewards={userRewards.unlocked}
                  availableRewards={userRewards.available}
                  onUseReward={handleUseReward}
                  showAll={true}
                />
              </div>
            )}
          </div>

          {/* Stats Footer */}
          <div className="mt-12 text-center">
            <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/5 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-white mb-4">How to Climb the Leaderboard</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/80">
                <div className="text-center">
                  <div className="text-2xl mb-2">💬</div>
                  <div className="font-medium">Chat Messages</div>
                  <div>3-10 points each</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-medium">Forum Posts</div>
                  <div>8-25 points each</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🎓</div>
                  <div className="font-medium">Course Completion</div>
                  <div>100+ points each</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .frosted-glass {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
      `}</style>
    </div>
  );
}
