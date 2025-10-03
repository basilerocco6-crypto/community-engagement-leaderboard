'use client';

import React, { useState, useEffect } from 'react';
import { ActivityType } from '@/lib/types/engagement';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalPoints: number;
  totalActivities: number;
  mostActiveMembers: Array<{
    user_id: string;
    username: string;
    total_points: number;
    current_tier: string;
    activities_count: number;
  }>;
  activityBreakdown: Array<{
    activity_type: string;
    count: number;
    total_points: number;
    percentage: number;
  }>;
  engagementTrends: Array<{
    date: string;
    total_activities: number;
    total_points: number;
    unique_users: number;
  }>;
  tierDistribution: Array<{
    tier_name: string;
    user_count: number;
    percentage: number;
  }>;
}

export function EngagementAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`);
      const data = await response.json();

      if (data.success) {
        setAnalyticsData(data.analytics);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch(`/api/admin/analytics/export?timeRange=${timeRange}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `engagement-analytics-${timeRange}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (!analyticsData) {
    return (
      <div className="frosted-glass rounded-2xl p-8 border border-white/20 backdrop-blur-xl bg-white/10 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-white mb-2">No Analytics Data</h3>
        <p className="text-white/70">Unable to load engagement analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">📈 Engagement Analytics</h2>
            <p className="text-white/70">Insights into your community's engagement patterns</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <button
              onClick={loadAnalyticsData}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={exportData}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Export Data
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Users"
            value={analyticsData.totalUsers.toLocaleString()}
            subtitle={`${analyticsData.activeUsers} active`}
            icon="👥"
            trend="+12%"
          />
          <MetricCard
            title="Total Points"
            value={analyticsData.totalPoints.toLocaleString()}
            subtitle="awarded"
            icon="⚡"
            trend="+8%"
          />
          <MetricCard
            title="Activities"
            value={analyticsData.totalActivities.toLocaleString()}
            subtitle="total actions"
            icon="📊"
            trend="+15%"
          />
          <MetricCard
            title="Avg Points/User"
            value={Math.round(analyticsData.totalPoints / analyticsData.totalUsers).toLocaleString()}
            subtitle="per member"
            icon="📈"
            trend="+5%"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Active Members */}
        <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
          <h3 className="text-xl font-bold text-white mb-4">🏆 Most Active Members</h3>
          <div className="space-y-3">
            {analyticsData.mostActiveMembers.slice(0, 10).map((member, index) => (
              <div key={member.user_id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-yellow-500 text-black' :
                  index === 1 ? 'bg-gray-300 text-black' :
                  index === 2 ? 'bg-amber-600 text-white' :
                  'bg-white/20 text-white'
                }`}>
                  {index + 1}
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {member.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">{member.username}</div>
                  <div className="text-sm text-white/70">
                    {member.current_tier} • {member.activities_count} activities
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">{member.total_points.toLocaleString()}</div>
                  <div className="text-sm text-white/70">points</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Breakdown */}
        <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
          <h3 className="text-xl font-bold text-white mb-4">📊 Activity Breakdown</h3>
          <div className="space-y-3">
            {analyticsData.activityBreakdown.map((activity, index) => (
              <div key={activity.activity_type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getActivityIcon(activity.activity_type)}</span>
                    <span className="text-white/90">{getActivityLabel(activity.activity_type)}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">{activity.count.toLocaleString()}</div>
                    <div className="text-white/70 text-sm">{activity.percentage.toFixed(1)}%</div>
                  </div>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${activity.percentage}%`,
                      backgroundColor: getActivityColor(activity.activity_type, index)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagement Trends Chart */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <h3 className="text-xl font-bold text-white mb-4">📈 Engagement Trends</h3>
        <EngagementTrendsChart data={analyticsData.engagementTrends} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Distribution */}
        <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
          <h3 className="text-xl font-bold text-white mb-4">🏆 Tier Distribution</h3>
          <TierDistributionChart data={analyticsData.tierDistribution} />
        </div>

        {/* Engagement Insights */}
        <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
          <h3 className="text-xl font-bold text-white mb-4">💡 Insights & Recommendations</h3>
          <EngagementInsights data={analyticsData} />
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  trend?: string;
}

function MetricCard({ title, value, subtitle, icon, trend }: MetricCardProps) {
  return (
    <div className="bg-white/10 rounded-xl p-4 text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-white/70">{title}</div>
      <div className="text-xs text-white/60">{subtitle}</div>
      {trend && (
        <div className={`text-xs mt-1 ${trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
          {trend} vs last period
        </div>
      )}
    </div>
  );
}

