'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { redirect } from 'next/navigation';
import { LoginButton } from '@/components/LoginButton'; // Adjust path if your LoginButton is elsewhere (e.g., ../../components/LoginButton)

export default function ExperiencePage({ params }: { params: { experienceId: string } }) {
  const searchParams = useSearchParams();
  const token = searchParams.get('whop-dev-user-token');

  if (token) {
    console.log('Token found: ' + token.substring(0, 10) + '...'); // Logs for debug
    redirect('/dashboard'); // Forwards to leaderboard post-token detect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="p-8 text-center bg-white/10 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-4">Community Engagement Leaderboard</h1>
        <p className="text-gray-300 mb-4">Experience ID: {params.experienceId}</p>
        <p className="text-gray-400 mb-6">No dev token detected—log in to access the leaderboard.</p>
        <LoginButton />
      </div>
    </div>
  );
}