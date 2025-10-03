'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    
    try {
      const clientId = process.env.NEXT_PUBLIC_WHOP_CLIENT_ID;
      if (!clientId) {
        console.error('Missing NEXT_PUBLIC_WHOP_CLIENT_ID');
        setIsLoading(false);
        return;
      }

      const redirectUri = `${window.location.origin}/api/auth/callback`;
      const whopAuthUrl = `https://whop.com/api/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=read`;
      
      // Redirect to Whop OAuth
      window.location.href = whopAuthUrl;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all backdrop-blur-sm border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Logging in...' : 'Login with Whop'}
    </button>
  );
}