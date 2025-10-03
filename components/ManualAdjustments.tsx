'use client';

import React, { useState, useEffect } from 'react';

interface User {
  user_id: string;
  username: string;
  total_points: number;
  current_tier: string;
  rank: number;
}

interface AdjustmentHistory {
  id: string;
  user_id: string;
  username: string;
  points_change: number;
  reason: string;
  admin_user: string;
  created_at: string;
  previous_points: number;
  new_points: number;
}

export function ManualAdjustments() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustmentHistory, setAdjustmentHistory] = useState<AdjustmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState(false);

  // Adjustment form state
  const [pointsChange, setPointsChange] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');

  useEffect(() => {
    loadUsers();
    loadAdjustmentHistory();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?include_stats=true');
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdjustmentHistory = async () => {
    try {
      const response = await fetch('/api/admin/adjustments/history?limit=50');
      const data = await response.json();

      if (data.success) {
        setAdjustmentHistory(data.history);
      }
    } catch (error) {
      console.error('Error loading adjustment history:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setPointsChange(0);
    setAdjustmentReason('');
    setAdjustmentType('add');
  };

  const handleAdjustment = async () => {
    if (!selectedUser || !adjustmentReason.trim()) {
      alert('Please select a user and provide a reason for the adjustment.');
      return;
    }

    if (pointsChange === 0 && adjustmentType !== 'set') {
      alert('Please enter a non-zero point adjustment.');
      return;
    }

    const confirmMessage = `Are you sure you want to ${adjustmentType} ${Math.abs(pointsChange)} points ${
      adjustmentType === 'set' ? 'and set total to' : adjustmentType === 'add' ? 'to' : 'from'
    } ${selectedUser.username}?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setAdjusting(true);
    try {
      const response = await fetch('/api/admin/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.user_id,
          adjustment_type: adjustmentType,
          points_change: pointsChange,
          reason: adjustmentReason
        })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh data
        await loadUsers();
        await loadAdjustmentHistory();
        
        // Update selected user
        const updatedUser = users.find(u => u.user_id === selectedUser.user_id);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }

        // Reset form
        setPointsChange(0);
        setAdjustmentReason('');
        
        alert('Point adjustment completed successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error making adjustment:', error);
      alert('Failed to make point adjustment');
    } finally {
      setAdjusting(false);
    }
  };

  const resetLeaderboard = async () => {
    const confirmMessage = 'Are you sure you want to reset the entire leaderboard? This will set all users to 0 points and cannot be undone.';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    const doubleConfirm = prompt('Type "RESET LEADERBOARD" to confirm this action:');
    if (doubleConfirm !== 'RESET LEADERBOARD') {
      alert('Reset cancelled - confirmation text did not match.');
      return;
    }

    try {
      const response = await fetch('/api/admin/leaderboard/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Admin leaderboard reset' })
      });

      const data = await response.json();

      if (data.success) {
        await loadUsers();
        await loadAdjustmentHistory();
        setSelectedUser(null);
        alert('Leaderboard has been reset successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error resetting leaderboard:', error);
      alert('Failed to reset leaderboard');
    }
  };

  if (loading) {
    return <ManualAdjustmentsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">🔧 Manual Adjustments</h2>
            <p className="text-white/70">Make manual point adjustments and manage the leaderboard</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={resetLeaderboard}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Reset Leaderboard
            </button>
          </div>
        </div>

        {/* Warning */}
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 text-xl">⚠️</span>
            <div>
              <div className="text-yellow-200 font-medium mb-1">Use with Caution</div>
              <div className="text-yellow-200/80 text-sm">
                Manual adjustments bypass the normal engagement system and are permanently logged. 
                Only use for corrections, special events, or administrative purposes.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Selection */}
        <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
          <h3 className="text-xl font-bold text-white mb-4">👤 Select User</h3>
          
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search users by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* User List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.map(user => (
              <div
                key={user.user_id}
                onClick={() => handleUserSelect(user)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedUser?.user_id === user.user_id
                    ? 'bg-blue-500/20 border border-blue-400/30'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-white">{user.username}</div>
                      <div className="text-sm text-white/70">
                        {user.current_tier} • Rank #{user.rank}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{user.total_points.toLocaleString()}</div>
                    <div className="text-sm text-white/70">points</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-white/70">
              <div className="text-4xl mb-2">🔍</div>
              <p>No users found matching your search.</p>
            </div>
          )}
        </div>

        {/* Adjustment Form */}
        <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
          <h3 className="text-xl font-bold text-white mb-4">⚡ Make Adjustment</h3>
          
          {selectedUser ? (
            <div className="space-y-4">
              {/* Selected User Info */}
              <div className="p-4 bg-white/10 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-white">{selectedUser.username}</div>
                    <div className="text-white/70">
                      {selectedUser.current_tier} • Rank #{selectedUser.rank}
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{selectedUser.total_points.toLocaleString()}</div>
                  <div className="text-white/70">Current Points</div>
                </div>
              </div>

              {/* Adjustment Type */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Adjustment Type
                </label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="add">Add Points</option>
                  <option value="remove">Remove Points</option>
                  <option value="set">Set Total Points</option>
                </select>
              </div>

              {/* Points Input */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  {adjustmentType === 'set' ? 'New Total Points' : 'Points to ' + (adjustmentType === 'add' ? 'Add' : 'Remove')}
                </label>
                <input
                  type="number"
                  value={pointsChange}
                  onChange={(e) => setPointsChange(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={adjustmentType === 'set' ? 0 : 1}
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Reason for Adjustment *
                </label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Explain why this adjustment is being made..."
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>

              {/* Preview */}
              {pointsChange !== 0 && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="text-blue-200 font-medium mb-1">Preview:</div>
                  <div className="text-blue-200/80 text-sm">
                    {selectedUser.username} will have{' '}
                    <strong>
                      {adjustmentType === 'set' 
                        ? pointsChange.toLocaleString()
                        : adjustmentType === 'add'
                        ? (selectedUser.total_points + pointsChange).toLocaleString()
                        : Math.max(0, selectedUser.total_points - pointsChange).toLocaleString()
                      }
                    </strong>{' '}
                    points after this adjustment.
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleAdjustment}
                disabled={adjusting || !adjustmentReason.trim() || (pointsChange === 0 && adjustmentType !== 'set')}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  adjusting || !adjustmentReason.trim() || (pointsChange === 0 && adjustmentType !== 'set')
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {adjusting ? 'Processing...' : 'Apply Adjustment'}
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-white/70">
              <div className="text-4xl mb-4">👆</div>
              <p>Select a user from the list to make point adjustments.</p>
            </div>
          )}
        </div>
      </div>

      {/* Adjustment History */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <h3 className="text-xl font-bold text-white mb-4">📋 Recent Adjustments</h3>
        
        {adjustmentHistory.length > 0 ? (
          <div className="space-y-3">
            {adjustmentHistory.map(adjustment => (
              <div key={adjustment.id} className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {adjustment.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-white">{adjustment.username}</div>
                      <div className="text-sm text-white/70">
                        {new Date(adjustment.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      adjustment.points_change > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {adjustment.points_change > 0 ? '+' : ''}{adjustment.points_change.toLocaleString()}
                    </div>
                    <div className="text-sm text-white/70">
                      {adjustment.previous_points.toLocaleString()} → {adjustment.new_points.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-white/80 mb-2">{adjustment.reason}</div>
                <div className="text-xs text-white/60">By: {adjustment.admin_user}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-white/70">
            <div className="text-4xl mb-2">📝</div>
            <p>No adjustment history available.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading Skeleton
function ManualAdjustmentsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="w-48 h-8 bg-white/20 rounded mb-2"></div>
            <div className="w-64 h-4 bg-white/20 rounded"></div>
          </div>
          <div className="w-32 h-10 bg-white/20 rounded"></div>
        </div>
        <div className="p-4 bg-white/5 rounded-xl">
          <div className="w-full h-16 bg-white/20 rounded"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
          <div className="w-32 h-6 bg-white/20 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                  <div className="flex-1">
                    <div className="w-24 h-4 bg-white/20 rounded mb-1"></div>
                    <div className="w-32 h-3 bg-white/20 rounded"></div>
                  </div>
                  <div className="w-16 h-4 bg-white/20 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
          <div className="w-32 h-6 bg-white/20 rounded mb-4"></div>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-4"></div>
            <div className="w-48 h-4 bg-white/20 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
