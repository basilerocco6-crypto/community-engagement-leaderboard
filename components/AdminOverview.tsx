'use client';

import React, { useState, useEffect } from 'react';

interface OverviewStats {
  totalUsers: number;
  activeUsers: number;
  totalPoints: number;
  totalActivities: number;
  averagePointsPerUser: number;
  topTier: string;
  recentActivity: Array<{
    user_id: string;
    username: string;
    activity_type: string;
    points_awarded: number;
    created_at: string;
  }>;
  systemHealth: {
    status: 'healthy' | 'warning' | 'error';
    uptime: string;
    lastSync: string;
    issues: string[];
  };
}

export function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewStats();
  }, []);

  const loadOverviewStats = async () => {
    try {
      const response = await fetch('/api/admin/overview');
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading overview stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <OverviewSkeleton />;
  }

  if (!stats) {
    return (
      <div className="frosted-glass rounded-2xl p-8 border border-white/20 backdrop-blur-xl bg-white/10 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-white mb-2">Unable to Load Overview</h3>
        <p className="text-white/70">Failed to fetch dashboard statistics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to Admin Dashboard</h2>
            <p className="text-white/70">Here's an overview of your community engagement system</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/70">Last updated</div>
            <div className="text-white font-medium">{new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          subtitle={`${stats.activeUsers} active`}
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Total Points"
          value={stats.totalPoints.toLocaleString()}
          subtitle="awarded"
          icon="⚡"
          color="purple"
        />
        <MetricCard
          title="Activities"
          value={stats.totalActivities.toLocaleString()}
          subtitle="total actions"
          icon="📊"
          color="green"
        />
        <MetricCard
          title="Avg Points/User"
          value={Math.round(stats.averagePointsPerUser).toLocaleString()}
          subtitle="per member"
          icon="📈"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
          <h3 className="text-xl font-bold text-white mb-4">🔧 System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/80">Status</span>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                stats.systemHealth.status === 'healthy' ? 'bg-green-500/20 text-green-200' :
                stats.systemHealth.status === 'warning' ? 'bg-yellow-500/20 text-yellow-200' :
                'bg-red-500/20 text-red-200'
              }`}>
                {stats.systemHealth.status === 'healthy' ? '✅ Healthy' :
                 stats.systemHealth.status === 'warning' ? '⚠️ Warning' :
                 '❌ Error'}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/80">Uptime</span>
              <span className="text-white">{stats.systemHealth.uptime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/80">Last Sync</span>
              <span className="text-white">{stats.systemHealth.lastSync}</span>
            </div>
            {stats.systemHealth.issues.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="text-yellow-200 font-medium mb-2">Issues Detected:</div>
                <ul className="text-yellow-200/80 text-sm space-y-1">
                  {stats.systemHealth.issues.map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
          <h3 className="text-xl font-bold text-white mb-4">🕒 Recent Activity</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {activity.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{activity.username}</div>
                  <div className="text-white/70 text-sm truncate">
                    {getActivityLabel(activity.activity_type)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-medium">+{activity.points_awarded}</div>
                  <div className="text-white/60 text-xs">
                    {new Date(activity.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <h3 className="text-xl font-bold text-white mb-4">⚡ Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton
            title="View Analytics"
            description="Detailed engagement insights"
            icon="📈"
            onClick={() => window.location.hash = '#analytics'}
          />
          <QuickActionButton
            title="Adjust Points"
            description="Manual point modifications"
            icon="🔧"
            onClick={() => window.location.hash = '#adjustments'}
          />
          <QuickActionButton
            title="Configure Tiers"
            description="Manage tier thresholds"
            icon="🏆"
            onClick={() => window.location.hash = '#tiers'}
          />
          <QuickActionButton
            title="Export Data"
            description="Download engagement data"
            icon="📤"
            onClick={() => exportAllData()}
          />
        </div>
      </div>

      {/* System Information */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <h3 className="text-xl font-bold text-white mb-4">ℹ️ System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold text-white mb-2">Database</h4>
            <div className="text-white/70 text-sm space-y-1">
              <div>• Supabase PostgreSQL</div>
              <div>• Real-time subscriptions enabled</div>
              <div>• Row Level Security active</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Features</h4>
            <div className="text-white/70 text-sm space-y-1">
              <div>• Automatic tier upgrades</div>
              <div>• Reward unlocking system</div>
              <div>• Activity tracking</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Security</h4>
            <div className="text-white/70 text-sm space-y-1">
              <div>• Admin access control</div>
              <div>• Audit logging enabled</div>
              <div>• Data encryption at rest</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  async function exportAllData() {
    try {
      const response = await fetch('/api/admin/export/all');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `community-data-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  }
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: 'blue' | 'purple' | 'green' | 'orange';
}

function MetricCard({ title, value, subtitle, icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-white/70 text-sm">{title}</div>
        </div>
      </div>
      <div className="text-white/60 text-xs">{subtitle}</div>
    </div>
  );
}

// Quick Action Button Component
interface QuickActionButtonProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

function QuickActionButton({ title, description, icon, onClick }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-left group"
    >
      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{icon}</div>
      <div className="font-medium text-white mb-1">{title}</div>
      <div className="text-white/70 text-sm">{description}</div>
    </button>
  );
}

// Loading Skeleton
function OverviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="w-64 h-8 bg-white/20 rounded mb-2"></div>
            <div className="w-80 h-4 bg-white/20 rounded"></div>
          </div>
          <div className="w-24 h-12 bg-white/20 rounded"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/10 rounded-xl p-4">
            <div className="w-8 h-8 bg-white/20 rounded mb-3"></div>
            <div className="w-16 h-6 bg-white/20 rounded mb-1"></div>
            <div className="w-12 h-4 bg-white/20 rounded"></div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
          <div className="w-32 h-6 bg-white/20 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-full h-12 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
        <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
          <div className="w-32 h-6 bg-white/20 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-full h-16 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Functions
function getActivityLabel(activityType: string): string {
  const labels: Record<string, string> = {
    'CHAT_MESSAGE': 'Sent a chat message',
    'FORUM_POST': 'Created a forum post',
    'FORUM_REPLY': 'Replied to a forum post',
    'COURSE_COMPLETED': 'Completed a course',
    'LESSON_COMPLETED': 'Completed a lesson',
    'QUIZ_PASSED': 'Passed a quiz',
    'REACTION_GIVEN': 'Gave a reaction',
    'DAILY_LOGIN': 'Daily login',
    'PROFILE_COMPLETED': 'Updated profile',
    'CONTENT_SHARED': 'Shared content'
  };
  return labels[activityType] || 'Unknown activity';
}
