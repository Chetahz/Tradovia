export type Auth0ManagementSettings = {
  AUTH_ISSUER?: string;
  AUTH_MANAGEMENT_CLIENT_ID?: string;
  AUTH_MANAGEMENT_CLIENT_SECRET?: string;
};

export function auth0ManagementConfig(values: Auth0ManagementSettings) {
  const clientId = values.AUTH_MANAGEMENT_CLIENT_ID?.trim();
  const clientSecret = values.AUTH_MANAGEMENT_CLIENT_SECRET?.trim();
  if (!clientId && !clientSecret) return null;
  if (!clientId || !clientSecret || !values.AUTH_ISSUER)
    throw new Error('Auth0 Management API is partially configured');
  const issuer = new URL(values.AUTH_ISSUER);
  if (
    issuer.protocol !== 'https:' ||
    issuer.username ||
    issuer.password ||
    issuer.search ||
    issuer.hash
  )
    throw new Error('Invalid Auth0 issuer');
  return {
    issuer,
    clientId,
    clientSecret,
    audience: new URL('/api/v2/', issuer).href,
  };
}

export async function deleteAuth0Identity(
  settings: Auth0ManagementSettings,
  subject: string,
  fetcher: typeof fetch = fetch,
) {
  const config = auth0ManagementConfig(settings);
  if (!config) return false;
  if (!subject || subject.length > 255) throw new Error('Invalid Auth0 subject');

  const tokenResponse = await fetcher(new URL('/oauth/token', config.issuer), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      audience: config.audience,
    }),
  });
  if (!tokenResponse.ok) {
    console.error('Auth0 Management token request failed', {
      status: tokenResponse.status,
      response: (await tokenResponse.text()).slice(0, 500),
    });
    throw new Error('Auth0 Management token request failed');
  }
  const token = (await tokenResponse.json()) as { access_token?: unknown };
  if (typeof token.access_token !== 'string' || !token.access_token)
    throw new Error('Auth0 Management token is missing');

  const deleteResponse = await fetcher(
    new URL(`/api/v2/users/${encodeURIComponent(subject)}`, config.issuer),
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token.access_token}` },
    },
  );
  if (!deleteResponse.ok && deleteResponse.status !== 404) {
    console.error('Auth0 identity deletion failed', {
      status: deleteResponse.status,
      response: (await deleteResponse.text()).slice(0, 500),
    });
    throw new Error('Auth0 identity deletion failed');
  }
  return true;
}
