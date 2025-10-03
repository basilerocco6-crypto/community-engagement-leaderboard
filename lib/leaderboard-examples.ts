// Example usage of the Leaderboard System
// This file demonstrates how to use the leaderboard components and features

import { LeaderboardEntry, TierInfo, UserEngagement } from './types/engagement';

// Example 1: Basic leaderboard data structure
export const exampleLeaderboardData: LeaderboardEntry[] = [
  {
    user_id: 'user1',
    username: 'CodeMaster',
    total_points: 2850,
    current_tier: 'Diamond',
    rank: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    user_id: 'user2',
    username: 'TechGuru',
    total_points: 2100,
    current_tier: 'Platinum',
    rank: 2,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-15T09:45:00Z'
  },
  {
    user_id: 'user3',
    username: 'DevNinja',
    total_points: 1750,
    current_tier: 'Platinum',
    rank: 3,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-15T08:20:00Z'
  },
  {
    user_id: 'user4',
    username: 'CommunityChamp',
    total_points: 1200,
    current_tier: 'Gold',
    rank: 4,
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-15T07:15:00Z'
  },
  {
    user_id: 'user5',
    username: 'EngagementPro',
    total_points: 950,
    current_tier: 'Gold',
    rank: 5,
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-15T06:30:00Z'
  }
];

// Example 2: User stats data structure
export const exampleUserStats = {
  engagement: {
    id: 'eng1',
    user_id: 'current_user',
    username: 'YourUsername',
    total_points: 750,
    current_tier: 'Gold',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-15T12:00:00Z'
  } as UserEngagement,
  tierInfo: {
    current_tier: 'Gold' as any,
    current_points: 750,
    tier_min_points: 501,
    tier_max_points: 1500,
    next_tier: 'Platinum' as any,
    next_tier_min_points: 1501,
    points_to_next_tier: 751,
    progress_percentage: 24.9,
    tier_color: '#FFD700',
    tier_icon: '🥇'
  } as TierInfo,
  rank: 8
};

// Example 3: Component usage patterns
export const componentUsageExamples = {
  basicLeaderboard: `
    // Basic leaderboard component
    <Leaderboard
      initialData={leaderboardData}
      currentUserId="current_user_id"
    />
  `,

  mobileLeaderboard: `
    // Mobile-optimized leaderboard
    <MobileLeaderboard
      leaderboard={leaderboardData}
      userStats={userStats}
      currentUserId="current_user_id"
    />
  `,

  leaderboardWidget: `
    // Compact widget for dashboard
    <LeaderboardWidget
      leaderboard={leaderboardData}
      currentUserId="current_user_id"
      className="max-w-sm"
    />
  `,

  animatedLeaderboard: `
    // Leaderboard with rank change animations
    <AnimatedLeaderboard
      entries={leaderboardData}
      currentUserId="current_user_id"
      onRankChange={(userId, oldRank, newRank) => {
        console.log(\`\${userId} moved from #\${oldRank} to #\${newRank}\`);
      }}
    />
  `,

  rankChangeNotification: `
    // Show rank change notifications
    <RankChangeNotification
      userId="user123"
      username="CodeMaster"
      oldRank={5}
      newRank={3}
      onClose={() => setShowNotification(false)}
    />
  `,

  fullLeaderboardPage: `
    // Complete leaderboard page
    // Available at /leaderboard
    <LeaderboardPage />
  `
};

// Example 4: API integration patterns
export const apiIntegrationExamples = {
  fetchLeaderboard: `
    // Fetch leaderboard data
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/engagement/leaderboard?limit=10&includeUserPosition=true');
        const data = await response.json();
        
        if (data.success) {
          setLeaderboard(data.leaderboard);
          setUserPosition(data.userPosition);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    };
  `,

  fetchUserStats: `
    // Fetch current user's stats
    const fetchUserStats = async () => {
      try {
        const [engagementResponse, tierResponse] = await Promise.all([
          fetch('/api/engagement/activity'),
          fetch('/api/engagement/tier')
        ]);

        const [engagementData, tierData] = await Promise.all([
          engagementResponse.json(),
          tierResponse.json()
        ]);

        if (engagementData.success && tierData.success) {
          setUserStats({
            engagement: engagementData.user_engagement,
            tierInfo: tierData.tier_info,
            rank: engagementData.rank
          });
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };
  `,

  realTimeUpdates: `
    // Set up real-time updates
    useEffect(() => {
      const interval = setInterval(() => {
        fetchLeaderboard();
        fetchUserStats();
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }, []);
  `
};

