'use client';

import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, TierInfo, UserEngagement } from '@/lib/types/engagement';
import { TierBadge, TierProgress } from './TierBadge';
import { TierSystem } from '@/lib/tier-system';

interface LeaderboardProps {
  initialData?: LeaderboardEntry[];
  currentUserId?: string;
  className?: string;
}

export function Leaderboard({ initialData = [], currentUserId, className = '' }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialData);
  const [userStats, setUserStats] = useState<{
    engagement: UserEngagement;
    tierInfo: TierInfo;
    rank: number;
  } | null>(null);
  const [loading, setLoading] = useState(!initialData.length);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!initialData.length) {
      fetchLeaderboard();
    }
    if (currentUserId) {
      fetchUserStats();
    }
  }, [currentUserId]);

  // Set up real-time updates (polling every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeaderboard();
      if (currentUserId) {
        fetchUserStats();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [currentUserId]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/engagement/leaderboard?limit=10&includeUserPosition=true');
      const data = await response.json();

      if (data.success) {
        setLeaderboard(data.leaderboard);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const [engagementResponse, tierResponse] = await Promise.all([
        fetch('/api/engagement/activity'),
        fetch('/api/engagement/tier')
      ]);

      const [engagementData, tierData] = await Promise.all([
        engagementResponse.json(),
        tierResponse.json()
      ]);

      if (engagementData.success && tierData.success) {
        setUserStats({
          engagement: engagementData.user_engagement,
          tierInfo: tierData.tier_info,
          rank: engagementData.rank || 0
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  if (loading) {
    return <LeaderboardSkeleton />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* User Stats Card */}
      {userStats && (
        <UserStatsCard
          userStats={userStats}
          isInTopTen={leaderboard.some(entry => entry.user_id === currentUserId)}
        />
      )}

      {/* Leaderboard */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">🏆 Leaderboard</h2>
          <div className="text-sm text-white/70">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <LeaderboardRow
              key={entry.user_id}
              entry={entry}
              position={index + 1}
              isCurrentUser={entry.user_id === currentUserId}
              animate={true}
            />
          ))}
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-12 text-white/70">
            <div className="text-4xl mb-4">🎯</div>
            <p>No leaderboard data available yet.</p>
            <p className="text-sm mt-2">Start engaging to see rankings!</p>
          </div>
        )}
      </div>

      {/* Current User Position (if not in top 10) */}
      {userStats && !leaderboard.some(entry => entry.user_id === currentUserId) && (
        <CurrentUserPosition userStats={userStats} />
      )}
    </div>
  );
}

interface UserStatsCardProps {
  userStats: {
    engagement: UserEngagement;
    tierInfo: TierInfo;
    rank: number;
  };
  isInTopTen: boolean;
}

