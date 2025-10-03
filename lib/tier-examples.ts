// Example usage of the Tier System
// This file demonstrates how to use the tier ranking system

import { TierSystem } from './tier-system';
import { TierName } from './types/engagement';

// Example 1: Calculate tier from points
export function exampleTierCalculation() {
  console.log('Tier Calculation Examples:');
  
  const pointExamples = [0, 50, 150, 750, 2000, 6000];
  
  pointExamples.forEach(points => {
    const tier = TierSystem.calculateTier(points);
    const progress = TierSystem.calculateTierProgress(points);
    
    console.log(`${points} points → ${tier}`);
    console.log(`  Progress: ${progress.progress_percentage}%`);
    console.log(`  Next tier: ${progress.next_tier || 'Max tier reached'}`);
    console.log(`  Points to next: ${progress.points_to_next_tier || 'N/A'}`);
    console.log('---');
  });
}

// Example 2: Get user tier information
export async function exampleGetUserTier(userId: string) {
  const tierInfo = await TierSystem.getUserTierInfo(userId);
  
  if (tierInfo) {
    console.log('User Tier Information:');
    console.log(`Current Tier: ${TierSystem.formatTierDisplay(tierInfo.current_tier)}`);
    console.log(`Points: ${tierInfo.current_points}`);
    console.log(`Progress: ${tierInfo.progress_percentage}%`);
    
    if (tierInfo.next_tier) {
      console.log(`Next Tier: ${tierInfo.next_tier} (${tierInfo.points_to_next_tier} points away)`);
    }
    
    console.log(`Benefits: ${TierSystem.getTierBenefits(tierInfo.current_tier).join(', ')}`);
  }
}

// Example 3: Track tier changes
export async function exampleTierHistory(userId: string) {
  const { history, totalCount } = await TierSystem.getTierHistory(userId, 10, 0);
  
  console.log(`Tier History (${totalCount} total changes):`);
  history.forEach(change => {
    console.log(`${change.previous_tier} → ${change.new_tier} at ${change.points_at_change} points`);
    console.log(`  Date: ${new Date(change.changed_at).toLocaleDateString()}`);
  });
}

// Example 4: Get tier distribution
export async function exampleTierDistribution() {
  const distribution = await TierSystem.getTierDistribution();
  
  console.log('Community Tier Distribution:');
  Object.entries(distribution).forEach(([tier, count]) => {
    const percentage = count > 0 ? ((count / Object.values(distribution).reduce((a, b) => a + b, 0)) * 100).toFixed(1) : '0';
    console.log(`${TierSystem.formatTierDisplay(tier as TierName)}: ${count} users (${percentage}%)`);
  });
}

// Example 5: Check tier upgrade scenarios
export async function exampleTierUpgradeScenarios() {
  console.log('Tier Upgrade Scenarios:');
  
  const scenarios = [
    { from: 95, to: 105, description: 'Bronze to Silver upgrade' },
    { from: 450, to: 520, description: 'Silver to Gold upgrade' },
    { from: 1400, to: 1600, description: 'Gold to Platinum upgrade' },
    { from: 4800, to: 5200, description: 'Platinum to Diamond upgrade' }
  ];
  
  scenarios.forEach(scenario => {
    const fromTier = TierSystem.calculateTier(scenario.from);
    const toTier = TierSystem.calculateTier(scenario.to);
    const shouldNotify = TierSystem.shouldNotifyTierUpgrade(fromTier, toTier);
    
    console.log(`${scenario.description}:`);
    console.log(`  ${scenario.from} pts (${fromTier}) → ${scenario.to} pts (${toTier})`);
    console.log(`  Should notify: ${shouldNotify}`);
    console.log('---');
  });
}

// Example 6: API usage patterns
export const tierApiExamples = {
  // GET /api/engagement/tier
  getCurrentTier: {
    description: 'Get current user tier with optional history',
    params: {
      includeHistory: true,
      historyLimit: 5
    }
  },
  
  // GET /api/engagement/tier/history
  getTierHistory: {
    description: 'Get paginated tier change history',
    params: {
      limit: 20,
      offset: 0
    }
  },
  
  // GET /api/engagement/tier/distribution
  getTierDistribution: {
    description: 'Get overall tier distribution statistics'
  },
  
  // GET /api/engagement/tier/distribution?tier=Gold
  getUsersByTier: {
    description: 'Get users in a specific tier',
    params: {
      tier: 'Gold',
      limit: 50,
      offset: 0
    }
  }
};

