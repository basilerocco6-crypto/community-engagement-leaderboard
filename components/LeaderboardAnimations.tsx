'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LeaderboardEntry } from '@/lib/types/engagement';

interface AnimatedLeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  onRankChange?: (userId: string, oldRank: number, newRank: number) => void;
}

export function AnimatedLeaderboard({ 
  entries, 
  currentUserId, 
  onRankChange 
}: AnimatedLeaderboardProps) {
  const [displayEntries, setDisplayEntries] = useState<LeaderboardEntry[]>(entries);
  const [animatingEntries, setAnimatingEntries] = useState<Set<string>>(new Set());
  const previousEntriesRef = useRef<LeaderboardEntry[]>(entries);

  useEffect(() => {
    const previousEntries = previousEntriesRef.current;
    const newEntries = entries;

    // Check for rank changes
    const rankChanges: Array<{
      userId: string;
      oldRank: number;
      newRank: number;
      entry: LeaderboardEntry;
    }> = [];

    newEntries.forEach((newEntry, newIndex) => {
      const oldIndex = previousEntries.findIndex(e => e.user_id === newEntry.user_id);
      if (oldIndex !== -1 && oldIndex !== newIndex) {
        rankChanges.push({
          userId: newEntry.user_id,
          oldRank: oldIndex + 1,
          newRank: newIndex + 1,
          entry: newEntry
        });
      }
    });

    if (rankChanges.length > 0) {
      // Mark entries as animating
      const animatingIds = new Set(rankChanges.map(change => change.userId));
      setAnimatingEntries(animatingIds);

      // Trigger rank change callbacks
      rankChanges.forEach(change => {
        onRankChange?.(change.userId, change.oldRank, change.newRank);
      });

      // Update display entries with animation delay
      setTimeout(() => {
        setDisplayEntries(newEntries);
        
        // Clear animation state after animation completes
        setTimeout(() => {
          setAnimatingEntries(new Set());
        }, 600);
      }, 100);
    } else {
      setDisplayEntries(newEntries);
    }

    previousEntriesRef.current = newEntries;
  }, [entries, onRankChange]);

  return (
    <div className="space-y-3">
      {displayEntries.map((entry, index) => (
        <AnimatedLeaderboardRow
          key={entry.user_id}
          entry={entry}
          position={index + 1}
          isCurrentUser={entry.user_id === currentUserId}
          isAnimating={animatingEntries.has(entry.user_id)}
        />
      ))}
    </div>
  );
}

interface AnimatedLeaderboardRowProps {
  entry: LeaderboardEntry;
  position: number;
  isCurrentUser: boolean;
  isAnimating: boolean;
}

function AnimatedLeaderboardRow({ 
  entry, 
  position, 
  isCurrentUser, 
  isAnimating 
}: AnimatedLeaderboardRowProps) {
  const [showRankChange, setShowRankChange] = useState(false);
  const [pointsAnimation, setPointsAnimation] = useState(false);

  useEffect(() => {
    if (isAnimating) {
      setShowRankChange(true);
      setPointsAnimation(true);
      
      setTimeout(() => {
        setShowRankChange(false);
        setPointsAnimation(false);
      }, 2000);
    }
  }, [isAnimating]);

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
        relative flex items-center gap-4 p-4 rounded-xl transition-all duration-600 ease-out
        ${isCurrentUser 
          ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border border-blue-400/50 shadow-lg' 
          : 'bg-white/5 hover:bg-white/10'
        }
        ${isAnimating ? 'animate-rank-change' : ''}
      `}
    >
      {/* Rank Change Indicator */}
      {showRankChange && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
          Rank Up! 🚀
        </div>
      )}

      {/* Rank */}
      <div className={`text-2xl font-bold min-w-[60px] text-center transition-all duration-300 ${getRankColor(position)}`}>
        {getRankIcon(position)}
      </div>

      {/* User Avatar with pulse animation */}
      <div className={`
        w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold transition-all duration-300
        ${isAnimating ? 'animate-pulse scale-110' : ''}
      `}>
        {entry.username.charAt(0).toUpperCase()}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-semibold truncate transition-all duration-300 ${isCurrentUser ? 'text-white' : 'text-white/90'}`}>
            {entry.username}
          </h3>
          {isCurrentUser && (
            <span className="px-2 py-1 bg-blue-500/50 text-white text-xs rounded-full">
              You
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {entry.current_tier}
          </span>
          <span className="text-white/70 text-sm">
            {entry.total_points.toLocaleString()} points
          </span>
        </div>
      </div>

      {/* Points Display with animation */}
      <div className="text-right">
        <div className={`
          text-xl font-bold transition-all duration-500
          ${isCurrentUser ? 'text-white' : 'text-white/90'}
          ${pointsAnimation ? 'animate-points-increase' : ''}
        `}>
          {entry.total_points.toLocaleString()}
        </div>
        <div className="text-sm text-white/70">points</div>
      </div>

      {/* Glow effect for current user */}
      {isCurrentUser && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse pointer-events-none" />
      )}
    </div>
  );
}

// Real-time notification component
interface RankChangeNotificationProps {
  userId: string;
  username: string;
  oldRank: number;
  newRank: number;
  onClose: () => void;
}

export function RankChangeNotification({ 
  userId, 
  username, 
  oldRank, 
  newRank, 
  onClose 
}: RankChangeNotificationProps) {
  const isImprovement = newRank < oldRank;
  
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`
        frosted-glass rounded-2xl p-4 border border-white/20 backdrop-blur-xl max-w-sm
        ${isImprovement 
          ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-400/50' 
          : 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-400/50'
        }
      `}>
        <div className="flex items-start gap-3">
          <div className="text-2xl">
            {isImprovement ? '🚀' : '📉'}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">
              Rank {isImprovement ? 'Up' : 'Down'}!
            </h3>
            <p className="text-sm text-white/80">
              <strong>{username}</strong> moved from #{oldRank} to #{newRank}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                isImprovement 
                  ? 'bg-green-500/30 text-green-200' 
                  : 'bg-red-500/30 text-red-200'
              }`}>
                {isImprovement ? '+' : ''}{newRank - oldRank} positions
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Points increase animation component
export function PointsIncreaseAnimation({ 
  points, 
  position 
}: { 
  points: number; 
  position: { x: number; y: number } 
}) {
  return (
    <div 
      className="fixed pointer-events-none z-50 animate-points-float"
      style={{ left: position.x, top: position.y }}
    >
      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
        +{points}
      </div>
    </div>
  );
}

// Custom CSS animations
const animationStyles = `
  @keyframes rank-change {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
    100% { transform: scale(1); }
  }

  @keyframes points-increase {
    0% { transform: scale(1); color: inherit; }
    50% { transform: scale(1.2); color: #10b981; }
    100% { transform: scale(1); color: inherit; }
  }

  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes points-float {
    0% {
      transform: translateY(0) scale(0.8);
      opacity: 0;
    }
    10% {
      opacity: 1;
      transform: translateY(-10px) scale(1);
    }
    100% {
      transform: translateY(-50px) scale(0.8);
      opacity: 0;
    }
  }

  .animate-rank-change {
    animation: rank-change 0.6s ease-out;
  }

  .animate-points-increase {
    animation: points-increase 0.5s ease-out;
  }

  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }

  .animate-points-float {
    animation: points-float 2s ease-out forwards;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = animationStyles;
  document.head.appendChild(styleElement);
}
