'use client';

import React, { useState } from 'react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'engagement' | 'social' | 'learning' | 'milestone';
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  isUnlocked: boolean;
}

interface AchievementBadgesProps {
  achievements: Achievement[];
  className?: string;
}

export function AchievementBadges({ achievements, className = '' }: AchievementBadgesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);

  const categories = [
    { id: 'all', label: 'All', icon: '🏆' },
    { id: 'milestone', label: 'Milestones', icon: '🎯' },
    { id: 'engagement', label: 'Engagement', icon: '💬' },
    { id: 'learning', label: 'Learning', icon: '🎓' },
    { id: 'social', label: 'Social', icon: '👥' }
  ];

  const filteredAchievements = achievements.filter(achievement => {
    const categoryMatch = selectedCategory === 'all' || achievement.category === selectedCategory;
    const unlockedMatch = !showOnlyUnlocked || achievement.isUnlocked;
    return categoryMatch && unlockedMatch;
  });

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;

  return (
    <div className={className}>
      {/* Header Stats */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">🏆 Achievements</h3>
          <p className="text-white/70">
            {unlockedCount} of {totalCount} achievements unlocked ({((unlockedCount / totalCount) * 100).toFixed(1)}%)
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{unlockedCount}</div>
          <div className="text-sm text-white/70">Unlocked</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-white/70 mb-2">
          <span>Achievement Progress</span>
          <span>{((unlockedCount / totalCount) * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3">
          <div 
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-1000"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {category.icon} {category.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showOnlyUnlocked"
            checked={showOnlyUnlocked}
            onChange={(e) => setShowOnlyUnlocked(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="showOnlyUnlocked" className="text-sm text-white/70">
            Show only unlocked
          </label>
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map(achievement => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12 text-white/70">
          <div className="text-4xl mb-4">🏆</div>
          <p>No achievements found for the selected filters.</p>
        </div>
      )}
    </div>
  );
}

interface AchievementCardProps {
  achievement: Achievement;
}

function AchievementCard({ achievement }: AchievementCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getCategoryColor = (category: string) => {
    const colors = {
      milestone: 'from-yellow-500 to-orange-500',
      engagement: 'from-blue-500 to-purple-500',
      learning: 'from-green-500 to-teal-500',
      social: 'from-pink-500 to-rose-500'
    };
    return colors[category as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const getProgressPercentage = () => {
    if (!achievement.maxProgress || !achievement.progress) return 0;
    return Math.min((achievement.progress / achievement.maxProgress) * 100, 100);
  };

  return (
    <div 
      className={`
        relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
        ${achievement.isUnlocked 
          ? `bg-gradient-to-br ${getCategoryColor(achievement.category)} bg-opacity-20 border-white/30 hover:scale-105` 
          : 'bg-white/5 border-white/10 hover:bg-white/10'
        }
      `}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Achievement Icon */}
      <div className="flex items-center justify-between mb-3">
        <div className={`
          text-4xl p-3 rounded-full
          ${achievement.isUnlocked 
            ? 'bg-white/20 shadow-lg' 
            : 'bg-white/10 grayscale opacity-50'
          }
        `}>
          {achievement.icon}
        </div>
        
        {achievement.isUnlocked && (
          <div className="text-green-400">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Achievement Info */}
      <div className="mb-3">
        <h4 className={`font-bold mb-1 ${achievement.isUnlocked ? 'text-white' : 'text-white/60'}`}>
          {achievement.title}
        </h4>
        <p className={`text-sm ${achievement.isUnlocked ? 'text-white/80' : 'text-white/50'}`}>
          {achievement.description}
        </p>
      </div>

      {/* Progress Bar (for incomplete achievements) */}
      {!achievement.isUnlocked && achievement.maxProgress && achievement.progress !== undefined && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>Progress</span>
            <span>{achievement.progress} / {achievement.maxProgress}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      )}

      {/* Category Badge */}
      <div className="flex items-center justify-between">
        <span className={`
          px-2 py-1 rounded-full text-xs font-medium
          ${achievement.isUnlocked 
            ? 'bg-white/20 text-white' 
            : 'bg-white/10 text-white/60'
          }
        `}>
          {achievement.category}
        </span>
        
        {achievement.isUnlocked && achievement.unlockedAt && (
          <span className="text-xs text-white/60">
            {new Date(achievement.unlockedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Unlock Animation */}
      {achievement.isUnlocked && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 right-2 animate-bounce">
            ✨
          </div>
        </div>
      )}

      {/* Detailed View */}
      {showDetails && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-xl p-4 z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="text-3xl">{achievement.icon}</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(false);
              }}
              className="text-white/60 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <h4 className="text-lg font-bold text-white mb-2">{achievement.title}</h4>
          <p className="text-white/80 text-sm mb-4">{achievement.description}</p>
          
          {achievement.isUnlocked ? (
            <div className="text-center">
              <div className="text-green-400 font-bold mb-2">🎉 Unlocked!</div>
              {achievement.unlockedAt && (
                <div className="text-white/60 text-sm">
                  Achieved on {new Date(achievement.unlockedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-white/60 mb-2">Not yet unlocked</div>
              {achievement.maxProgress && achievement.progress !== undefined && (
                <div className="text-sm">
                  <div className="text-white/80">
                    Progress: {achievement.progress} / {achievement.maxProgress}
                  </div>
                  <div className="text-white/60">
                    {achievement.maxProgress - achievement.progress} more to go!
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Achievement Categories Component
export function AchievementCategories({ 
  achievements, 
  className = '' 
}: { 
  achievements: Achievement[]; 
  className?: string;
}) {
  const categories = ['milestone', 'engagement', 'learning', 'social'];
  
  const categoryStats = categories.map(category => {
    const categoryAchievements = achievements.filter(a => a.category === category);
    const unlockedCount = categoryAchievements.filter(a => a.isUnlocked).length;
    
    return {
      category,
      total: categoryAchievements.length,
      unlocked: unlockedCount,
      percentage: categoryAchievements.length > 0 ? (unlockedCount / categoryAchievements.length) * 100 : 0
    };
  });

  const getCategoryInfo = (category: string) => {
    const info = {
      milestone: { icon: '🎯', label: 'Milestones', color: 'from-yellow-500 to-orange-500' },
      engagement: { icon: '💬', label: 'Engagement', color: 'from-blue-500 to-purple-500' },
      learning: { icon: '🎓', label: 'Learning', color: 'from-green-500 to-teal-500' },
      social: { icon: '👥', label: 'Social', color: 'from-pink-500 to-rose-500' }
    };
    return info[category as keyof typeof info];
  };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {categoryStats.map(stat => {
        const info = getCategoryInfo(stat.category);
        return (
          <div key={stat.category} className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">{info.icon}</div>
            <div className="font-bold text-white mb-1">{info.label}</div>
            <div className="text-sm text-white/70 mb-2">
              {stat.unlocked} / {stat.total}
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className={`h-full bg-gradient-to-r ${info.color} rounded-full transition-all duration-500`}
                style={{ width: `${stat.percentage}%` }}
              />
            </div>
            <div className="text-xs text-white/60 mt-1">
              {stat.percentage.toFixed(0)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Recent Achievements Component
export function RecentAchievements({ 
  achievements, 
  limit = 5, 
  className = '' 
}: { 
  achievements: Achievement[]; 
  limit?: number;
  className?: string;
}) {
  const recentAchievements = achievements
    .filter(a => a.isUnlocked && a.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, limit);

  if (recentAchievements.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-4xl mb-4">🏆</div>
        <p className="text-white/70">No achievements unlocked yet.</p>
        <p className="text-white/50 text-sm mt-2">Keep engaging to earn your first achievement!</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <h4 className="text-lg font-semibold text-white mb-4">Recent Achievements</h4>
      <div className="space-y-3">
        {recentAchievements.map(achievement => (
          <div key={achievement.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <div className="text-2xl">{achievement.icon}</div>
            <div className="flex-1">
              <div className="font-medium text-white">{achievement.title}</div>
              <div className="text-sm text-white/70">{achievement.description}</div>
            </div>
            <div className="text-xs text-white/60">
              {achievement.unlockedAt && new Date(achievement.unlockedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