// Engagement Trends Chart Component
function EngagementTrendsChart({ data }: { data: AnalyticsData['engagementTrends'] }) {
  const maxActivities = Math.max(...data.map(d => d.total_activities));
  const maxPoints = Math.max(...data.map(d => d.total_points));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-white/70">Activities</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded"></div>
          <span className="text-white/70">Points</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-white/70">Unique Users</span>
        </div>
      </div>
      
      <div className="relative h-64 bg-white/5 rounded-lg p-4">
        <div className="grid grid-cols-7 gap-1 h-full">
          {data.slice(-7).map((day, index) => (
            <div key={day.date} className="flex flex-col justify-end items-center gap-1">
              <div className="flex flex-col justify-end items-center gap-1 flex-1 w-full">
                <div 
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${(day.total_activities / maxActivities) * 100}%` }}
                  title={`${day.total_activities} activities`}
                />
                <div 
                  className="w-full bg-purple-500"
                  style={{ height: `${(day.total_points / maxPoints) * 80}%` }}
                  title={`${day.total_points} points`}
                />
                <div 
                  className="w-full bg-green-500 rounded-b"
                  style={{ height: `${(day.unique_users / Math.max(...data.map(d => d.unique_users))) * 60}%` }}
                  title={`${day.unique_users} users`}
                />
              </div>
              <div className="text-xs text-white/60 mt-2">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Tier Distribution Chart Component
function TierDistributionChart({ data }: { data: AnalyticsData['tierDistribution'] }) {
  const tierColors: Record<string, string> = {
    'Bronze': '#CD7F32',
    'Silver': '#C0C0C0',
    'Gold': '#FFD700',
    'Platinum': '#E5E4E2',
    'Diamond': '#B9F2FF'
  };

  return (
    <div className="space-y-4">
      {data.map((tier, index) => (
        <div key={tier.tier_name} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: tierColors[tier.tier_name] || '#666' }}
              />
              <span className="text-white/90">{tier.tier_name}</span>
            </div>
            <div className="text-right">
              <div className="text-white font-medium">{tier.user_count}</div>
              <div className="text-white/70 text-sm">{tier.percentage.toFixed(1)}%</div>
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${tier.percentage}%`,
                backgroundColor: tierColors[tier.tier_name] || '#666'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Engagement Insights Component
function EngagementInsights({ data }: { data: AnalyticsData }) {
  const insights = generateInsights(data);

  return (
    <div className="space-y-4">
      {insights.map((insight, index) => (
        <div key={index} className="p-3 bg-white/5 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-xl">{insight.icon}</span>
            <div>
              <div className="font-medium text-white mb-1">{insight.title}</div>
              <div className="text-sm text-white/70">{insight.description}</div>
              {insight.action && (
                <div className="text-sm text-blue-300 mt-2">{insight.action}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Loading Skeleton
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="w-48 h-8 bg-white/20 rounded mb-2"></div>
            <div className="w-64 h-4 bg-white/20 rounded"></div>
          </div>
          <div className="flex gap-3">
            <div className="w-32 h-10 bg-white/20 rounded"></div>
            <div className="w-24 h-10 bg-white/20 rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/10 rounded-xl p-4">
              <div className="w-8 h-8 bg-white/20 rounded mb-2"></div>
              <div className="w-16 h-6 bg-white/20 rounded mb-1"></div>
              <div className="w-12 h-4 bg-white/20 rounded"></div>
            </div>
          ))}
        </div>
      </div>
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

function getActivityLabel(activityType: string): string {
  const labels: Record<string, string> = {
    [ActivityType.CHAT_MESSAGE]: 'Chat Messages',
    [ActivityType.FORUM_POST]: 'Forum Posts',
    [ActivityType.FORUM_REPLY]: 'Forum Replies',
    [ActivityType.COURSE_COMPLETED]: 'Courses Completed',
    [ActivityType.LESSON_COMPLETED]: 'Lessons Completed',
    [ActivityType.QUIZ_PASSED]: 'Quizzes Passed',
    [ActivityType.REACTION_GIVEN]: 'Reactions Given',
    [ActivityType.DAILY_LOGIN]: 'Daily Logins',
    [ActivityType.PROFILE_COMPLETED]: 'Profile Updates',
    [ActivityType.CONTENT_SHARED]: 'Content Shared'
  };
  return labels[activityType] || 'Unknown Activity';
}

function getActivityColor(activityType: string, index: number): string {
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];
  return colors[index % colors.length];
}

function generateInsights(data: AnalyticsData) {
  const insights = [];

  // Activity engagement insight
  const topActivity = data.activityBreakdown[0];
  if (topActivity) {
    insights.push({
      icon: getActivityIcon(topActivity.activity_type),
      title: 'Most Popular Activity',
      description: `${getActivityLabel(topActivity.activity_type)} accounts for ${topActivity.percentage.toFixed(1)}% of all activities.`,
      action: topActivity.percentage > 60 ? 'Consider diversifying engagement opportunities.' : null
    });
  }

  // Tier distribution insight
  const bronzeUsers = data.tierDistribution.find(t => t.tier_name === 'Bronze');
  if (bronzeUsers && bronzeUsers.percentage > 70) {
    insights.push({
      icon: '🎯',
      title: 'Tier Progression Opportunity',
      description: `${bronzeUsers.percentage.toFixed(1)}% of users are still in Bronze tier.`,
      action: 'Consider lowering tier thresholds or adding more engagement opportunities.'
    });
  }

  // User activity insight
  const avgPointsPerUser = data.totalPoints / data.totalUsers;
  insights.push({
    icon: '📊',
    title: 'Average Engagement',
    description: `Users average ${Math.round(avgPointsPerUser)} points each.`,
    action: avgPointsPerUser < 100 ? 'Consider increasing point values or adding more activities.' : null
  });

  // Active users insight
  const activePercentage = (data.activeUsers / data.totalUsers) * 100;
  insights.push({
    icon: '👥',
    title: 'User Activity Rate',
    description: `${activePercentage.toFixed(1)}% of users are actively engaging.`,
    action: activePercentage < 30 ? 'Focus on re-engagement campaigns for inactive users.' : null
  });

  return insights;
}
