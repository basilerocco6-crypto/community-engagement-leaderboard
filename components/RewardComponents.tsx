'use client';

import React from 'react';
import { RewardConfiguration, UserRewardUnlock, RewardType } from '@/lib/types/engagement';
import { REWARD_TEMPLATES } from '@/lib/reward-system';

interface RewardCardProps {
  reward: RewardConfiguration;
  isUnlocked?: boolean;
  isUsed?: boolean;
  unlockedAt?: string;
  usedAt?: string;
  onUse?: (rewardId: string) => void;
  className?: string;
}

export function RewardCard({ 
  reward, 
  isUnlocked = false, 
  isUsed = false,
  unlockedAt,
  usedAt,
  onUse,
  className = '' 
}: RewardCardProps) {
  const template = REWARD_TEMPLATES[reward.reward_type as RewardType];
  
  const handleUse = () => {
    if (onUse && isUnlocked && !isUsed) {
      onUse(reward.id);
    }
  };

  const getStatusColor = () => {
    if (!isUnlocked) return 'bg-gray-100 border-gray-200';
    if (isUsed) return 'bg-gray-100 border-gray-300';
    return 'bg-green-50 border-green-200';
  };

  const getStatusText = () => {
    if (!isUnlocked) return 'Locked';
    if (isUsed) return 'Used';
    return 'Available';
  };

  const getStatusIcon = () => {
    if (!isUnlocked) return '🔒';
    if (isUsed) return '✅';
    return '🎁';
  };

  return (
    <div className={`border-2 rounded-lg p-4 transition-all ${getStatusColor()} ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{template?.icon || '🎁'}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{reward.reward_title}</h3>
            <p className="text-sm text-gray-600">{reward.tier_name} Tier</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">{getStatusIcon()}</span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            !isUnlocked ? 'bg-gray-200 text-gray-700' :
            isUsed ? 'bg-gray-200 text-gray-700' :
            'bg-green-200 text-green-700'
          }`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-3">{reward.reward_description}</p>

      {reward.reward_value && (
        <div className="mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {reward.reward_type.includes('percentage') 
              ? `${reward.reward_value}% off`
              : `$${reward.reward_value} off`
            }
          </span>
        </div>
      )}

      {isUnlocked && (
        <div className="text-xs text-gray-500 mb-3">
          Unlocked: {new Date(unlockedAt!).toLocaleDateString()}
          {isUsed && usedAt && (
            <span className="block">Used: {new Date(usedAt).toLocaleDateString()}</span>
          )}
        </div>
      )}

      {isUnlocked && !isUsed && onUse && (
        <button
          onClick={handleUse}
          className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Use Reward
        </button>
      )}

      {!isUnlocked && (
        <div className="text-center py-2">
          <span className="text-sm text-gray-500">
            Reach {reward.tier_name} tier to unlock
          </span>
        </div>
      )}
    </div>
  );
}

interface RewardListProps {
  unlockedRewards: UserRewardUnlock[];
  availableRewards: RewardConfiguration[];
  onUseReward?: (rewardId: string) => void;
  showAll?: boolean;
  className?: string;
}

export function RewardList({ 
  unlockedRewards, 
  availableRewards, 
  onUseReward,
  showAll = false,
  className = '' 
}: RewardListProps) {
  const [activeTab, setActiveTab] = React.useState<'unlocked' | 'available'>('unlocked');

  const displayRewards = activeTab === 'unlocked' ? unlockedRewards : availableRewards;

  if (!showAll && unlockedRewards.length === 0 && availableRewards.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-4xl mb-4">🎁</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Rewards Yet</h3>
        <p className="text-gray-600">Keep engaging to unlock tier rewards!</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('unlocked')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'unlocked'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Rewards ({unlockedRewards.length})
        </button>
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'available'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All Available ({availableRewards.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTab === 'unlocked' ? (
          unlockedRewards.map((userReward) => (
            <RewardCard
              key={userReward.id}
              reward={userReward.reward_configuration!}
              isUnlocked={true}
              isUsed={!!userReward.used_at}
              unlockedAt={userReward.unlocked_at}
              usedAt={userReward.used_at}
              onUse={onUseReward}
            />
          ))
        ) : (
          availableRewards.map((reward) => {
            const unlockedReward = unlockedRewards.find(
              ur => ur.reward_config_id === reward.id
            );
            return (
              <RewardCard
                key={reward.id}
                reward={reward}
                isUnlocked={!!unlockedReward}
                isUsed={!!unlockedReward?.used_at}
                unlockedAt={unlockedReward?.unlocked_at}
                usedAt={unlockedReward?.used_at}
                onUse={onUseReward}
              />
            );
          })
        )}
      </div>

      {displayRewards.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500">
            {activeTab === 'unlocked' 
              ? 'No rewards unlocked yet. Keep engaging to earn rewards!'
              : 'No rewards available for this community.'
            }
          </div>
        </div>
      )}
    </div>
  );
}

interface RewardSummaryProps {
  unlockedRewards: UserRewardUnlock[];
  totalAvailable: number;
  className?: string;
}

export function RewardSummary({ unlockedRewards, totalAvailable, className = '' }: RewardSummaryProps) {
  const usedRewards = unlockedRewards.filter(r => r.used_at).length;
  const availableToUse = unlockedRewards.filter(r => !r.used_at).length;

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Reward Summary</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{unlockedRewards.length}</div>
          <div className="text-sm text-gray-600">Unlocked</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{availableToUse}</div>
          <div className="text-sm text-gray-600">Available</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{usedRewards}</div>
          <div className="text-sm text-gray-600">Used</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{totalAvailable}</div>
          <div className="text-sm text-gray-600">Total Available</div>
        </div>
      </div>

      {unlockedRewards.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{unlockedRewards.length} of {totalAvailable}</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(unlockedRewards.length / totalAvailable) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface RewardNotificationProps {
  newRewards: RewardConfiguration[];
  onClose: () => void;
}

export function RewardNotification({ newRewards, onClose }: RewardNotificationProps) {
  if (newRewards.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 bg-white border-l-4 border-green-500 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-2xl">🎉</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900">
            New Rewards Unlocked!
          </h3>
          <div className="mt-2 text-sm text-gray-600">
            {newRewards.length === 1 ? (
              <p>You've unlocked: <strong>{newRewards[0].reward_title}</strong></p>
            ) : (
              <p>You've unlocked {newRewards.length} new rewards!</p>
            )}
          </div>
          <div className="mt-3">
            <button
              onClick={onClose}
              className="text-xs bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700"
            >
              View Rewards
            </button>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
