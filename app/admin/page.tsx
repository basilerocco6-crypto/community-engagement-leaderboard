'use client';

import React, { useState, useEffect } from 'react';
import { AdminNavigation } from '@/components/AdminNavigation';
import { AdminOverview } from '@/components/AdminOverview';
import { PointConfiguration } from '@/components/PointConfiguration';
import { TierConfiguration } from '@/components/TierConfiguration';
import { EngagementAnalytics } from '@/components/EngagementAnalytics';
import { ManualAdjustments } from '@/components/ManualAdjustments';
import { useAdminAuth } from '@/hooks/useAdminAuth';

type AdminTab = 'overview' | 'points' | 'tiers' | 'rewards' | 'analytics' | 'adjustments';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const { isAdmin, isLoading, error } = useAdminAuth();

  useEffect(() => {
    if (!isLoading) {
      setLoading(false);
    }
  }, [isLoading]);

  if (loading || isLoading) {
    return <AdminLoadingSkeleton />;
  }

  if (error || !isAdmin) {
    return <AdminAccessDenied error={error} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">⚙️ Admin Dashboard</h1>
                <p className="text-white/70">Manage your community engagement system</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-green-500/20 text-green-200 rounded-full text-sm">
                  Admin Access
                </div>
                <button className="p-2 text-white/70 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Navigation Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <AdminNavigation 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
              />
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {activeTab === 'overview' && <AdminOverview />}
              {activeTab === 'points' && <PointConfiguration />}
              {activeTab === 'tiers' && <TierConfiguration />}
              {activeTab === 'rewards' && (
                <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🎁</div>
                    <h3 className="text-xl font-bold text-white mb-2">Reward Configuration</h3>
                    <p className="text-white/70 mb-4">
                      Reward configuration is available in the dedicated rewards admin section.
                    </p>
                    <a 
                      href="/admin/rewards"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Go to Rewards Admin
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              )}
              {activeTab === 'analytics' && <EngagementAnalytics />}
              {activeTab === 'adjustments' && <ManualAdjustments />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Admin Access Control Hook
function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // TODO: Replace with actual Whop API integration
      // This should check if the current user has owner permissions
      const response = await fetch('/api/admin/check-access');
      const data = await response.json();

      if (response.ok) {
        setIsAdmin(data.isAdmin);
      } else {
        setError(data.error || 'Access denied');
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      setError('Failed to verify admin access');
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { isAdmin, isLoading, error };
}

// Loading Skeleton
function AdminLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="w-48 h-8 bg-white/20 rounded mb-2"></div>
                <div className="w-64 h-4 bg-white/20 rounded"></div>
              </div>
              <div className="w-24 h-8 bg-white/20 rounded"></div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="flex gap-8">
            <div className="w-64 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-full h-12 bg-white/10 rounded-lg"></div>
              ))}
            </div>
            <div className="flex-1">
              <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
                <div className="space-y-4">
                  <div className="w-48 h-6 bg-white/20 rounded"></div>
                  <div className="grid grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="w-full h-24 bg-white/10 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Access Denied Component
function AdminAccessDenied({ error }: { error?: string | null }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
      <div className="frosted-glass rounded-2xl p-8 border border-white/20 backdrop-blur-xl bg-white/10 text-center max-w-md">
        <div className="text-6xl mb-6">🚫</div>
        <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
        <p className="text-white/80 mb-6">
          {error || 'You need Whop community owner permissions to access the admin dashboard.'}
        </p>
        <div className="space-y-3">
          <a 
            href="/"
            className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Return to Community
          </a>
          <button 
            onClick={() => window.location.reload()}
            className="block w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
          >
            Retry Access Check
          </button>
        </div>
      </div>
    </div>
  );
}
