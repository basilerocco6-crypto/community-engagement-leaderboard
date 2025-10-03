'use client';

import React from 'react';
import { LeaderboardEntry, TierInfo, UserEngagement } from '@/lib/types/engagement';
import { TierBadge } from './TierBadge';

interface MobileLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  userStats?: {
    engagement: UserEngagement;
    tierInfo: TierInfo;
    rank: number;
  };
  currentUserId?: string;
  className?: string;
}

export function MobileLeaderboard({ 
  leaderboard, 
  userStats, 
  currentUserId, 
  className = '' 
}: MobileLeaderboardProps) {
  return (
    <div className={`lg:hidden ${className}`}>
      {/* Mobile User Stats */}
      {userStats && (
        <MobileUserStats userStats={userStats} />
      )}

      {/* Mobile Leaderboard */}
      <div className="frosted-glass rounded-2xl p-4 border border-white/20 backdrop-blur-xl bg-white/10 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">🏆 Top Players</h2>
          <div className="text-xs text-white/70">
            Live Rankings
          </div>
        </div>

        <div className="space-y-2">
          {leaderboard.slice(0, 10).map((entry, index) => (
            <MobileLeaderboardRow
              key={entry.user_id}
              entry={entry}
              position={index + 1}
              isCurrentUser={entry.user_id === currentUserId}
            />
          ))}
        </div>
      </div>

      {/* Current User Position (if not in top 10) */}
      {userStats && !leaderboard.slice(0, 10).some(entry => entry.user_id === currentUserId) && (
        <div className="frosted-glass rounded-2xl p-3 border border-white/20 backdrop-blur-xl bg-white/5 mt-4">
          <div className="text-center text-white/70 text-sm mb-2">Your Position</div>
          <MobileLeaderboardRow
            entry={{
              ...userStats.engagement,
              rank: userStats.rank
            } as LeaderboardEntry}
            position={userStats.rank}
            isCurrentUser={true}
          />
        </div>
      )}
    </div>
  );
}

interface MobileUserStatsProps {
  userStats: {
    engagement: UserEngagement;
    tierInfo: TierInfo;
    rank: number;
  };
}

function MobileUserStats({ userStats }: MobileUserStatsProps) {
  const { engagement, tierInfo, rank } = userStats;

  return (
    <div className="frosted-glass rounded-2xl p-4 border border-white/20 backdrop-blur-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
          {engagement.username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">{engagement.username}</h3>
          <p className="text-white/70 text-sm">Rank #{rank}</p>
        </div>
        <TierBadge tier={tierInfo.current_tier} size="medium" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center bg-white/10 rounded-xl p-3">
          <div className="text-xl font-bold text-white">{engagement.total_points.toLocaleString()}</div>
          <div className="text-xs text-white/70">Total Points</div>
        </div>
        <div className="text-center bg-white/10 rounded-xl p-3">
          {tierInfo.next_tier ? (
            <>
              <div className="text-xl font-bold text-white">{tierInfo.points_to_next_tier}</div>
              <div className="text-xs text-white/70">To {tierInfo.next_tier}</div>
            </>
          ) : (
            <>
              <div className="text-xl font-bold text-yellow-400">MAX</div>
              <div className="text-xs text-white/70">Highest Tier</div>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {tierInfo.next_tier && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/70">
            <span>{tierInfo.current_tier}</span>
            <span>{tierInfo.progress_percentage.toFixed(0)}%</span>
            <span>{tierInfo.next_tier}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
              style={{ width: `${tierInfo.progress_percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface MobileLeaderboardRowProps {
  entry: LeaderboardEntry;
  position: number;
  isCurrentUser: boolean;
}

function MobileLeaderboardRow({ entry, position, isCurrentUser }: MobileLeaderboardRowProps) {
  const getRankIcon = (pos: number) => {
    switch (pos) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return pos.toString();
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
        flex items-center gap-3 p-3 rounded-xl transition-all duration-300
        ${isCurrentUser 
          ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border border-blue-400/50' 
          : 'bg-white/5'
        }
      `}
    >
      {/* Rank */}
      <div className={`text-lg font-bold min-w-[32px] text-center ${getRankColor(position)}`}>
        {getRankIcon(position)}
      </div>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
        {entry.username.charAt(0).toUpperCase()}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium text-sm truncate ${isCurrentUser ? 'text-white' : 'text-white/90'}`}>
            {entry.username}
          </span>
          {isCurrentUser && (
            <span className="px-1.5 py-0.5 bg-blue-500/50 text-white text-xs rounded">
              You
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1">
          <TierBadge tier={entry.current_tier as any} size="small" showLabel={false} />
          <span className="text-white/70 text-xs">
            {entry.total_points.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Points */}
      <div className="text-right">
        <div className={`text-sm font-bold ${isCurrentUser ? 'text-white' : 'text-white/90'}`}>
          {entry.total_points.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

// Compact leaderboard widget for dashboard
export function LeaderboardWidget({ 
  leaderboard, 
  currentUserId, 
  className = '' 
}: {
  leaderboard: LeaderboardEntry[];
  currentUserId?: string;
  className?: string;
}) {
  return (
    <div className={`frosted-glass rounded-2xl p-4 border border-white/20 backdrop-blur-xl bg-white/10 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">🏆 Top 5</h3>
        <a 
          href="/leaderboard" 
          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
        >
          View All
        </a>
      </div>

      <div className="space-y-2">
        {leaderboard.slice(0, 5).map((entry, index) => (
          <div 
            key={entry.user_id}
            className={`
              flex items-center gap-2 p-2 rounded-lg transition-all
              ${entry.user_id === currentUserId 
                ? 'bg-blue-500/20 border border-blue-400/30' 
                : 'bg-white/5 hover:bg-white/10'
              }
            `}
          >
            <div className="text-sm font-bold text-white/80 min-w-[20px]">
              {index + 1 <= 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
            </div>
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {entry.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white/90 truncate">
                {entry.username}
              </div>
            </div>
            <div className="text-xs text-white/70">
              {entry.total_points.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
