'use client';

import React, { useState, useEffect } from 'react';
import { ActivityType, ACTIVITY_POINTS } from '@/lib/types/engagement';

interface PointConfig {
  activity_type: ActivityType;
  points: number;
  description: string;
  category: string;
}

export function PointConfiguration() {
  const [pointConfigs, setPointConfigs] = useState<PointConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadPointConfigurations();
  }, []);

  const loadPointConfigurations = async () => {
    try {
      // Initialize with default values
      const defaultConfigs: PointConfig[] = Object.entries(ACTIVITY_POINTS).map(([type, points]) => ({
        activity_type: type as ActivityType,
        points,
        description: getActivityDescription(type as ActivityType),
        category: getActivityCategory(type as ActivityType)
      }));

      setPointConfigs(defaultConfigs);
    } catch (error) {
      console.error('Error loading point configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePointValue = (activityType: ActivityType, newPoints: number) => {
    setPointConfigs(prev => 
      prev.map(config => 
        config.activity_type === activityType 
          ? { ...config, points: Math.max(0, newPoints) }
          : config
      )
    );
    setHasChanges(true);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/point-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configurations: pointConfigs })
      });

      if (response.ok) {
        setHasChanges(false);
        // Show success notification
        showNotification('Point configurations saved successfully!', 'success');
      } else {
        throw new Error('Failed to save configurations');
      }
    } catch (error) {
      console.error('Error saving point configurations:', error);
      showNotification('Failed to save configurations', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all point values to defaults? This cannot be undone.')) {
      loadPointConfigurations();
      setHasChanges(true);
    }
  };

  const categories = ['all', 'chat', 'forum', 'learning', 'general'];
  const filteredConfigs = selectedCategory === 'all' 
    ? pointConfigs 
    : pointConfigs.filter(config => config.category === selectedCategory);

  if (loading) {
    return <PointConfigSkeleton />;
  }

  return (
    <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">⚡ Point Configuration</h2>
          <p className="text-white/70">Configure point values for different engagement activities</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-200 rounded-full text-sm">
              Unsaved Changes
            </span>
          )}
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={saveChanges}
            disabled={!hasChanges || saving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              hasChanges && !saving
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                selectedCategory === category
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {category === 'all' ? 'All Activities' : `${category} Activities`}
            </button>
          ))}
        </div>
      </div>

      {/* Point Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredConfigs.map(config => (
          <PointConfigCard
            key={config.activity_type}
            config={config}
            onUpdate={updatePointValue}
          />
        ))}
      </div>

      {/* Bulk Actions */}
      <div className="mt-8 p-4 bg-white/5 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Bulk Actions</h3>
        <div className="flex flex-wrap gap-4">
          <BulkActionButton
            label="Increase All by 10%"
            onClick={() => applyBulkChange(1.1)}
            icon="📈"
          />
          <BulkActionButton
            label="Decrease All by 10%"
            onClick={() => applyBulkChange(0.9)}
            icon="📉"
          />
          <BulkActionButton
            label="Double Chat Points"
            onClick={() => applyCategoryChange('chat', 2)}
            icon="💬"
          />
          <BulkActionButton
            label="Boost Learning Points"
            onClick={() => applyCategoryChange('learning', 1.5)}
            icon="🎓"
          />
        </div>
      </div>

      {/* Point Value Recommendations */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-2">💡 Recommendations</h3>
        <div className="text-sm text-white/80 space-y-2">
          <p>• <strong>Chat messages:</strong> Keep low (3-10) to encourage frequent interaction</p>
          <p>• <strong>Forum posts:</strong> Medium value (10-25) for quality discussions</p>
          <p>• <strong>Course completion:</strong> High value (50-150) for significant achievements</p>
          <p>• <strong>Daily login:</strong> Low but consistent (5-10) to build habits</p>
        </div>
      </div>
    </div>
  );

  function applyBulkChange(multiplier: number) {
    if (confirm(`Apply ${multiplier > 1 ? 'increase' : 'decrease'} to all point values?`)) {
      setPointConfigs(prev => 
        prev.map(config => ({
          ...config,
          points: Math.max(1, Math.round(config.points * multiplier))
        }))
      );
      setHasChanges(true);
    }
  }

  function applyCategoryChange(category: string, multiplier: number) {
    if (confirm(`Apply changes to all ${category} activities?`)) {
      setPointConfigs(prev => 
        prev.map(config => 
          config.category === category
            ? { ...config, points: Math.max(1, Math.round(config.points * multiplier)) }
            : config
        )
      );
      setHasChanges(true);
    }
  }
}

// Point Configuration Card Component
interface PointConfigCardProps {
  config: PointConfig;
  onUpdate: (activityType: ActivityType, newPoints: number) => void;
}

