'use client';

import React, { useState } from 'react';
import { EngagementEvent, ActivityType } from '@/lib/types/engagement';

interface EngagementHistoryProps {
  activities: EngagementEvent[];
  className?: string;
}

export function EngagementHistory({ activities, className = '' }: EngagementHistoryProps) {
  const [filter, setFilter] = useState<'all' | ActivityType>('all');
  const [sortBy, setSortBy] = useState<'date' | 'points'>('date');

  const filteredActivities = activities
    .filter(activity => filter === 'all' || activity.activity_type === filter)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return b.points_awarded - a.points_awarded;
      }
    });

  const activityTypes = Array.from(new Set(activities.map(a => a.activity_type)));

  return (
    <div className={className}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-white/80 mb-2">
            Filter by Activity
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Activities</option>
            {activityTypes.map(type => (
              <option key={type} value={type}>
                {getActivityTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-white/80 mb-2">
            Sort by
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Most Recent</option>
            <option value="points">Highest Points</option>
          </select>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-white/70">
            <div className="text-4xl mb-4">📭</div>
            <p>No activities found for the selected filter.</p>
          </div>
        ) : (
          filteredActivities.map((activity, index) => (
            <ActivityCard 
              key={activity.id} 
              activity={activity} 
              isFirst={index === 0}
            />
          ))
        )}
      </div>

      {/* Load More Button */}
      {filteredActivities.length >= 50 && (
        <div className="text-center mt-6">
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            Load More Activities
          </button>
        </div>
      )}
    </div>
  );
}

interface ActivityCardProps {
  activity: EngagementEvent;
  isFirst: boolean;
}

function ActivityCard({ activity, isFirst }: ActivityCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const activityIcon = getActivityIcon(activity.activity_type);
  const activityLabel = getActivityTypeLabel(activity.activity_type);
  const activityDescription = getActivityDescription(activity);

  const timeAgo = getTimeAgo(activity.created_at);
  const date = new Date(activity.created_at);

  return (
    <div className={`
      relative flex gap-4 p-4 rounded-xl transition-all duration-300
      ${isFirst ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30' : 'bg-white/5 hover:bg-white/10'}
    `}>
      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
          ${isFirst 
            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
            : 'bg-white/10 text-white/80'
          }
        `}>
          {activityIcon}
        </div>
        <div className="w-0.5 h-8 bg-white/20 mt-2"></div>
      </div>

      {/* Activity Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-white">{activityLabel}</h4>
            {isFirst && (
              <span className="px-2 py-1 bg-green-500/30 text-green-200 text-xs rounded-full">
                Latest
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-bold">+{activity.points_awarded}</span>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        <p className="text-white/80 text-sm mb-2">{activityDescription}</p>

        <div className="flex items-center gap-4 text-xs text-white/60">
          <span>{timeAgo}</span>
          <span>{date.toLocaleDateString()}</span>
          <span>{date.toLocaleTimeString()}</span>
        </div>

        {/* Expandable Details */}
        {showDetails && activity.metadata && (
          <div className="mt-4 p-3 bg-white/5 rounded-lg">
            <h5 className="text-sm font-medium text-white/90 mb-2">Activity Details</h5>
            <div className="space-y-1 text-xs text-white/70">
              {Object.entries(activity.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Activity Statistics Component
interface ActivityStatsProps {
  activities: EngagementEvent[];
  className?: string;
}

export function ActivityStats({ activities, className = '' }: ActivityStatsProps) {
  const stats = calculateActivityStats(activities);

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      <div className="bg-white/10 rounded-xl p-4 text-center">
        <div className="text-2xl font-bold text-white">{stats.totalActivities}</div>
        <div className="text-sm text-white/70">Total Activities</div>
      </div>
      <div className="bg-white/10 rounded-xl p-4 text-center">
        <div className="text-2xl font-bold text-white">{stats.totalPoints}</div>
        <div className="text-sm text-white/70">Points Earned</div>
      </div>
      <div className="bg-white/10 rounded-xl p-4 text-center">
        <div className="text-2xl font-bold text-white">{stats.averagePoints}</div>
        <div className="text-sm text-white/70">Avg Points</div>
      </div>
      <div className="bg-white/10 rounded-xl p-4 text-center">
        <div className="text-2xl font-bold text-white">{stats.activeDays}</div>
        <div className="text-sm text-white/70">Active Days</div>
      </div>
    </div>
  );
}

// Activity Heatmap Component
export function ActivityHeatmap({ activities, className = '' }: { activities: EngagementEvent[]; className?: string }) {
  const heatmapData = generateHeatmapData(activities);

  return (
    <div className={`${className}`}>
      <h4 className="text-lg font-semibold text-white mb-4">Activity Heatmap</h4>
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs text-white/70 p-1">
            {day}
          </div>
        ))}
        {heatmapData.map((day, index) => (
          <div
            key={index}
            className={`
              aspect-square rounded text-xs flex items-center justify-center
              ${getHeatmapColor(day.count)}
            `}
            title={`${day.date}: ${day.count} activities`}
          >
            {day.count > 0 ? day.count : ''}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-white/60">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map(level => (
            <div key={level} className={`w-3 h-3 rounded ${getHeatmapColor(level)}`}></div>
          ))}
        </div>
        <span>More</span>
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

function getActivityTypeLabel(activityType: string): string {
  const labels: Record<string, string> = {
    [ActivityType.CHAT_MESSAGE]: 'Chat Message',
    [ActivityType.FORUM_POST]: 'Forum Post',
    [ActivityType.FORUM_REPLY]: 'Forum Reply',
    [ActivityType.COURSE_COMPLETED]: 'Course Completed',
    [ActivityType.LESSON_COMPLETED]: 'Lesson Completed',
    [ActivityType.QUIZ_PASSED]: 'Quiz Passed',
    [ActivityType.REACTION_GIVEN]: 'Reaction Given',
    [ActivityType.DAILY_LOGIN]: 'Daily Login',
    [ActivityType.PROFILE_COMPLETED]: 'Profile Completed',
    [ActivityType.CONTENT_SHARED]: 'Content Shared'
  };
  return labels[activityType] || 'Unknown Activity';
}

function getActivityDescription(activity: EngagementEvent): string {
  const baseDescriptions: Record<string, string> = {
    [ActivityType.CHAT_MESSAGE]: 'Participated in community chat',
    [ActivityType.FORUM_POST]: 'Created a new forum discussion',
    [ActivityType.FORUM_REPLY]: 'Replied to a forum discussion',
    [ActivityType.COURSE_COMPLETED]: 'Successfully completed a course',
    [ActivityType.LESSON_COMPLETED]: 'Finished a lesson',
    [ActivityType.QUIZ_PASSED]: 'Passed a knowledge quiz',
    [ActivityType.REACTION_GIVEN]: 'Reacted to community content',
    [ActivityType.DAILY_LOGIN]: 'Logged in to the community',
    [ActivityType.PROFILE_COMPLETED]: 'Updated profile information',
    [ActivityType.CONTENT_SHARED]: 'Shared content with the community'
  };

  let description = baseDescriptions[activity.activity_type] || 'Engaged with the community';

  // Add metadata context if available
  if (activity.metadata) {
    if (activity.metadata.chat_data?.content) {
      const content = activity.metadata.chat_data.content;
      if (content.length > 50) {
        description += `: "${content.substring(0, 50)}..."`;
      } else {
        description += `: "${content}"`;
      }
    } else if (activity.metadata.forum_data?.title) {
      description += `: "${activity.metadata.forum_data.title}"`;
    } else if (activity.metadata.course_data?.course_title) {
      description += `: "${activity.metadata.course_data.course_title}"`;
    }
  }

  return description;
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 604800)}w ago`;
}

function calculateActivityStats(activities: EngagementEvent[]) {
  const totalActivities = activities.length;
  const totalPoints = activities.reduce((sum, activity) => sum + activity.points_awarded, 0);
  const averagePoints = totalActivities > 0 ? Math.round(totalPoints / totalActivities) : 0;
  
  const uniqueDates = new Set(
    activities.map(activity => new Date(activity.created_at).toDateString())
  );
  const activeDays = uniqueDates.size;

  return {
    totalActivities,
    totalPoints,
    averagePoints,
    activeDays
  };
}

function generateHeatmapData(activities: EngagementEvent[]) {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 48); // Show last 7 weeks

  const data = [];
  const activityCounts: Record<string, number> = {};

  // Count activities by date
  activities.forEach(activity => {
    const date = new Date(activity.created_at).toDateString();
    activityCounts[date] = (activityCounts[date] || 0) + 1;
  });

  // Generate 49 days (7 weeks)
  for (let i = 0; i < 49; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateString = date.toDateString();
    
    data.push({
      date: dateString,
      count: activityCounts[dateString] || 0
    });
  }

  return data;
}

function getHeatmapColor(count: number): string {
  if (count === 0) return 'bg-white/10';
  if (count <= 2) return 'bg-green-500/30';
  if (count <= 4) return 'bg-green-500/50';
  if (count <= 6) return 'bg-green-500/70';
  return 'bg-green-500/90';
}
