'use client';

import React, { useState } from 'react';

export default function ProfilePage() {
  const [userData, setUserData] = useState({
    username: 'Demo User',
    totalPoints: 0,
    currentTier: 'Bronze',
    rank: 'N/A'
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">User Profile</h1>
            <p className="text-gray-300">
              View your engagement stats and achievements
            </p>
          </div>

          {/* Profile Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Points */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{userData.totalPoints.toLocaleString()}</div>
                <div className="text-purple-200">Total Points</div>
              </div>
            </div>

            {/* Current Tier */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{userData.currentTier}</div>
                <div className="text-yellow-200">Current Tier</div>
              </div>
            </div>

            {/* Rank */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">#{userData.rank}</div>
                <div className="text-blue-200">Global Rank</div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">System Status</h2>
            <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-yellow-200 font-medium">Profile temporarily limited</p>
                  <p className="text-yellow-300 text-sm mt-1">
                    Profile features are temporarily disabled during deployment. 
                    Full functionality will be restored once server issues are resolved.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Placeholder */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
            <div className="text-center py-8">
              <p className="text-gray-400">Activity tracking temporarily disabled</p>
              <p className="text-gray-500 text-sm mt-2">
                Your recent engagement activities will be visible here once the system is fully operational.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}