function PointConfigCard({ config, onUpdate }: PointConfigCardProps) {
  const [inputValue, setInputValue] = useState(config.points.toString());

  useEffect(() => {
    setInputValue(config.points.toString());
  }, [config.points]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const numValue = parseInt(value) || 0;
    if (numValue !== config.points) {
      onUpdate(config.activity_type, numValue);
    }
  };

  const adjustPoints = (delta: number) => {
    const newValue = Math.max(0, config.points + delta);
    onUpdate(config.activity_type, newValue);
  };

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{getActivityIcon(config.activity_type)}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-white">{getActivityLabel(config.activity_type)}</h4>
          <p className="text-xs text-white/60">{config.description}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryStyle(config.category)}`}>
          {config.category}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => adjustPoints(-1)}
          className="w-8 h-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors"
        >
          -
        </button>
        <input
          type="number"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="0"
        />
        <button
          onClick={() => adjustPoints(1)}
          className="w-8 h-8 flex items-center justify-center bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded-lg transition-colors"
        >
          +
        </button>
      </div>

      <div className="mt-3 text-center">
        <span className="text-sm text-white/70">
          {config.points} point{config.points !== 1 ? 's' : ''} per activity
        </span>
      </div>
    </div>
  );
}

// Bulk Action Button Component
interface BulkActionButtonProps {
  label: string;
  onClick: () => void;
  icon: string;
}

function BulkActionButton({ label, onClick, icon }: BulkActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// Loading Skeleton
function PointConfigSkeleton() {
  return (
    <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="w-48 h-8 bg-white/20 rounded mb-2"></div>
          <div className="w-64 h-4 bg-white/20 rounded"></div>
        </div>
        <div className="flex gap-3">
          <div className="w-32 h-10 bg-white/20 rounded"></div>
          <div className="w-24 h-10 bg-white/20 rounded"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-white/20 rounded"></div>
              <div className="flex-1">
                <div className="w-24 h-4 bg-white/20 rounded mb-1"></div>
                <div className="w-32 h-3 bg-white/20 rounded"></div>
              </div>
            </div>
            <div className="w-full h-10 bg-white/20 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper Functions
function getActivityIcon(activityType: ActivityType): string {
  const icons: Record<ActivityType, string> = {
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

function getActivityLabel(activityType: ActivityType): string {
  const labels: Record<ActivityType, string> = {
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

function getActivityDescription(activityType: ActivityType): string {
  const descriptions: Record<ActivityType, string> = {
    [ActivityType.CHAT_MESSAGE]: 'Points for sending messages in chat',
    [ActivityType.FORUM_POST]: 'Points for creating new forum posts',
    [ActivityType.FORUM_REPLY]: 'Points for replying to forum posts',
    [ActivityType.COURSE_COMPLETED]: 'Points for completing entire courses',
    [ActivityType.LESSON_COMPLETED]: 'Points for completing individual lessons',
    [ActivityType.QUIZ_PASSED]: 'Points for passing quizzes',
    [ActivityType.REACTION_GIVEN]: 'Points for reacting to content',
    [ActivityType.DAILY_LOGIN]: 'Points for daily community visits',
    [ActivityType.PROFILE_COMPLETED]: 'Points for completing profile',
    [ActivityType.CONTENT_SHARED]: 'Points for sharing content'
  };
  return descriptions[activityType] || 'Points for community engagement';
}

function getActivityCategory(activityType: ActivityType): string {
  const categories: Record<ActivityType, string> = {
    [ActivityType.CHAT_MESSAGE]: 'chat',
    [ActivityType.FORUM_POST]: 'forum',
    [ActivityType.FORUM_REPLY]: 'forum',
    [ActivityType.COURSE_COMPLETED]: 'learning',
    [ActivityType.LESSON_COMPLETED]: 'learning',
    [ActivityType.QUIZ_PASSED]: 'learning',
    [ActivityType.REACTION_GIVEN]: 'general',
    [ActivityType.DAILY_LOGIN]: 'general',
    [ActivityType.PROFILE_COMPLETED]: 'general',
    [ActivityType.CONTENT_SHARED]: 'general'
  };
  return categories[activityType] || 'general';
}

function getCategoryStyle(category: string): string {
  const styles: Record<string, string> = {
    chat: 'bg-blue-500/20 text-blue-200',
    forum: 'bg-purple-500/20 text-purple-200',
    learning: 'bg-green-500/20 text-green-200',
    general: 'bg-gray-500/20 text-gray-200'
  };
  return styles[category] || 'bg-gray-500/20 text-gray-200';
}

function showNotification(message: string, type: 'success' | 'error') {
  // TODO: Implement notification system
  console.log(`${type.toUpperCase()}: ${message}`);
}