// Example 5: Animation and interaction examples
export const animationExamples = {
  rankChangeDetection: `
    // Detect and animate rank changes
    const handleRankChange = (userId: string, oldRank: number, newRank: number) => {
      const isImprovement = newRank < oldRank;
      
      // Show notification
      setNotifications(prev => [...prev, {
        id: Date.now(),
        userId,
        oldRank,
        newRank,
        isImprovement
      }]);
      
      // Play sound effect (optional)
      if (isImprovement) {
        playRankUpSound();
      }
      
      // Analytics tracking
      trackEvent('rank_change', {
        userId,
        oldRank,
        newRank,
        improvement: isImprovement
      });
    };
  `,

  pointsAnimation: `
    // Animate points increase
    const animatePointsIncrease = (points: number, element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const animation = document.createElement('div');
      
      animation.className = 'animate-points-float';
      animation.textContent = \`+\${points}\`;
      animation.style.position = 'fixed';
      animation.style.left = \`\${rect.left + rect.width / 2}px\`;
      animation.style.top = \`\${rect.top}px\`;
      animation.style.zIndex = '9999';
      
      document.body.appendChild(animation);
      
      setTimeout(() => {
        document.body.removeChild(animation);
      }, 2000);
    };
  `,

  tierUpgradeAnimation: `
    // Animate tier upgrades
    const animateTierUpgrade = (tierBadgeElement: HTMLElement) => {
      tierBadgeElement.classList.add('animate-tier-upgrade');
      
      // Add sparkle effects
      createSparkleEffect(tierBadgeElement);
      
      setTimeout(() => {
        tierBadgeElement.classList.remove('animate-tier-upgrade');
      }, 1000);
    };
  `
};

// Example 6: Responsive design patterns
export const responsiveExamples = {
  breakpointUsage: `
    // Responsive leaderboard layout
    <div className="container mx-auto px-4">
      {/* Desktop/Tablet View */}
      <div className="hidden lg:block">
        <Leaderboard
          initialData={leaderboardData}
          currentUserId={currentUserId}
        />
      </div>
      
      {/* Mobile View */}
      <div className="lg:hidden">
        <MobileLeaderboard
          leaderboard={leaderboardData}
          userStats={userStats}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  `,

  adaptiveComponents: `
    // Components that adapt to screen size
    const useResponsiveLeaderboard = () => {
      const [isMobile, setIsMobile] = useState(false);
      
      useEffect(() => {
        const checkMobile = () => {
          setIsMobile(window.innerWidth < 1024);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
      }, []);
      
      return isMobile;
    };
  `
};

// Example 7: Accessibility features
export const accessibilityExamples = {
  keyboardNavigation: `
    // Keyboard navigation support
    const handleKeyDown = (event: KeyboardEvent, index: number) => {
      switch (event.key) {
        case 'ArrowDown':
          focusNextItem(index);
          break;
        case 'ArrowUp':
          focusPreviousItem(index);
          break;
        case 'Enter':
        case ' ':
          selectUser(index);
          break;
      }
    };
  `,

  screenReaderSupport: `
    // Screen reader announcements
    <div
      role="region"
      aria-label="Community Leaderboard"
      aria-live="polite"
      aria-atomic="true"
    >
      <h2 id="leaderboard-title">Top Community Members</h2>
      <div role="list" aria-labelledby="leaderboard-title">
        {leaderboard.map((entry, index) => (
          <div
            key={entry.user_id}
            role="listitem"
            aria-label={\`\${entry.username}, rank \${index + 1}, \${entry.total_points} points, \${entry.current_tier} tier\`}
          >
            {/* Leaderboard row content */}
          </div>
        ))}
      </div>
    </div>
  `,

  reducedMotion: `
    // Respect user's motion preferences
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    
    <div className={\`
      leaderboard-row
      \${!prefersReducedMotion ? 'animate-fadeInUp' : ''}
    \`}>
      {/* Row content */}
    </div>
  `
};

