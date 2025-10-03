'use client';

import React, { useState, useEffect } from 'react';
import { TierName, TIER_THRESHOLDS, TIER_COLORS, TIER_ICONS } from '@/lib/types/engagement';

interface TierConfig {
  tier_name: TierName;
  min_points: number;
  max_points: number | null;
  color: string;
  icon: string;
  description: string;
  is_active: boolean;
}

export function TierConfiguration() {
  const [tierConfigs, setTierConfigs] = useState<TierConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadTierConfigurations();
  }, []);

  const loadTierConfigurations = async () => {
    try {
      // Initialize with default tier configurations
      const tiers = Object.values(TierName);
      const defaultConfigs: TierConfig[] = tiers.map((tier, index) => {
        const nextTier = tiers[index + 1];
        return {
          tier_name: tier,
          min_points: TIER_THRESHOLDS[tier],
          max_points: nextTier ? TIER_THRESHOLDS[nextTier] - 1 : null,
          color: TIER_COLORS[tier],
          icon: TIER_ICONS[tier],
          description: getTierDescription(tier),
          is_active: true
        };
      });

      setTierConfigs(defaultConfigs);
    } catch (error) {
      console.error('Error loading tier configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTierThreshold = (tierName: TierName, newMinPoints: number) => {
    setTierConfigs(prev => {
      const updated = [...prev];
      const tierIndex = updated.findIndex(t => t.tier_name === tierName);
      
      if (tierIndex !== -1) {
        updated[tierIndex] = { ...updated[tierIndex], min_points: Math.max(0, newMinPoints) };
        
        // Update max_points for previous tier
        if (tierIndex > 0) {
          updated[tierIndex - 1] = {
            ...updated[tierIndex - 1],
            max_points: newMinPoints - 1
          };
        }
        
        // Update max_points for current tier if not the last tier
        if (tierIndex < updated.length - 1) {
          const nextTierMinPoints = updated[tierIndex + 1].min_points;
          updated[tierIndex] = {
            ...updated[tierIndex],
            max_points: nextTierMinPoints - 1
          };
        }
      }
      
      return updated;
    });
    setHasChanges(true);
  };

  const updateTierDescription = (tierName: TierName, newDescription: string) => {
    setTierConfigs(prev => 
      prev.map(config => 
        config.tier_name === tierName 
          ? { ...config, description: newDescription }
          : config
      )
    );
    setHasChanges(true);
  };

  const toggleTierActive = (tierName: TierName) => {
    setTierConfigs(prev => 
      prev.map(config => 
        config.tier_name === tierName 
          ? { ...config, is_active: !config.is_active }
          : config
      )
    );
    setHasChanges(true);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/tier-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configurations: tierConfigs })
      });

      if (response.ok) {
        setHasChanges(false);
        showNotification('Tier configurations saved successfully!', 'success');
      } else {
        throw new Error('Failed to save configurations');
      }
    } catch (error) {
      console.error('Error saving tier configurations:', error);
      showNotification('Failed to save configurations', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all tier settings to defaults? This cannot be undone.')) {
      loadTierConfigurations();
      setHasChanges(true);
    }
  };

  const validateTierThresholds = (): string[] => {
    const errors: string[] = [];
    
    for (let i = 1; i < tierConfigs.length; i++) {
      const currentTier = tierConfigs[i];
      const previousTier = tierConfigs[i - 1];
      
      if (currentTier.min_points <= previousTier.min_points) {
        errors.push(`${currentTier.tier_name} threshold must be higher than ${previousTier.tier_name}`);
      }
    }
    
    return errors;
  };

  const validationErrors = validateTierThresholds();

  if (loading) {
    return <TierConfigSkeleton />;
  }

  return (
    <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">🏆 Tier Configuration</h2>
          <p className="text-white/70">Configure tier thresholds and requirements</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              previewMode
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </button>
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
            disabled={!hasChanges || saving || validationErrors.length > 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              hasChanges && !saving && validationErrors.length === 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <h3 className="text-red-200 font-semibold mb-2">⚠️ Configuration Errors</h3>
          <ul className="text-red-200 text-sm space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tier Configuration Cards */}
      <div className="space-y-4">
        {tierConfigs.map((config, index) => (
          <TierConfigCard
            key={config.tier_name}
            config={config}
            isFirst={index === 0}
            isLast={index === tierConfigs.length - 1}
            previewMode={previewMode}
            onUpdateThreshold={updateTierThreshold}
            onUpdateDescription={updateTierDescription}
            onToggleActive={toggleTierActive}
          />
        ))}
      </div>

      {/* Tier Preview */}
      {previewMode && (
        <div className="mt-8 p-6 bg-white/5 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Tier System Preview</h3>
          <TierSystemPreview configs={tierConfigs} />
        </div>
      )}

      {/* Quick Presets */}
      <div className="mt-8 p-4 bg-white/5 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Presets</h3>
        <div className="flex flex-wrap gap-4">
          <PresetButton
            label="Conservative (High Thresholds)"
            onClick={() => applyPreset('conservative')}
            description="Harder to reach higher tiers"
          />
          <PresetButton
            label="Balanced (Default)"
            onClick={() => applyPreset('balanced')}
            description="Standard progression curve"
          />
          <PresetButton
            label="Aggressive (Low Thresholds)"
            onClick={() => applyPreset('aggressive')}
            description="Easier to reach higher tiers"
          />
        </div>
      </div>

      {/* Tier Impact Analysis */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-2">📊 Impact Analysis</h3>
        <TierImpactAnalysis configs={tierConfigs} />
      </div>
    </div>
  );

  function applyPreset(preset: 'conservative' | 'balanced' | 'aggressive') {
    if (confirm(`Apply ${preset} tier preset? This will overwrite current thresholds.`)) {
      const presets = {
        conservative: [0, 200, 800, 2500, 8000],
        balanced: [0, 101, 501, 1501, 5000],
        aggressive: [0, 50, 250, 750, 2500]
      };

      const newThresholds = presets[preset];
      setTierConfigs(prev => 
        prev.map((config, index) => ({
          ...config,
          min_points: newThresholds[index] || config.min_points
        }))
      );
      setHasChanges(true);
    }
  }
}

// Tier Configuration Card Component
interface TierConfigCardProps {
  config: TierConfig;
  isFirst: boolean;
  isLast: boolean;
  previewMode: boolean;
  onUpdateThreshold: (tierName: TierName, newMinPoints: number) => void;
  onUpdateDescription: (tierName: TierName, newDescription: string) => void;
  onToggleActive: (tierName: TierName) => void;
}

function TierConfigCard({ 
  config, 
  isFirst, 
  isLast, 
  previewMode, 
  onUpdateThreshold, 
  onUpdateDescription, 
  onToggleActive 
}: TierConfigCardProps) {
  const [thresholdInput, setThresholdInput] = useState(config.min_points.toString());
  const [descriptionInput, setDescriptionInput] = useState(config.description);

  useEffect(() => {
    setThresholdInput(config.min_points.toString());
  }, [config.min_points]);

  const handleThresholdChange = (value: string) => {
    setThresholdInput(value);
    const numValue = parseInt(value) || 0;
    if (numValue !== config.min_points) {
      onUpdateThreshold(config.tier_name, numValue);
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescriptionInput(value);
    onUpdateDescription(config.tier_name, value);
  };

  return (
    <div className={`
      p-6 rounded-xl border-2 transition-all duration-300
      ${config.is_active 
        ? 'bg-white/10 border-white/20 hover:bg-white/15' 
        : 'bg-white/5 border-white/10 opacity-60'
      }
    `}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg"
            style={{ backgroundColor: config.color + '40', border: `2px solid ${config.color}` }}
          >
            {config.icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{config.tier_name}</h3>
            <div className="text-white/70 text-sm">
              {config.min_points.toLocaleString()} - {config.max_points?.toLocaleString() || '∞'} points
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleActive(config.tier_name)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              config.is_active
                ? 'bg-green-500/20 text-green-200'
                : 'bg-red-500/20 text-red-200'
            }`}
          >
            {config.is_active ? 'Active' : 'Inactive'}
          </button>
        </div>
      </div>

      {!previewMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Threshold Configuration */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Minimum Points {isFirst && '(Cannot be changed for first tier)'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={thresholdInput}
                onChange={(e) => handleThresholdChange(e.target.value)}
                disabled={isFirst}
                className={`flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFirst ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                min="0"
              />
              {!isFirst && (
                <div className="flex gap-1">
                  <button
                    onClick={() => onUpdateThreshold(config.tier_name, config.min_points - 10)}
                    className="w-8 h-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded transition-colors"
                  >
                    -
                  </button>
                  <button
                    onClick={() => onUpdateThreshold(config.tier_name, config.min_points + 10)}
                    className="w-8 h-8 flex items-center justify-center bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded transition-colors"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description Configuration */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Description
            </label>
            <textarea
              value={descriptionInput}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              placeholder="Describe this tier's benefits..."
            />
          </div>
        </div>
      )}

      {previewMode && (
        <div className="mt-4">
          <p className="text-white/80">{config.description}</p>
          <div className="mt-3 flex items-center gap-4 text-sm text-white/60">
            <span>Range: {config.min_points.toLocaleString()} - {config.max_points?.toLocaleString() || '∞'}</span>
            <span>Status: {config.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Preset Button Component
interface PresetButtonProps {
  label: string;
  onClick: () => void;
  description: string;
}

function PresetButton({ label, onClick, description }: PresetButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-left"
    >
      <span className="font-medium text-white">{label}</span>
      <span className="text-sm text-white/70">{description}</span>
    </button>
  );
}

// Tier System Preview Component
function TierSystemPreview({ configs }: { configs: TierConfig[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {configs.filter(c => c.is_active).map((config, index) => (
        <div key={config.tier_name} className="text-center">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-2"
            style={{ backgroundColor: config.color + '40', border: `2px solid ${config.color}` }}
          >
            {config.icon}
          </div>
          <div className="text-white font-medium">{config.tier_name}</div>
          <div className="text-white/70 text-sm">
            {config.min_points.toLocaleString()}+ pts
          </div>
          {index < configs.length - 1 && (
            <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
              <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Tier Impact Analysis Component
function TierImpactAnalysis({ configs }: { configs: TierConfig[] }) {
  const totalRange = configs[configs.length - 1].min_points;
  
  return (
    <div className="space-y-3">
      <div className="text-sm text-white/80">
        Based on current thresholds, here's how the tier progression looks:
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-white/90 font-medium mb-2">Progression Difficulty:</div>
          <div className="space-y-1">
            {configs.slice(1).map((config, index) => {
              const prevConfig = configs[index];
              const gap = config.min_points - prevConfig.min_points;
              const difficulty = gap > 1000 ? 'Hard' : gap > 500 ? 'Medium' : 'Easy';
              const color = difficulty === 'Hard' ? 'text-red-300' : difficulty === 'Medium' ? 'text-yellow-300' : 'text-green-300';
              
              return (
                <div key={config.tier_name} className="flex justify-between">
                  <span className="text-white/70">{prevConfig.tier_name} → {config.tier_name}:</span>
                  <span className={color}>{difficulty} ({gap} pts)</span>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div className="text-white/90 font-medium mb-2">Recommendations:</div>
          <div className="text-white/70 space-y-1">
            <div>• Keep early tiers achievable (≤200 pts)</div>
            <div>• Make middle tiers challenging (500-1500 pts)</div>
            <div>• Set high tiers as aspirational (2000+ pts)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading Skeleton
function TierConfigSkeleton() {
  return (
    <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="w-48 h-8 bg-white/20 rounded mb-2"></div>
          <div className="w-64 h-4 bg-white/20 rounded"></div>
        </div>
        <div className="flex gap-3">
          <div className="w-24 h-10 bg-white/20 rounded"></div>
          <div className="w-32 h-10 bg-white/20 rounded"></div>
          <div className="w-24 h-10 bg-white/20 rounded"></div>
        </div>
      </div>
      
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-6 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full"></div>
              <div>
                <div className="w-24 h-6 bg-white/20 rounded mb-2"></div>
                <div className="w-32 h-4 bg-white/20 rounded"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="w-full h-20 bg-white/20 rounded"></div>
              <div className="w-full h-20 bg-white/20 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper Functions
function getTierDescription(tier: TierName): string {
  const descriptions: Record<TierName, string> = {
    [TierName.BRONZE]: 'Welcome tier for new community members',
    [TierName.SILVER]: 'Active members with consistent engagement',
    [TierName.GOLD]: 'Dedicated members with significant contributions',
    [TierName.PLATINUM]: 'VIP members with exceptional engagement',
    [TierName.DIAMOND]: 'Elite members with outstanding community impact'
  };
  return descriptions[tier] || 'Community tier';
}

function showNotification(message: string, type: 'success' | 'error') {
  // TODO: Implement notification system
  console.log(`${type.toUpperCase()}: ${message}`);
}