function UserStatsCard({ userStats, isInTopTen }: UserStatsCardProps) {
  const { engagement, tierInfo, rank } = userStats;

  return (
    <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
            {engagement.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{engagement.username}</h3>
            <p className="text-white/70">Your Community Stats</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">#{rank}</div>
          <div className="text-sm text-white/70">Current Rank</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{engagement.total_points.toLocaleString()}</div>
          <div className="text-sm text-white/70">Total Points</div>
        </div>
        <div className="text-center">
          <TierBadge tier={tierInfo.current_tier} size="large" />
        </div>
        <div className="text-center">
          {tierInfo.next_tier ? (
            <>
              <div className="text-2xl font-bold text-white">{tierInfo.points_to_next_tier}</div>
              <div className="text-sm text-white/70">Points to {tierInfo.next_tier}</div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-yellow-400">MAX</div>
              <div className="text-sm text-white/70">Highest Tier</div>
            </>
          )}
        </div>
      </div>

      {/* Tier Progress */}
      {tierInfo.next_tier && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-white/70">
            <span>{TierSystem.getTierRequirements(tierInfo.current_tier)}</span>
            <span>{tierInfo.progress_percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${tierInfo.progress_percentage}%` }}
            />
          </div>
          {tierInfo.next_tier && (
            <div className="text-center text-sm text-white/70">
              Next: <TierBadge tier={tierInfo.next_tier} size="small" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  position: number;
  isCurrentUser: boolean;
  animate?: boolean;
}

function LeaderboardRow({ entry, position, isCurrentUser, animate = false }: LeaderboardRowProps) {
  const getRankIcon = (pos: number) => {
    switch (pos) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${pos}`;
    }
  };

  const getRankColor = (pos: number) => {
    switch (pos) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-amber-600';
      default: return 'text-white';
    }
  };

  return (
    <div 
      className={`
        flex items-center gap-4 p-4 rounded-xl transition-all duration-300
        ${isCurrentUser 
          ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border border-blue-400/50 shadow-lg' 
          : 'bg-white/5 hover:bg-white/10'
        }
        ${animate ? 'animate-fadeInUp' : ''}
      `}
      style={{ animationDelay: `${position * 100}ms` }}
    >
      {/* Rank */}
      <div className={`text-2xl font-bold min-w-[60px] text-center ${getRankColor(position)}`}>
        {getRankIcon(position)}
      </div>

      {/* User Avatar */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
        {entry.username.charAt(0).toUpperCase()}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-semibold truncate ${isCurrentUser ? 'text-white' : 'text-white/90'}`}>
            {entry.username}
          </h3>
          {isCurrentUser && (
            <span className="px-2 py-1 bg-blue-500/50 text-white text-xs rounded-full">
              You
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <TierBadge tier={entry.current_tier as any} size="small" />
          <span className="text-white/70 text-sm">
            {entry.total_points.toLocaleString()} points
          </span>
        </div>
      </div>

      {/* Points Display */}
      <div className="text-right">
        <div className={`text-xl font-bold ${isCurrentUser ? 'text-white' : 'text-white/90'}`}>
          {entry.total_points.toLocaleString()}
        </div>
        <div className="text-sm text-white/70">points</div>
      </div>
    </div>
  );
}

interface CurrentUserPositionProps {
  userStats: {
    engagement: UserEngagement;
    tierInfo: TierInfo;
    rank: number;
  };
}

function CurrentUserPosition({ userStats }: CurrentUserPositionProps) {
  const { engagement, rank } = userStats;

  return (
    <div className="frosted-glass rounded-2xl p-4 border border-white/20 backdrop-blur-xl bg-white/5">
      <div className="text-center mb-2">
        <span className="text-white/70 text-sm">Your Position</span>
      </div>
      <LeaderboardRow
        entry={{
          ...engagement,
          rank
        } as LeaderboardEntry}
        position={rank}
        isCurrentUser={true}
      />
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* User Stats Skeleton */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-white/20"></div>
          <div className="space-y-2">
            <div className="w-32 h-4 bg-white/20 rounded"></div>
            <div className="w-24 h-3 bg-white/20 rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="w-16 h-6 bg-white/20 rounded mx-auto"></div>
              <div className="w-12 h-3 bg-white/20 rounded mx-auto"></div>
            </div>
          ))}
        </div>
        <div className="w-full h-3 bg-white/20 rounded"></div>
      </div>

      {/* Leaderboard Skeleton */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="w-32 h-6 bg-white/20 rounded"></div>
          <div className="w-24 h-4 bg-white/20 rounded"></div>
        </div>
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl animate-pulse">
              <div className="w-8 h-8 bg-white/20 rounded"></div>
              <div className="w-12 h-12 bg-white/20 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="w-32 h-4 bg-white/20 rounded"></div>
                <div className="w-24 h-3 bg-white/20 rounded"></div>
              </div>
              <div className="text-right space-y-2">
                <div className="w-16 h-5 bg-white/20 rounded"></div>
                <div className="w-12 h-3 bg-white/20 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Add custom CSS for animations
const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeInUp {
    animation: fadeInUp 0.6s ease-out forwards;
  }

  .frosted-glass {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .frosted-glass::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05));
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    -webkit-mask-composite: xor;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
