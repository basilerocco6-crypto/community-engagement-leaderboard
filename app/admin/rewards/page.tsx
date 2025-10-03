'use client';

import React, { useState, useEffect } from 'react';
import { 
  RewardConfiguration, 
  RewardType, 
  TierName, 
  CreateRewardConfigRequest,
  RewardTemplate 
} from '@/lib/types/engagement';
import { REWARD_TEMPLATES } from '@/lib/reward-system';

interface RewardStatistics {
  totalConfigurations: number;
  activeConfigurations: number;
  totalUnlocks: number;
  rewardsByTier: Record<string, number>;
  rewardsByType: Record<string, number>;
}

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<RewardConfiguration[]>([]);
  const [statistics, setStatistics] = useState<RewardStatistics | null>(null);
  const [templates, setTemplates] = useState<RewardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardConfiguration | null>(null);

  const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
  const communityId = 'default'; // This would come from context/props in a real app

  useEffect(() => {
    fetchRewards();
    fetchStatistics();
    fetchTemplates();
  }, [selectedTier]);

  const fetchRewards = async () => {
    try {
      const params = new URLSearchParams({
        community_id: communityId,
        ...(selectedTier !== 'all' && { tier_name: selectedTier })
      });

      const response = await fetch(`/api/admin/rewards?${params}`);
      const data = await response.json();

      if (data.success) {
        setRewards(data.reward_configurations);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`/api/admin/rewards/statistics?community_id=${communityId}`);
      const data = await response.json();

      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/rewards/templates');
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleCreateReward = async (rewardData: CreateRewardConfigRequest) => {
    try {
      const response = await fetch('/api/admin/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rewardData)
      });

      const data = await response.json();

      if (data.success) {
        setRewards([...rewards, data.reward_configuration]);
        setShowCreateModal(false);
        fetchStatistics(); // Refresh statistics
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating reward:', error);
      alert('Failed to create reward');
    }
  };

  const handleUpdateReward = async (id: string, updateData: any) => {
    try {
      const response = await fetch(`/api/admin/rewards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        setRewards(rewards.map(r => r.id === id ? data.reward_configuration : r));
        setEditingReward(null);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating reward:', error);
      alert('Failed to update reward');
    }
  };

  const handleDeleteReward = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return;

    try {
      const response = await fetch(`/api/admin/rewards/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setRewards(rewards.filter(r => r.id !== id));
        fetchStatistics(); // Refresh statistics
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting reward:', error);
      alert('Failed to delete reward');
    }
  };

  const toggleRewardActive = async (reward: RewardConfiguration) => {
    await handleUpdateReward(reward.id, { is_active: !reward.is_active });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading rewards...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reward Management</h1>
        <p className="text-gray-600">Configure tier rewards and track usage statistics</p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Rewards</h3>
            <p className="text-2xl font-bold text-blue-600">{statistics.totalConfigurations}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Active Rewards</h3>
            <p className="text-2xl font-bold text-green-600">{statistics.activeConfigurations}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Unlocks</h3>
            <p className="text-2xl font-bold text-purple-600">{statistics.totalUnlocks}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Reward Types</h3>
            <p className="text-2xl font-bold text-orange-600">
              {Object.keys(statistics.rewardsByType).length}
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Tier
          </label>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tiers</option>
            {tiers.map(tier => (
              <option key={tier} value={tier}>{tier}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add New Reward
          </button>
        </div>
      </div>

      {/* Rewards Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reward
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rewards.map((reward) => {
                const template = REWARD_TEMPLATES[reward.reward_type as RewardType];
                return (
                  <tr key={reward.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{template?.icon}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {reward.reward_title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {reward.reward_description.length > 50 
                              ? `${reward.reward_description.substring(0, 50)}...`
                              : reward.reward_description
                            }
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {reward.tier_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reward.reward_type.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reward.reward_value ? (
                        reward.reward_type.includes('percentage') 
                          ? `${reward.reward_value}%`
                          : `$${reward.reward_value}`
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleRewardActive(reward)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          reward.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {reward.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setEditingReward(reward)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteReward(reward.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rewards.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No rewards found</div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Your First Reward
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingReward) && (
        <RewardModal
          reward={editingReward}
          templates={templates}
          tiers={tiers}
          communityId={communityId}
          onSave={editingReward ? 
            (data) => handleUpdateReward(editingReward.id, data) : 
            handleCreateReward
          }
          onClose={() => {
            setShowCreateModal(false);
            setEditingReward(null);
          }}
        />
      )}
    </div>
  );
}

// Modal Component for Creating/Editing Rewards
interface RewardModalProps {
  reward?: RewardConfiguration | null;
  templates: RewardTemplate[];
  tiers: string[];
  communityId: string;
  onSave: (data: any) => void;
  onClose: () => void;
}

function RewardModal({ reward, templates, tiers, communityId, onSave, onClose }: RewardModalProps) {
  const [formData, setFormData] = useState({
    tier_name: reward?.tier_name || 'Bronze',
    reward_type: reward?.reward_type || RewardType.DISCOUNT_PERCENTAGE,
    reward_title: reward?.reward_title || '',
    reward_description: reward?.reward_description || '',
    reward_value: reward?.reward_value || 0,
    is_active: reward?.is_active !== undefined ? reward.is_active : true
  });

  const selectedTemplate = templates.find(t => t.reward_type === formData.reward_type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = reward ? formData : {
      ...formData,
      community_id: communityId
    };

    onSave(submitData);
  };

  const handleTemplateChange = (rewardType: RewardType) => {
    const template = templates.find(t => t.reward_type === rewardType);
    if (template) {
      setFormData({
        ...formData,
        reward_type: rewardType,
        reward_title: template.default_title,
        reward_description: template.default_description
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {reward ? 'Edit Reward' : 'Create New Reward'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tier
                </label>
                <select
                  value={formData.tier_name}
                  onChange={(e) => setFormData({ ...formData, tier_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {tiers.map(tier => (
                    <option key={tier} value={tier}>{tier}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reward Type
                </label>
                <select
                  value={formData.reward_type}
                  onChange={(e) => handleTemplateChange(e.target.value as RewardType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {templates.map(template => (
                    <option key={template.reward_type} value={template.reward_type}>
                      {template.icon} {template.default_title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reward Title
              </label>
              <input
                type="text"
                value={formData.reward_title}
                onChange={(e) => setFormData({ ...formData, reward_title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.reward_description}
                onChange={(e) => setFormData({ ...formData, reward_description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {selectedTemplate?.requires_value && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedTemplate.value_label}
                </label>
                <input
                  type="number"
                  value={formData.reward_value}
                  onChange={(e) => setFormData({ ...formData, reward_value: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step={selectedTemplate.value_type === 'percentage' ? '1' : '0.01'}
                  max={selectedTemplate.value_type === 'percentage' ? '100' : undefined}
                  required
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Active (users can unlock this reward)
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {reward ? 'Update' : 'Create'} Reward
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
