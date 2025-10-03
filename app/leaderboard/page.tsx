'use client';

import React, { useState } from 'react';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'rewards'>('leaderboard');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Community Leaderboard</h1>
          <p className="text-gray-300">
            Track your progress and compete with other community members
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'leaderboard'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'rewards'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Rewards
          </button>
        </div>

        {/* Content */}
        <div className="bg-gray-800 rounded-lg p-6">
          {activeTab === 'leaderboard' ? (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Leaderboard</h2>
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Leaderboard temporarily disabled for deployment</p>
                <p className="text-gray-500 text-sm mt-2">
                  The leaderboard will be available once deployment issues are resolved.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Rewards</h2>
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Rewards system temporarily disabled for deployment</p>
                <p className="text-gray-500 text-sm mt-2">
                  The rewards system will be available once deployment issues are resolved.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}