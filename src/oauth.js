// OAuth Configuration
export const OAUTH_CONFIG = {
  github: {
    clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/aura-app/auth/github/callback`,
    authUrl: 'https://github.com/login/oauth/authorize',
    scope: 'user:email',
  },
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/aura-app/auth/google/callback`,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'openid profile email',
  },
};

// GitHub OAuth sign-in
export const signInWithGitHub = () => {
  const { clientId, redirectUri, authUrl, scope } = OAUTH_CONFIG.github;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state: Math.random().toString(36).substring(7),
  });
  window.location.href = `${authUrl}?${params}`;
};

// Google OAuth sign-in
export const signInWithGoogle = () => {
  const { clientId, redirectUri, authUrl, scope } = OAUTH_CONFIG.google;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    state: Math.random().toString(36).substring(7),
  });
  window.location.href = `${authUrl}?${params}`;
};

// Extract OAuth code from URL (after redirect)
export const getOAuthCode = (provider) => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('state')) {
    return { code: params.get('code'), state: params.get('state') };
  }
  return null;
};
