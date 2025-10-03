'use client';

import React from 'react';
import { WebhookDashboard } from '@/components/WebhookDashboard';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function WebhooksAdminPage() {
  const { isAdmin, isLoading, error } = useAdminAuth();

  if (isLoading) {
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
                <h1 className="text-2xl font-bold text-white">🔗 Webhook Management</h1>
                <p className="text-white/70">Monitor and manage Whop webhook integrations</p>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="/admin"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                >
                  ← Back to Admin
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <WebhookDashboard />
        </div>
      </div>
    </div>
  );
}

// Loading Skeleton
function AdminLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="w-48 h-8 bg-white/20 rounded mb-2"></div>
                <div className="w-64 h-4 bg-white/20 rounded"></div>
              </div>
              <div className="w-24 h-8 bg-white/20 rounded"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-full h-24 bg-white/10 rounded-lg"></div>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
              <div className="w-32 h-6 bg-white/20 rounded mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full h-12 bg-white/10 rounded-lg"></div>
                ))}
              </div>
            </div>
            
            <div className="frosted-glass rounded-2xl p-6 border border-white/20 backdrop-blur-xl bg-white/10">
              <div className="w-32 h-6 bg-white/20 rounded mb-4"></div>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-full h-16 bg-white/10 rounded-lg"></div>
                ))}
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
          {error || 'You need admin permissions to access webhook management.'}
        </p>
        <div className="space-y-3">
          <a 
            href="/admin"
            className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Return to Admin Dashboard
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
