'use client';

import React from 'react';
import { TierName, TIER_COLORS, TIER_ICONS, TierInfo } from '@/lib/types/engagement';
import { TierSystem } from '@/lib/tier-system';

interface TierBadgeProps {
  tier: TierName;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showIcon?: boolean;
  className?: string;
}

export function TierBadge({ 
  tier, 
  size = 'medium', 
  showLabel = true, 
  showIcon = true,
  className = '' 
}: TierBadgeProps) {
  const color = TIER_COLORS[tier];
  const icon = TIER_ICONS[tier];
  
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  };
  
  const iconSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-lg'
  };

  return (
    <div 
      className={`inline-flex items-center gap-1 rounded-full font-semibold border-2 ${sizeClasses[size]} ${className}`}
      style={{ 
        backgroundColor: `${color}20`, 
        borderColor: color,
        color: color
      }}
    >
      {showIcon && (
        <span className={iconSizes[size]}>{icon}</span>
      )}
      {showLabel && (
        <span>{tier}</span>
      )}
    </div>
  );
}

interface TierProgressProps {
  tierInfo: TierInfo;
  showDetails?: boolean;
  className?: string;
}

export function TierProgress({ tierInfo, showDetails = true, className = '' }: TierProgressProps) {
  const progressBarColor = TIER_COLORS[tierInfo.current_tier];
  
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Current Tier Badge */}
      <div className="flex items-center justify-between">
        <TierBadge tier={tierInfo.current_tier} size="large" />
        <div className="text-right">
          <div className="text-lg font-bold">{tierInfo.current_points.toLocaleString()} pts</div>
          {tierInfo.next_tier && (
            <div className="text-sm text-gray-600">
              {tierInfo.points_to_next_tier} to {tierInfo.next_tier}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {tierInfo.next_tier && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{TierSystem.getTierRequirements(tierInfo.current_tier)}</span>
            <span>{tierInfo.progress_percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="h-3 rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: `${tierInfo.progress_percentage}%`,
                backgroundColor: progressBarColor
              }}
            />
          </div>
          {tierInfo.next_tier && (
            <div className="text-sm text-gray-600 text-center">
              Next: <TierBadge tier={tierInfo.next_tier} size="small" />
            </div>
          )}
        </div>
      )}

      {/* Tier Benefits */}
      {showDetails && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">
            {TierSystem.formatTierDisplay(tierInfo.current_tier)} Benefits:
          </h4>
          <ul className="text-xs space-y-1 text-gray-600">
            {TierSystem.getTierBenefits(tierInfo.current_tier).map((benefit, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface TierComparisonProps {
  tiers?: TierName[];
  currentTier?: TierName;
  className?: string;
}

export function TierComparison({ 
  tiers = [TierName.BRONZE, TierName.SILVER, TierName.GOLD, TierName.PLATINUM, TierName.DIAMOND],
  currentTier,
  className = ''
}: TierComparisonProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold">Tier System</h3>
      <div className="grid gap-3">
        {tiers.map((tier) => {
          const isCurrentTier = currentTier === tier;
          const requirements = TierSystem.getTierRequirements(tier);
          const benefits = TierSystem.getTierBenefits(tier);
          
          return (
            <div 
              key={tier}
              className={`p-4 rounded-lg border-2 transition-all ${
                isCurrentTier 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <TierBadge tier={tier} size="medium" />
                <span className="text-sm font-medium text-gray-600">
                  {requirements}
                </span>
              </div>
              
              <div className="space-y-1">
                {benefits.slice(0, 3).map((benefit, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{benefit}</span>
                  </div>
                ))}
                {benefits.length > 3 && (
                  <div className="text-xs text-gray-500 mt-2">
                    +{benefits.length - 3} more benefits
                  </div>
                )}
              </div>
              
              {isCurrentTier && (
                <div className="mt-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                  Current Tier
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TierHistoryProps {
  history: Array<{
    id: string;
    previous_tier: string;
    new_tier: string;
    points_at_change: number;
    changed_at: string;
  }>;
  className?: string;
}

export function TierHistory({ history, className = '' }: TierHistoryProps) {
  if (history.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <div className="text-4xl mb-2">🏆</div>
        <p>No tier changes yet. Keep engaging to unlock new tiers!</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold">Tier History</h3>
      <div className="space-y-3">
        {history.map((change) => {
          const date = new Date(change.changed_at).toLocaleDateString();
          const time = new Date(change.changed_at).toLocaleTimeString();
          
          return (
            <div key={change.id} className="flex items-center gap-4 p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-2">
                <TierBadge tier={change.previous_tier as TierName} size="small" />
                <span className="text-gray-400">→</span>
                <TierBadge tier={change.new_tier as TierName} size="small" />
              </div>
              
              <div className="flex-1">
                <div className="text-sm font-medium">
                  Upgraded to {change.new_tier}
                </div>
                <div className="text-xs text-gray-500">
                  {change.points_at_change.toLocaleString()} points • {date} at {time}
                </div>
              </div>
              
              <div className="text-2xl">🎉</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
