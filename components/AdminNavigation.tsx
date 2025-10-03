'use client';

import React from 'react';

type AdminTab = 'overview' | 'points' | 'tiers' | 'rewards' | 'analytics' | 'adjustments';

interface AdminNavigationProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export function AdminNavigation({ activeTab, onTabChange }: AdminNavigationProps) {
  const navItems = [
    {
      id: 'overview' as AdminTab,
      label: 'Overview',
      icon: '📊',
      description: 'Dashboard overview'
    },
    {
      id: 'points' as AdminTab,
      label: 'Point Values',
      icon: '⚡',
      description: 'Configure activity points'
    },
    {
      id: 'tiers' as AdminTab,
      label: 'Tier Settings',
      icon: '🏆',
      description: 'Manage tier thresholds'
    },
    {
      id: 'rewards' as AdminTab,
      label: 'Rewards',
      icon: '🎁',
      description: 'Configure tier rewards'
    },
    {
      id: 'analytics' as AdminTab,
      label: 'Analytics',
      icon: '📈',
      description: 'Engagement insights'
    },
    {
      id: 'adjustments' as AdminTab,
      label: 'Manual Adjustments',
      icon: '🔧',
      description: 'Point adjustments'
    }
  ];

  return (
    <nav className="frosted-glass rounded-2xl p-4 border border-white/20 backdrop-blur-xl bg-white/10">
      <div className="space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`
              w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-300
              ${activeTab === item.id
                ? 'bg-white/20 text-white shadow-lg scale-105'
                : 'text-white/70 hover:text-white hover:bg-white/10'
              }
            `}
          >
            <span className="text-xl">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{item.label}</div>
              <div className="text-xs opacity-70 truncate">{item.description}</div>
            </div>
            {activeTab === item.id && (
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            )}
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <h4 className="text-sm font-medium text-white/80 mb-3">Quick Actions</h4>
        <div className="space-y-2">
          <button className="w-full flex items-center gap-2 p-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <span>🔄</span>
            <span>Refresh Data</span>
          </button>
          <button className="w-full flex items-center gap-2 p-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <span>📤</span>
            <span>Export Data</span>
          </button>
          <button className="w-full flex items-center gap-2 p-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <span>⚙️</span>
            <span>System Settings</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
