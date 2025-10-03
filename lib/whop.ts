// OAuth configuration
export const WHOP_OAUTH_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_WHOP_CLIENT_ID!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  scopes: ['user:read', 'user:email'],
};

// Generate OAuth URL (client-side safe)
export function getWhopAuthUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_WHOP_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  if (!clientId) {
    throw new Error('NEXT_PUBLIC_WHOP_CLIENT_ID is not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/auth/callback`,
    response_type: 'code',
    scope: 'user:read user:email',
  });

  return `https://whop.com/oauth/authorize?${params.toString()}`;
}

// Server-side only functions
export async function exchangeCodeForToken(code: string) {
  try {
    const clientId = process.env.NEXT_PUBLIC_WHOP_CLIENT_ID;
    const clientSecret = process.env.WHOP_CLIENT_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!clientId || !clientSecret) {
      throw new Error('Whop credentials not configured');
    }

    const response = await fetch('https://api.whop.com/v2/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${appUrl}/auth/callback`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to exchange code for token: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
}

// Get user information using access token (server-side only)
export async function getWhopUser(accessToken: string) {
  try {
    const response = await fetch('https://api.whop.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch user information: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user information:', error);
    throw error;
  }
}

// Authenticate using Whop dev user token (development only)
export async function authenticateWithDevToken(devToken: string) {
  try {
    // In development, the dev token can be used directly as an access token
    // This is a Whop-specific development feature
    const response = await fetch('https://api.whop.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${devToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to authenticate with dev token: ${response.status} ${errorText}`);
    }

    const user = await response.json();
    return {
      access_token: devToken,
      user
    };
  } catch (error) {
    console.error('Error authenticating with dev token:', error);
    throw error;
  }
}

// Check access with Whop API using access token
export async function checkAccess(accessToken: string) {
  try {
    const response = await fetch('https://api.whop.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token invalid—regenerate via reinstall');
      }
      const errorText = await response.text();
      throw new Error(`Failed to check access: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking access:', error);
    throw error;
  }
}

// Check if user has Whop access (placeholder for OAuth integration)
export async function hasWhopAccess(userId: string): Promise<boolean> {
  try {
    // TODO: Implement actual Whop API integration
    // This should check if the user has access to the community
    
    // For development/testing, return true
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    // In production, implement proper Whop API check
    return false;
  } catch (error) {
    console.error('Error checking Whop access:', error);
    return false;
  }
}
