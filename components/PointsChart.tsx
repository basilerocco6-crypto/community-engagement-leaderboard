'use client';

import React, { useState, useEffect } from 'react';
import { ActivityType, ACTIVITY_POINTS } from '@/lib/types/engagement';

interface PointsBreakdownChartProps {
  data: Record<string, number>;
  className?: string;
}

export function PointsBreakdownChart({ data, className = '' }: PointsBreakdownChartProps) {
  const [animatedData, setAnimatedData] = useState<Array<{ type: string; points: number; percentage: number }>>([]);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  useEffect(() => {
    const totalPoints = Object.values(data).reduce((sum, points) => sum + points, 0);
    
    const chartData = Object.entries(data)
      .map(([type, points]) => ({
        type,
        points,
        percentage: totalPoints > 0 ? (points / totalPoints) * 100 : 0
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 8); // Show top 8 activity types

    // Animate the data in
    setTimeout(() => {
      setAnimatedData(chartData);
    }, 100);
  }, [data]);

  const totalPoints = animatedData.reduce((sum, item) => sum + item.points, 0);

  if (animatedData.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-4xl mb-4">📊</div>
        <p className="text-white/70">No activity data available yet.</p>
        <p className="text-white/50 text-sm mt-2">Start engaging to see your points breakdown!</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Donut Chart */}
      <div className="flex flex-col lg:flex-row items-center gap-8">
        <div className="relative">
          <DonutChart 
            data={animatedData}
            hoveredSegment={hoveredSegment}
            onHover={setHoveredSegment}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {totalPoints.toLocaleString()}
              </div>
              <div className="text-sm text-white/70">Total Points</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {animatedData.map((item, index) => (
            <LegendItem
              key={item.type}
              item={item}
              color={getActivityColor(item.type, index)}
              isHovered={hoveredSegment === item.type}
              onHover={() => setHoveredSegment(item.type)}
              onLeave={() => setHoveredSegment(null)}
            />
          ))}
        </div>
      </div>

      {/* Activity Insights */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightCard
          title="Most Active"
          value={animatedData[0]?.type ? getActivityTypeLabel(animatedData[0].type) : 'N/A'}
          subtitle={`${animatedData[0]?.points || 0} points`}
          icon="🏆"
        />
        <InsightCard
          title="Activity Types"
          value={animatedData.length.toString()}
          subtitle="Different activities"
          icon="🎯"
        />
        <InsightCard
          title="Average per Activity"
          value={Math.round(totalPoints / animatedData.length || 0).toString()}
          subtitle="Points per type"
          icon="📈"
        />
      </div>
    </div>
  );
}

// Donut Chart Component
interface DonutChartProps {
  data: Array<{ type: string; points: number; percentage: number }>;
  hoveredSegment: string | null;
  onHover: (type: string | null) => void;
}

function DonutChart({ data, hoveredSegment, onHover }: DonutChartProps) {
  const size = 200;
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let cumulativePercentage = 0;

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        
        {/* Data segments */}
        {data.map((item, index) => {
          const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
          const strokeDashoffset = -cumulativePercentage * circumference / 100;
          const color = getActivityColor(item.type, index);
          const isHovered = hoveredSegment === item.type;
          
          cumulativePercentage += item.percentage;
          
          return (
            <circle
              key={item.type}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-300 cursor-pointer"
              onMouseEnter={() => onHover(item.type)}
              onMouseLeave={() => onHover(null)}
              style={{
                filter: isHovered ? 'brightness(1.2) drop-shadow(0 0 8px currentColor)' : 'none'
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}

// Legend Item Component
interface LegendItemProps {
  item: { type: string; points: number; percentage: number };
  color: string;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

function LegendItem({ item, color, isHovered, onHover, onLeave }: LegendItemProps) {
  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300
        ${isHovered ? 'bg-white/20 scale-105' : 'bg-white/5 hover:bg-white/10'}
      `}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div
        className="w-4 h-4 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getActivityIcon(item.type)}</span>
          <span className="font-medium text-white truncate">
            {getActivityTypeLabel(item.type)}
          </span>
        </div>
        <div className="text-sm text-white/70">
          {item.points.toLocaleString()} points ({item.percentage.toFixed(1)}%)
        </div>
      </div>
    </div>
  );
}

// Insight Card Component
interface InsightCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
}

function InsightCard({ title, value, subtitle, icon }: InsightCardProps) {
  return (
    <div className="bg-white/10 rounded-xl p-4 text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-sm text-white/70">{title}</div>
      <div className="text-xs text-white/50">{subtitle}</div>
    </div>
  );
}

// Bar Chart Alternative
export function PointsBarChart({ data, className = '' }: PointsBreakdownChartProps) {
  const chartData = Object.entries(data)
    .map(([type, points]) => ({ type, points }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  const maxPoints = Math.max(...chartData.map(item => item.points));

  return (
    <div className={className}>
      <div className="space-y-3">
        {chartData.map((item, index) => (
          <div key={item.type} className="flex items-center gap-4">
            <div className="flex items-center gap-2 min-w-[140px]">
              <span className="text-lg">{getActivityIcon(item.type)}</span>
              <span className="text-sm text-white/90 truncate">
                {getActivityTypeLabel(item.type)}
              </span>
            </div>
            <div className="flex-1 relative">
              <div className="w-full bg-white/10 rounded-full h-6 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${(item.points / maxPoints) * 100}%`,
                    backgroundColor: getActivityColor(item.type, index),
                    animationDelay: `${index * 100}ms`
                  }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-end pr-2">
                <span className="text-xs font-medium text-white">
                  {item.points.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Points Timeline Chart
export function PointsTimelineChart({ 
  activities, 
  className = '' 
}: { 
  activities: Array<{ created_at: string; points_awarded: number }>; 
  className?: string;
}) {
  const timelineData = generateTimelineData(activities);

  return (
    <div className={className}>
      <h4 className="text-lg font-semibold text-white mb-4">Points Over Time</h4>
      <div className="relative h-40 bg-white/5 rounded-lg p-4">
        <svg className="w-full h-full">
          <PointsLine data={timelineData} />
        </svg>
      </div>
      <div className="flex justify-between text-xs text-white/60 mt-2">
        <span>30 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

function PointsLine({ data }: { data: Array<{ date: string; points: number; cumulative: number }> }) {
  if (data.length < 2) return null;

  const maxPoints = Math.max(...data.map(d => d.cumulative));
  const width = 100; // percentage
  const height = 100; // percentage

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - (item.cumulative / maxPoints) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <g>
      <polyline
        points={points}
        fill="none"
        stroke="url(#gradient)"
        strokeWidth="2"
        className="animate-draw-line"
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </g>
  );
}

// Helper Functions
function getActivityColor(activityType: string, index: number): string {
  const colors = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#6366f1'  // indigo
  ];
  
  // Try to get a consistent color for each activity type
  const activityColors: Record<string, string> = {
    [ActivityType.CHAT_MESSAGE]: '#3b82f6',
    [ActivityType.FORUM_POST]: '#8b5cf6',
    [ActivityType.FORUM_REPLY]: '#ec4899',
    [ActivityType.COURSE_COMPLETED]: '#10b981',
    [ActivityType.LESSON_COMPLETED]: '#f59e0b',
    [ActivityType.QUIZ_PASSED]: '#ef4444',
    [ActivityType.REACTION_GIVEN]: '#06b6d4',
    [ActivityType.DAILY_LOGIN]: '#84cc16',
    [ActivityType.PROFILE_COMPLETED]: '#f97316',
    [ActivityType.CONTENT_SHARED]: '#6366f1'
  };

  return activityColors[activityType] || colors[index % colors.length];
}

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

function generateTimelineData(activities: Array<{ created_at: string; points_awarded: number }>) {
  const last30Days = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    last30Days.push({
      date: date.toISOString().split('T')[0],
      points: 0,
      cumulative: 0
    });
  }

  // Aggregate points by date
  activities.forEach(activity => {
    const activityDate = new Date(activity.created_at).toISOString().split('T')[0];
    const dayData = last30Days.find(day => day.date === activityDate);
    if (dayData) {
      dayData.points += activity.points_awarded;
    }
  });

  // Calculate cumulative points
  let cumulative = 0;
  last30Days.forEach(day => {
    cumulative += day.points;
    day.cumulative = cumulative;
  });

  return last30Days;
}
