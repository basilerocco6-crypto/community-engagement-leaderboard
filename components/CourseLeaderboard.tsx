'use client';

import React, { useState, useEffect } from 'react';

interface CourseLeaderboardEntry {
  user_id: string;
  username: string;
  progress_percentage: number;
  completed_modules: number;
  total_points: number;
  completion_time_days?: number;
  rank: number;
}

interface CourseData {
  whop_course_id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  thumbnail_url?: string;
  total_modules: number;
}

interface CourseStats {
  total_enrolled: number;
  total_completed: number;
  completion_rate: number;
  average_completion_days: number;
}

interface CourseLeaderboardProps {
  courseId: string;
  limit?: number;
  currentUserId?: string;
}

export function CourseLeaderboard({ courseId, limit = 10, currentUserId }: CourseLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<CourseLeaderboardEntry[]>([]);
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<CourseLeaderboardEntry | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [courseId, limit]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/leaderboard/${courseId}?limit=${limit}`);
      const data = await response.json();

      if (data.success) {
        setLeaderboard(data.data.leaderboard);
        setCourseData(data.data.course);
        setStats(data.data.statistics);

        // Find current user's rank if not in top results
        if (currentUserId) {
          const userInTop = data.data.leaderboard.find((entry: CourseLeaderboardEntry) => 
            entry.user_id === currentUserId
          );
          
          if (!userInTop) {
            // Fetch user's specific rank (would need additional API endpoint)
            // For now, we'll leave it null
            setCurrentUserRank(null);
          } else {
            setCurrentUserRank(userInTop);
          }
        }
      }
    } catch (error) {
      console.error('Error loading course leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <CourseLeaderboardSkeleton />;
  }

  if (!courseData) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">❌</div>
        <h3 className="text-xl font-bold text-white mb-2">Course Not Found</h3>
        <p className="text-white/70">Unable to load course leaderboard data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <div className="flex items-start gap-4">
          {courseData.thumbnail_url ? (
            <img
              src={courseData.thumbnail_url}
              alt={courseData.title}
              className="w-16 h-16 rounded-xl object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
              {courseData.title.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{courseData.title}</h2>
            <p className="text-white/70 mb-3">{courseData.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full">
                {courseData.category}
              </span>
              <span className={`px-3 py-1 rounded-full ${getDifficultyStyle(courseData.difficulty_level)}`}>
                {getDifficultyIcon(courseData.difficulty_level)} {courseData.difficulty_level}
              </span>
              <span className="text-white/70">
                {courseData.total_modules} modules
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Course Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Enrolled"
            value={stats.total_enrolled.toLocaleString()}
            icon="👥"
            color="blue"
          />
          <StatCard
            title="Completed"
            value={stats.total_completed.toLocaleString()}
            icon="🎓"
            color="green"
          />
          <StatCard
            title="Completion Rate"
            value={`${stats.completion_rate.toFixed(1)}%`}
            icon="📊"
            color="purple"
          />
          <StatCard
            title="Avg. Time"
            value={`${Math.round(stats.average_completion_days)} days`}
            icon="⏱️"
            color="orange"
          />
        </div>
      )}

      {/* Current User Rank (if not in top 10) */}
      {currentUserRank && currentUserRank.rank > limit && (
        <div className="frosted-glass rounded-xl p-4 border border-yellow-500/30 bg-yellow-500/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-500 text-black font-bold flex items-center justify-center text-sm">
              {currentUserRank.rank}
            </div>
            <div className="flex-1">
              <div className="font-medium text-white">Your Position</div>
              <div className="text-white/70 text-sm">
                {currentUserRank.progress_percentage.toFixed(1)}% complete • {currentUserRank.total_points} points
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold">#{currentUserRank.rank}</div>
              <div className="text-white/70 text-sm">
                {currentUserRank.completed_modules}/{courseData.total_modules}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <h3 className="text-xl font-bold text-white mb-4">🏆 Course Leaderboard</h3>
        
        {leaderboard.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <LeaderboardEntry
                key={entry.user_id}
                entry={entry}
                courseData={courseData}
                isCurrentUser={entry.user_id === currentUserId}
                position={index + 1}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📚</div>
            <h4 className="text-lg font-bold text-white mb-2">No Progress Yet</h4>
            <p className="text-white/70">Be the first to start this course!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Leaderboard Entry Component
function LeaderboardEntry({ 
  entry, 
  courseData, 
  isCurrentUser, 
  position 
}: { 
  entry: CourseLeaderboardEntry;
  courseData: CourseData;
  isCurrentUser: boolean;
  position: number;
}) {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-black';
    if (rank === 2) return 'bg-gray-300 text-black';
    if (rank === 3) return 'bg-amber-600 text-white';
    return 'bg-white/20 text-white';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank.toString();
  };

  return (
    <div className={`
      flex items-center gap-4 p-4 rounded-xl transition-all duration-300
      ${isCurrentUser 
        ? 'bg-blue-500/20 border-2 border-blue-400/50 shadow-lg' 
        : 'bg-white/5 hover:bg-white/10'
      }
    `}>
      {/* Rank */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getRankStyle(entry.rank)}`}>
        {position <= 3 ? getRankIcon(position) : position}
      </div>

      {/* User Avatar */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
        {entry.username.charAt(0).toUpperCase()}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-white truncate">{entry.username}</div>
          {isCurrentUser && (
            <span className="px-2 py-1 bg-blue-500/30 text-blue-200 rounded-full text-xs">You</span>
          )}
        </div>
        <div className="text-white/70 text-sm">
          {entry.progress_percentage.toFixed(1)}% complete • {entry.completed_modules}/{courseData.total_modules} modules
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-24">
        <div className="w-full bg-white/20 rounded-full h-2">
          <div 
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-purple-500"
            style={{ width: `${entry.progress_percentage}%` }}
          />
        </div>
      </div>

      {/* Points & Time */}
      <div className="text-right">
        <div className="font-bold text-white">{entry.total_points}</div>
        <div className="text-white/70 text-sm">
          {entry.completion_time_days ? `${entry.completion_time_days}d` : 'In progress'}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string; 
  value: string; 
  icon: string; 
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <div className="text-2xl font-bold text-white">{value}</div>
      </div>
      <div className="text-white/70 text-sm">{title}</div>
    </div>
  );
}

