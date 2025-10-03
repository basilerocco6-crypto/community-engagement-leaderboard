'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserEngagement, 
  TierInfo, 
  EngagementEvent,
  UserRewardUnlock,
  RewardConfiguration,
  ActivityType,
  ACTIVITY_POINTS
} from '@/lib/types/engagement';
import { TierBadge, TierProgress } from '@/components/TierBadge';
import { RewardList } from '@/components/RewardComponents';
import { EngagementHistory } from '@/components/EngagementHistory';
import { PointsBreakdownChart } from '@/components/PointsChart';
import { AchievementBadges } from '@/components/AchievementBadges';

interface UserProfileData {
  engagement: UserEngagement;
  tierInfo: TierInfo;
  rank: number;
  recentActivities: EngagementEvent[];
  unlockedRewards: UserRewardUnlock[];
  availableRewards: RewardConfiguration[];
  pointsBreakdown: Record<string, number>;
  achievements: Achievement[];
}

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

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'rewards' | 'achievements'>('overview');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const [
        engagementResponse,
        tierResponse,
        activitiesResponse,
        rewardsResponse
      ] = await Promise.all([
        fetch('/api/engagement/activity'),
        fetch('/api/engagement/tier'),
        fetch('/api/engagement/activity/history?limit=50'),
        fetch('/api/rewards/user')
      ]);

      const [
        engagementData,
        tierData,
        activitiesData,
        rewardsData
      ] = await Promise.all([
        engagementResponse.json(),
        tierResponse.json(),
        activitiesResponse.json(),
        rewardsResponse.json()
      ]);

      if (engagementData.success && tierData.success) {
        // Calculate points breakdown
        const pointsBreakdown = calculatePointsBreakdown(activitiesData.activities || []);
        
        // Generate achievements
        const achievements = generateAchievements(
          engagementData.user_engagement,
          activitiesData.activities || [],
          rewardsData.user_rewards || []
        );

        setProfileData({
          engagement: engagementData.user_engagement,
          tierInfo: tierData.tier_info,
          rank: engagementData.rank || 0,
          recentActivities: activitiesData.activities || [],
          unlockedRewards: rewardsData.user_rewards || [],
          availableRewards: rewardsData.available_rewards || [],
          pointsBreakdown,
          achievements
        });
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePointsBreakdown = (activities: EngagementEvent[]): Record<string, number> => {
    const breakdown: Record<string, number> = {};
    
    activities.forEach(activity => {
      const activityType = activity.activity_type;
      breakdown[activityType] = (breakdown[activityType] || 0) + activity.points_awarded;
    });

    return breakdown;
  };

  const generateAchievements = (
    engagement: UserEngagement,
    activities: EngagementEvent[],
    rewards: UserRewardUnlock[]
  ): Achievement[] => {
    const achievements: Achievement[] = [
      // Milestone achievements
      {
        id: 'first_points',
        title: 'Getting Started',
        description: 'Earned your first points',
        icon: '🎯',
        category: 'milestone',
        isUnlocked: engagement.total_points > 0,
        unlockedAt: activities.length > 0 ? activities[activities.length - 1].created_at : undefined
      },
      {
        id: 'hundred_points',
        title: 'Century Club',
        description: 'Reached 100 total points',
        icon: '💯',
        category: 'milestone',
        isUnlocked: engagement.total_points >= 100,
        progress: Math.min(engagement.total_points, 100),
        maxProgress: 100
      },
      {
        id: 'thousand_points',
        title: 'Point Master',
        description: 'Reached 1,000 total points',
        icon: '🏆',
        category: 'milestone',
        isUnlocked: engagement.total_points >= 1000,
        progress: Math.min(engagement.total_points, 1000),
        maxProgress: 1000
      },
      
      // Engagement achievements
      {
        id: 'active_chatter',
        title: 'Active Chatter',
        description: 'Sent 50 chat messages',
        icon: '💬',
        category: 'engagement',
        isUnlocked: activities.filter(a => a.activity_type === ActivityType.CHAT_MESSAGE).length >= 50,
        progress: activities.filter(a => a.activity_type === ActivityType.CHAT_MESSAGE).length,
        maxProgress: 50
      },
      {
        id: 'forum_contributor',
        title: 'Forum Contributor',
        description: 'Created 10 forum posts',
        icon: '📝',
        category: 'engagement',
        isUnlocked: activities.filter(a => a.activity_type === ActivityType.FORUM_POST).length >= 10,
        progress: activities.filter(a => a.activity_type === ActivityType.FORUM_POST).length,
        maxProgress: 10
      },
      {
        id: 'course_completer',
        title: 'Learning Enthusiast',
        description: 'Completed 5 courses',
        icon: '🎓',
        category: 'learning',
        isUnlocked: activities.filter(a => a.activity_type === ActivityType.COURSE_COMPLETED).length >= 5,
        progress: activities.filter(a => a.activity_type === ActivityType.COURSE_COMPLETED).length,
        maxProgress: 5
      },

      // Social achievements
      {
        id: 'reward_collector',
        title: 'Reward Collector',
        description: 'Unlocked 5 rewards',
        icon: '🎁',
        category: 'social',
        isUnlocked: rewards.length >= 5,
        progress: rewards.length,
        maxProgress: 5
      },
      {
        id: 'tier_climber',
        title: 'Tier Climber',
        description: 'Reached Gold tier or higher',
        icon: '⬆️',
        category: 'social',
        isUnlocked: ['Gold', 'Platinum', 'Diamond'].includes(engagement.current_tier)
      }
    ];

    return achievements;
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="frosted-glass rounded-2xl p-8 border border-white/20 backdrop-blur-xl bg-white/10 text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-white/70">Unable to load your profile data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Profile Header */}
        <ProfileHeader profileData={profileData} />

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="frosted-glass rounded-2xl p-2 border border-white/20 backdrop-blur-xl bg-white/10">
            <div className="flex space-x-2">
              {[
                { id: 'overview', label: '📊 Overview', icon: '📊' },
                { id: 'history', label: '📈 History', icon: '📈' },
                { id: 'rewards', label: '🎁 Rewards', icon: '🎁' },
                { id: 'achievements', label: '🏆 Achievements', icon: '🏆' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-6xl mx-auto">
          {activeTab === 'overview' && (
            <OverviewTab profileData={profileData} />
          )}
          {activeTab === 'history' && (
            <HistoryTab activities={profileData.recentActivities} />
          )}
          {activeTab === 'rewards' && (
            <RewardsTab 
              unlockedRewards={profileData.unlockedRewards}
              availableRewards={profileData.availableRewards}
            />
          )}
          {activeTab === 'achievements' && (
            <AchievementsTab achievements={profileData.achievements} />
          )}
        </div>
      </div>
    </div>
  );
}

// Profile Header Component
function ProfileHeader({ profileData }: { profileData: UserProfileData }) {
  const { engagement, tierInfo, rank } = profileData;

  return (
    <div className="frosted-glass rounded-2xl p-8 border border-white/20 backdrop-blur-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 mb-8">
      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Avatar and Basic Info */}
        <div className="flex flex-col items-center text-center lg:text-left">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-3xl mb-4">
            {engagement.username.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{engagement.username}</h1>
          <div className="flex items-center gap-2 mb-4">
            <TierBadge tier={tierInfo.current_tier} size="large" />
            <span className="text-white/70">Rank #{rank}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <div className="text-center bg-white/10 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{engagement.total_points.toLocaleString()}</div>
            <div className="text-sm text-white/70">Total Points</div>
          </div>
          <div className="text-center bg-white/10 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">#{rank}</div>
            <div className="text-sm text-white/70">Global Rank</div>
          </div>
          <div className="text-center bg-white/10 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{profileData.unlockedRewards.length}</div>
            <div className="text-sm text-white/70">Rewards</div>
          </div>
          <div className="text-center bg-white/10 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">
              {profileData.achievements.filter(a => a.isUnlocked).length}
            </div>
            <div className="text-sm text-white/70">Achievements</div>
          </div>
        </div>
      </div>

      {/* Tier Progress */}
      <div className="mt-6">
        <TierProgress tierInfo={tierInfo} showDetails={false} />
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ profileData }: { profileData: UserProfileData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Points Breakdown Chart */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <h3 className="text-xl font-bold text-white mb-4">📊 Points Breakdown</h3>
        <PointsBreakdownChart data={profileData.pointsBreakdown} />
      </div>

      {/* Recent Activity Summary */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <h3 className="text-xl font-bold text-white mb-4">📈 Recent Activity</h3>
        <div className="space-y-3">
          {profileData.recentActivities.slice(0, 5).map((activity, index) => (
            <div key={activity.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="text-2xl">
                {getActivityIcon(activity.activity_type)}
              </div>
              <div className="flex-1">
                <div className="text-white/90 text-sm font-medium">
                  {getActivityDescription(activity.activity_type)}
                </div>
                <div className="text-white/70 text-xs">
                  {new Date(activity.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="text-green-400 font-bold">
                +{activity.points_awarded}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Tier Requirements */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <h3 className="text-xl font-bold text-white mb-4">🎯 Next Tier Goals</h3>
        {profileData.tierInfo.next_tier ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/90">Target Tier:</span>
              <TierBadge tier={profileData.tierInfo.next_tier} size="medium" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/90">Points Needed:</span>
              <span className="text-white font-bold">
                {profileData.tierInfo.points_to_next_tier?.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/90">Progress:</span>
              <span className="text-white font-bold">
                {profileData.tierInfo.progress_percentage.toFixed(1)}%
              </span>
            </div>
            <div className="mt-4">
              <div className="text-sm text-white/70 mb-2">Suggested Activities:</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">Complete a course</span>
                  <span className="text-green-400">+100 points</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">Create 5 forum posts</span>
                  <span className="text-green-400">+75 points</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">Send 20 chat messages</span>
                  <span className="text-green-400">+60 points</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">👑</div>
            <div className="text-white font-bold mb-2">Maximum Tier Reached!</div>
            <div className="text-white/70">You've achieved the highest tier available.</div>
          </div>
        )}
      </div>

      {/* Achievement Preview */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <h3 className="text-xl font-bold text-white mb-4">🏆 Recent Achievements</h3>
        <div className="space-y-3">
          {profileData.achievements
            .filter(a => a.isUnlocked)
            .slice(0, 4)
            .map(achievement => (
              <div key={achievement.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <div className="text-white/90 font-medium">{achievement.title}</div>
                  <div className="text-white/70 text-sm">{achievement.description}</div>
                </div>
                <div className="text-green-400 text-sm">
                  {achievement.unlockedAt && new Date(achievement.unlockedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// History Tab Component
function HistoryTab({ activities }: { activities: EngagementEvent[] }) {
  return (
    <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
      <h3 className="text-xl font-bold text-white mb-6">📈 Engagement History</h3>
      <EngagementHistory activities={activities} />
    </div>
  );
}

// Rewards Tab Component
function RewardsTab({ 
  unlockedRewards, 
  availableRewards 
}: { 
  unlockedRewards: UserRewardUnlock[];
  availableRewards: RewardConfiguration[];
}) {
  return (
    <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
      <RewardList
        unlockedRewards={unlockedRewards}
        availableRewards={availableRewards}
        showAll={true}
      />
    </div>
  );
}

// Achievements Tab Component
function AchievementsTab({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
      <AchievementBadges achievements={achievements} />
    </div>
  );
}

// Helper Functions
function getActivityIcon(activityType: string): string {
  const icons: Record<string, string> = {
    [ActivityType.CHAT_MESSAGE]: '💬',
    [ActivityType.FORUM_POST]: '📝',
    [ActivityType.FORUM_REPLY]: '💭',
    [ActivityType.COURSE_COMPLETED]: '🎓',
    [ActivityType.LESSON_COMPLETED]: '📚',
    [ActivityType.QUIZ_PASSED]: '✅',
    [ActivityType.REACTION_GIVEN]: '👍',
    [ActivityType.DAILY_LOGIN]: '📅',
    [ActivityType.PROFILE_COMPLETED]: '👤',
    [ActivityType.CONTENT_SHARED]: '📤'
  };
  return icons[activityType] || '⭐';
}

function getActivityDescription(activityType: string): string {
  const descriptions: Record<string, string> = {
    [ActivityType.CHAT_MESSAGE]: 'Sent a chat message',
    [ActivityType.FORUM_POST]: 'Created a forum post',
    [ActivityType.FORUM_REPLY]: 'Replied to a forum post',
    [ActivityType.COURSE_COMPLETED]: 'Completed a course',
    [ActivityType.LESSON_COMPLETED]: 'Completed a lesson',
    [ActivityType.QUIZ_PASSED]: 'Passed a quiz',
    [ActivityType.REACTION_GIVEN]: 'Gave a reaction',
    [ActivityType.DAILY_LOGIN]: 'Daily login',
    [ActivityType.PROFILE_COMPLETED]: 'Completed profile',
    [ActivityType.CONTENT_SHARED]: 'Shared content'
  };
  return descriptions[activityType] || 'Unknown activity';
}

// Loading Skeleton
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="frosted-glass rounded-2xl p-8 border border-white/20 backdrop-blur-xl bg-white/10 animate-pulse mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-white/20 mb-4"></div>
              <div className="w-32 h-6 bg-white/20 rounded mb-2"></div>
              <div className="w-24 h-4 bg-white/20 rounded"></div>
            </div>
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-4">
                  <div className="w-16 h-6 bg-white/20 rounded mb-2"></div>
                  <div className="w-12 h-4 bg-white/20 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
