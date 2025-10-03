'use client';

import React, { useState, useEffect } from 'react';

interface WebhookStats {
  total_events: number;
  successful_events: number;
  failed_events: number;
  success_rate: number;
  events_by_type: Array<{
    event_type: string;
    count: number;
    success_count: number;
  }>;
}

interface WebhookEvent {
  id: string;
  event_type: string;
  payload: any;
  processing_result: any;
  processed_at: string;
  success: boolean;
  retry_count: number;
}

export function WebhookDashboard() {
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    loadWebhookData();
  }, []);

  const loadWebhookData = async () => {
    try {
      setLoading(true);
      
      // Load webhook statistics
      const statsResponse = await fetch('/api/admin/webhooks/stats');
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Load recent webhook events
      const eventsResponse = await fetch('/api/admin/webhooks/events?limit=20');
      const eventsData = await eventsResponse.json();
      
      if (eventsData.success) {
        setRecentEvents(eventsData.events);
      }

    } catch (error) {
      console.error('Error loading webhook data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runWebhookTest = async (testType: string) => {
    try {
      setTesting(true);
      setTestResults(null);

      const response = await fetch('/api/webhooks/whop/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_type: testType })
      });

      const result = await response.json();
      setTestResults(result);

      // Refresh data after test
      await loadWebhookData();

    } catch (error) {
      console.error('Error running webhook test:', error);
      setTestResults({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const retryFailedWebhooks = async () => {
    try {
      const response = await fetch('/api/admin/webhooks/retry', {
        method: 'POST'
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Retried ${result.retry_count} failed webhooks`);
        await loadWebhookData();
      } else {
        alert('Failed to retry webhooks');
      }

    } catch (error) {
      console.error('Error retrying webhooks:', error);
      alert('Error retrying webhooks');
    }
  };

  if (loading) {
    return <WebhookDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">🔗 Webhook Dashboard</h2>
            <p className="text-white/70">Monitor and test Whop webhook integrations</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadWebhookData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={retryFailedWebhooks}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
            >
              Retry Failed
            </button>
          </div>
        </div>

        {/* Webhook Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <WebhookStatCard
              title="Total Events"
              value={stats.total_events.toLocaleString()}
              icon="📊"
              color="blue"
            />
            <WebhookStatCard
              title="Successful"
              value={stats.successful_events.toLocaleString()}
              icon="✅"
              color="green"
            />
            <WebhookStatCard
              title="Failed"
              value={stats.failed_events.toLocaleString()}
              icon="❌"
              color="red"
            />
            <WebhookStatCard
              title="Success Rate"
              value={`${stats.success_rate}%`}
              icon="📈"
              color="purple"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Webhook Testing */}
        <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
          <h3 className="text-xl font-bold text-white mb-4">🧪 Webhook Testing</h3>
          
          <div className="space-y-3 mb-6">
            <WebhookTestButton
              label="Test Member Join"
              description="Simulate new member joining"
              testType="member_join"
              onTest={runWebhookTest}
              disabled={testing}
            />
            <WebhookTestButton
              label="Test Course Completion"
              description="Simulate course completion"
              testType="course_completion"
              onTest={runWebhookTest}
              disabled={testing}
            />
            <WebhookTestButton
              label="Test Member Cancel"
              description="Simulate member cancellation"
              testType="member_cancel"
              onTest={runWebhookTest}
              disabled={testing}
            />
            <WebhookTestButton
              label="Test Purchase Event"
              description="Simulate purchase with discount"
              testType="purchase_event"
              onTest={runWebhookTest}
              disabled={testing}
            />
            <WebhookTestButton
              label="Test Connectivity"
              description="Test webhook endpoint"
              testType="connectivity"
              onTest={runWebhookTest}
              disabled={testing}
            />
          </div>

          {/* Test Results */}
          {testResults && (
            <div className={`p-4 rounded-lg ${
              testResults.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
            }`}>
              <div className={`font-medium mb-2 ${testResults.success ? 'text-green-200' : 'text-red-200'}`}>
                {testResults.success ? '✅ Test Successful' : '❌ Test Failed'}
              </div>
              <pre className="text-sm text-white/80 overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Event Types Breakdown */}
        <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
          <h3 className="text-xl font-bold text-white mb-4">📋 Event Types</h3>
          
          {stats?.events_by_type && stats.events_by_type.length > 0 ? (
            <div className="space-y-3">
              {stats.events_by_type.map((eventType, index) => (
                <div key={eventType.event_type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getEventTypeIcon(eventType.event_type)}</span>
                      <span className="text-white/90">{formatEventType(eventType.event_type)}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{eventType.count}</div>
                      <div className="text-white/70 text-sm">
                        {eventType.success_count}/{eventType.count} success
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ 
                        width: `${(eventType.success_count / eventType.count) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/70">
              <div className="text-4xl mb-2">📭</div>
              <p>No webhook events recorded yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Events */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <h3 className="text-xl font-bold text-white mb-4">🕒 Recent Events</h3>
        
        {recentEvents.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentEvents.map((event) => (
              <WebhookEventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-white/70">
            <div className="text-4xl mb-2">📝</div>
            <p>No recent webhook events.</p>
          </div>
        )}
      </div>

      {/* Webhook Configuration */}
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <h3 className="text-xl font-bold text-white mb-4">⚙️ Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-white mb-2">Webhook Endpoint</h4>
            <div className="p-3 bg-white/10 rounded-lg font-mono text-sm text-white/90">
              {window.location.origin}/api/webhooks/whop
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-2">Supported Events</h4>
            <div className="text-white/70 text-sm space-y-1">
              <div>• membership.created</div>
              <div>• course.completed</div>
              <div>• membership.cancelled</div>
              <div>• payment.succeeded</div>
              <div>• user.updated</div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <h4 className="text-blue-200 font-medium mb-2">💡 Setup Instructions</h4>
          <div className="text-blue-200/80 text-sm space-y-2">
            <p>1. Copy the webhook endpoint URL above</p>
            <p>2. Add it to your Whop dashboard under Webhooks</p>
            <p>3. Select the events you want to receive</p>
            <p>4. Set your webhook secret in environment variables</p>
            <p>5. Test the integration using the test buttons</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Webhook Stat Card Component
interface WebhookStatCardProps {
  title: string;
  value: string;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'purple';
}

function WebhookStatCard({ title, value, icon, color }: WebhookStatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <div className="text-2xl font-bold text-white">{value}</div>
      </div>
      <div className="text-white/70 text-sm">{title}</div>
    </div>
  );
}

// Webhook Test Button Component
interface WebhookTestButtonProps {
  label: string;
  description: string;
  testType: string;
  onTest: (testType: string) => void;
  disabled: boolean;
}

function WebhookTestButton({ label, description, testType, onTest, disabled }: WebhookTestButtonProps) {
  return (
    <button
      onClick={() => onTest(testType)}
      disabled={disabled}
      className="w-full p-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-left transition-colors"
    >
      <div className="font-medium text-white">{label}</div>
      <div className="text-white/70 text-sm">{description}</div>
    </button>
  );
}

// Webhook Event Card Component
function WebhookEventCard({ event }: { event: WebhookEvent }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-4 bg-white/5 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-lg">{getEventTypeIcon(event.event_type)}</span>
          <div>
            <div className="font-medium text-white">{formatEventType(event.event_type)}</div>
            <div className="text-white/70 text-sm">
              {new Date(event.processed_at).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {event.success ? (
            <span className="px-2 py-1 bg-green-500/20 text-green-200 rounded-full text-xs">
              ✅ Success
            </span>
          ) : (
            <span className="px-2 py-1 bg-red-500/20 text-red-200 rounded-full text-xs">
              ❌ Failed
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-white/70 hover:text-white"
          >
            {expanded ? '▼' : '▶'}
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="mt-3 p-3 bg-white/10 rounded text-xs">
          <div className="mb-2">
            <strong className="text-white">Payload:</strong>
            <pre className="text-white/80 mt-1 overflow-auto">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </div>
          <div>
            <strong className="text-white">Result:</strong>
            <pre className="text-white/80 mt-1 overflow-auto">
              {JSON.stringify(event.processing_result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading Skeleton
function WebhookDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="w-48 h-8 bg-white/20 rounded mb-2"></div>
            <div className="w-64 h-4 bg-white/20 rounded"></div>
          </div>
          <div className="flex gap-3">
            <div className="w-20 h-10 bg-white/20 rounded"></div>
            <div className="w-24 h-10 bg-white/20 rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/10 rounded-xl p-4">
              <div className="w-8 h-8 bg-white/20 rounded mb-2"></div>
              <div className="w-16 h-6 bg-white/20 rounded mb-1"></div>
              <div className="w-12 h-4 bg-white/20 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper Functions
function getEventTypeIcon(eventType: string): string {
  const icons: Record<string, string> = {
    'membership.created': '👋',
    'user.joined': '👋',
    'course.completed': '🎓',
    'lesson.completed': '📚',
    'membership.cancelled': '👋',
    'membership.expired': '⏰',
    'user.left': '👋',
    'payment.succeeded': '💰',
    'purchase.completed': '🛒',
    'user.updated': '👤',
    'test': '🧪',
    'error': '❌'
  };
  return icons[eventType] || '📡';
}

function formatEventType(eventType: string): string {
  return eventType
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