// Loading Skeleton
function CourseLeaderboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Course Header Skeleton */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl"></div>
          <div className="flex-1">
            <div className="w-64 h-8 bg-white/20 rounded mb-2"></div>
            <div className="w-96 h-4 bg-white/20 rounded mb-3"></div>
            <div className="flex gap-4">
              <div className="w-20 h-6 bg-white/20 rounded-full"></div>
              <div className="w-24 h-6 bg-white/20 rounded-full"></div>
              <div className="w-20 h-6 bg-white/20 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-white/20 rounded"></div>
              <div className="w-12 h-8 bg-white/20 rounded"></div>
            </div>
            <div className="w-16 h-4 bg-white/20 rounded"></div>
          </div>
        ))}
      </div>

      {/* Leaderboard Skeleton */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <div className="w-48 h-6 bg-white/20 rounded mb-4"></div>
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div className="w-10 h-10 bg-white/20 rounded-full"></div>
              <div className="w-12 h-12 bg-white/20 rounded-full"></div>
              <div className="flex-1">
                <div className="w-32 h-4 bg-white/20 rounded mb-1"></div>
                <div className="w-48 h-3 bg-white/20 rounded"></div>
              </div>
              <div className="w-24 h-2 bg-white/20 rounded"></div>
              <div className="text-right">
                <div className="w-12 h-4 bg-white/20 rounded mb-1"></div>
                <div className="w-16 h-3 bg-white/20 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper Functions
function getDifficultyStyle(level: string): string {
  switch (level) {
    case 'beginner': return 'bg-green-500/20 text-green-200';
    case 'intermediate': return 'bg-yellow-500/20 text-yellow-200';
    case 'advanced': return 'bg-red-500/20 text-red-200';
    default: return 'bg-white/20 text-white/70';
  }
}

function getDifficultyIcon(level: string): string {
  switch (level) {
    case 'beginner': return '🟢';
    case 'intermediate': return '🟡';
    case 'advanced': return '🔴';
    default: return '⚪';
  }
}