// Example 8: Performance optimization
export const performanceExamples = {
  virtualization: `
    // Virtualize large leaderboards
    import { FixedSizeList as List } from 'react-window';
    
    const VirtualizedLeaderboard = ({ entries }: { entries: LeaderboardEntry[] }) => (
      <List
        height={600}
        itemCount={entries.length}
        itemSize={80}
        itemData={entries}
      >
        {({ index, style, data }) => (
          <div style={style}>
            <LeaderboardRow entry={data[index]} position={index + 1} />
          </div>
        )}
      </List>
    );
  `,

  memoization: `
    // Memoize expensive calculations
    const MemoizedLeaderboardRow = React.memo(LeaderboardRow, (prevProps, nextProps) => {
      return (
        prevProps.entry.user_id === nextProps.entry.user_id &&
        prevProps.entry.total_points === nextProps.entry.total_points &&
        prevProps.position === nextProps.position &&
        prevProps.isCurrentUser === nextProps.isCurrentUser
      );
    });
  `,

  lazyLoading: `
    // Lazy load leaderboard data
    const usePaginatedLeaderboard = (limit = 50) => {
      const [data, setData] = useState<LeaderboardEntry[]>([]);
      const [loading, setLoading] = useState(false);
      const [hasMore, setHasMore] = useState(true);
      
      const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;
        
        setLoading(true);
        try {
          const response = await fetch(\`/api/engagement/leaderboard?limit=\${limit}&offset=\${data.length}\`);
          const result = await response.json();
          
          if (result.success) {
            setData(prev => [...prev, ...result.leaderboard]);
            setHasMore(result.leaderboard.length === limit);
          }
        } catch (error) {
          console.error('Error loading more leaderboard data:', error);
        } finally {
          setLoading(false);
        }
      }, [data.length, limit, loading, hasMore]);
      
      return { data, loading, hasMore, loadMore };
    };
  `
};

// Example 9: Testing utilities
export const testingExamples = {
  mockData: `
    // Mock data for testing
    export const createMockLeaderboardEntry = (overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry => ({
      user_id: 'test-user-1',
      username: 'TestUser',
      total_points: 1000,
      current_tier: 'Gold',
      rank: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T12:00:00Z',
      ...overrides
    });
    
    export const createMockLeaderboard = (count: number): LeaderboardEntry[] => {
      return Array.from({ length: count }, (_, index) => 
        createMockLeaderboardEntry({
          user_id: \`test-user-\${index + 1}\`,
          username: \`TestUser\${index + 1}\`,
          total_points: 2000 - (index * 100),
          rank: index + 1
        })
      );
    };
  `,

  componentTesting: `
    // Component testing examples
    import { render, screen, fireEvent } from '@testing-library/react';
    import { Leaderboard } from '../Leaderboard';
    
    describe('Leaderboard', () => {
      const mockData = createMockLeaderboard(5);
      
      it('renders leaderboard entries', () => {
        render(<Leaderboard initialData={mockData} />);
        
        expect(screen.getByText('TestUser1')).toBeInTheDocument();
        expect(screen.getByText('2000')).toBeInTheDocument();
      });
      
      it('highlights current user', () => {
        render(
          <Leaderboard 
            initialData={mockData} 
            currentUserId="test-user-3" 
          />
        );
        
        const currentUserRow = screen.getByText('TestUser3').closest('div');
        expect(currentUserRow).toHaveClass('current-user-row');
      });
    });
  `
};

// Example 10: Integration with other systems
export const integrationExamples = {
  webhookIntegration: `
    // Webhook for real-time updates
    const setupWebhookListener = () => {
      const eventSource = new EventSource('/api/engagement/stream');
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'rank_change':
            handleRankChange(data.userId, data.oldRank, data.newRank);
            break;
          case 'points_update':
            updateUserPoints(data.userId, data.newPoints);
            break;
          case 'tier_upgrade':
            handleTierUpgrade(data.userId, data.newTier);
            break;
        }
      };
      
      return () => eventSource.close();
    };
  `,

  analyticsIntegration: `
    // Analytics tracking
    const trackLeaderboardInteraction = (action: string, data: any) => {
      // Google Analytics
      gtag('event', action, {
        event_category: 'leaderboard',
        event_label: data.userId,
        value: data.points
      });
      
      // Custom analytics
      analytics.track('Leaderboard Interaction', {
        action,
        userId: data.userId,
        rank: data.rank,
        points: data.points,
        tier: data.tier
      });
    };
  `,

  notificationIntegration: `
    // Push notifications for rank changes
    const sendRankChangeNotification = async (userId: string, oldRank: number, newRank: number) => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        
        await registration.showNotification('Rank Update!', {
          body: \`You moved from #\${oldRank} to #\${newRank} on the leaderboard!\`,
          icon: '/icons/trophy.png',
          badge: '/icons/badge.png',
          tag: 'rank-change',
          data: { userId, oldRank, newRank }
        });
      }
    };
  `
};
