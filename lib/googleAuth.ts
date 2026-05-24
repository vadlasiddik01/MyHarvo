export interface GoogleProfile {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export async function verifyGoogleAccessToken(accessToken: unknown): Promise<GoogleProfile | null> {
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    return null;
  }

  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    return null;
  }

  const profile = await response.json();
  if (typeof profile.sub !== 'string' || typeof profile.email !== 'string') {
    return null;
  }

  return {
    sub: profile.sub,
    email: profile.email.toLowerCase(),
    name: typeof profile.name === 'string' ? profile.name : undefined,
    picture: typeof profile.picture === 'string' ? profile.picture : undefined,
  };
}