// Example 7: Tier progression simulation
export function exampleTierProgression() {
  console.log('Tier Progression Simulation:');
  
  let points = 0;
  const activities = [
    { type: 'chat_message', points: 5, count: 20 },
    { type: 'forum_post', points: 15, count: 5 },
    { type: 'course_completion', points: 100, count: 1 },
    { type: 'daily_login', points: 5, count: 30 }
  ];
  
  let currentTier = TierSystem.calculateTier(points);
  console.log(`Starting: ${points} points, ${currentTier} tier`);
  
  activities.forEach(activity => {
    const activityPoints = activity.points * activity.count;
    points += activityPoints;
    const newTier = TierSystem.calculateTier(points);
    
    console.log(`After ${activity.count}x ${activity.type}: ${points} points`);
    
    if (newTier !== currentTier) {
      console.log(`  🎉 TIER UP! ${currentTier} → ${newTier}`);
      currentTier = newTier;
    }
    
    const progress = TierSystem.calculateTierProgress(points);
    if (progress.next_tier) {
      console.log(`  Progress to ${progress.next_tier}: ${progress.progress_percentage}%`);
    }
  });
}

// Example 8: Tier benefits comparison
export function exampleTierBenefits() {
  console.log('Tier Benefits Comparison:');
  
  const allTiers = [TierName.BRONZE, TierName.SILVER, TierName.GOLD, TierName.PLATINUM, TierName.DIAMOND];
  
  allTiers.forEach(tier => {
    const requirements = TierSystem.getTierRequirements(tier);
    const benefits = TierSystem.getTierBenefits(tier);
    
    console.log(`${TierSystem.formatTierDisplay(tier)} (${requirements}):`);
    benefits.forEach(benefit => {
      console.log(`  • ${benefit}`);
    });
    console.log('---');
  });
}

// Example 9: Real-time tier checking
export async function exampleRealTimeTierCheck(userId: string, newActivityPoints: number) {
  console.log('Real-time Tier Check Example:');
  
  // Get current tier info
  const currentTierInfo = await TierSystem.getUserTierInfo(userId);
  if (!currentTierInfo) {
    console.log('User not found');
    return;
  }
  
  console.log(`Current: ${currentTierInfo.current_tier} with ${currentTierInfo.current_points} points`);
  
  // Simulate adding new points
  const newTotalPoints = currentTierInfo.current_points + newActivityPoints;
  const newTierInfo = TierSystem.calculateTierProgress(newTotalPoints);
  
  console.log(`After +${newActivityPoints} points: ${newTierInfo.current_tier} with ${newTotalPoints} points`);
  
  if (currentTierInfo.current_tier !== newTierInfo.current_tier) {
    console.log(`🎉 TIER UPGRADE! ${currentTierInfo.current_tier} → ${newTierInfo.current_tier}`);
    
    // Check if we should send notification
    const shouldNotify = TierSystem.shouldNotifyTierUpgrade(
      currentTierInfo.current_tier, 
      newTierInfo.current_tier
    );
    console.log(`Should send notification: ${shouldNotify}`);
    
    // Get new benefits
    const newBenefits = TierSystem.getTierBenefits(newTierInfo.current_tier);
    console.log('New benefits unlocked:');
    newBenefits.forEach(benefit => console.log(`  • ${benefit}`));
  }
}

// Example 10: Component usage examples
export const componentExamples = {
  tierBadge: `
    // Basic tier badge
    <TierBadge tier={TierName.GOLD} />
    
    // Small badge without label
    <TierBadge tier={TierName.SILVER} size="small" showLabel={false} />
    
    // Large badge with custom styling
    <TierBadge tier={TierName.DIAMOND} size="large" className="shadow-lg" />
  `,
  
  tierProgress: `
    // Full tier progress display
    <TierProgress tierInfo={tierInfo} showDetails={true} />
    
    // Compact progress bar only
    <TierProgress tierInfo={tierInfo} showDetails={false} />
  `,
  
  tierComparison: `
    // All tiers comparison
    <TierComparison currentTier={TierName.GOLD} />
    
    // Specific tiers only
    <TierComparison 
      tiers={[TierName.SILVER, TierName.GOLD, TierName.PLATINUM]} 
      currentTier={TierName.GOLD} 
    />
  `,
  
  tierHistory: `
    // User's tier change history
    <TierHistory history={tierHistory} />
  `
};
