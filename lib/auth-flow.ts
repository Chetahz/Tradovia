import * as oauth from 'oauth4webapi';
import { cookies } from 'next/headers';
import { database } from '@/db';
import { configuredAuth } from './auth-session';
import { cookieNames, safeReturnTo, seal, unseal } from './auth-core';

async function provider(config: ReturnType<typeof configuredAuth>) {
  const response = await oauth.discoveryRequest(config.issuer);
  return oauth.processDiscoveryResponse(config.issuer, response);
}
function redirectTo(url: string) {
  return new Response(null, { status: 303, headers: { Location: url, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}
export async function startLogin(request: Request, signup = false) {
  try {
    const config = configuredAuth();
    if (new URL(request.url).origin !== config.origin) return new Response('Origin not allowed', { status: 403 });
    const server = await provider(config);
    if (!server.authorization_endpoint) throw new Error('Missing authorization endpoint');
    const state = oauth.generateRandomState(), nonce = oauth.generateRandomNonce();
    const verifier = oauth.generateRandomCodeVerifier();
    const returnTo = safeReturnTo(new URL(request.url).searchParams.get('returnTo'));
    const token = await seal({ state, nonce, verifier, returnTo }, config.secret, 'login', 600);
    (await cookies()).set(cookieNames(config.secure).transaction, token,
      { httpOnly: true, secure: config.secure, sameSite: 'lax', path: '/', maxAge: 600 });
    const url = new URL(server.authorization_endpoint);
    url.search = new URLSearchParams({
      client_id: config.clientId, redirect_uri: config.origin + '/auth/callback',
      response_type: 'code', scope: 'openid email profile', state, nonce,
      code_challenge: await oauth.calculatePKCECodeChallenge(verifier), code_challenge_method: 'S256',
      ...(signup ? { screen_hint: 'signup' } : {}),
    }).toString();
    return redirectTo(url.href);
  } catch {
    return new Response('Sign-in is not available yet. Please try again later.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function finishLogin(request: Request) {
  const jar = await cookies();
  let config;
  try { config = configuredAuth(); } catch { return new Response('Authentication unavailable', { status: 503 }); }
  const names = cookieNames(config.secure);
  const transaction = jar.get(names.transaction)?.value;
  jar.set(names.transaction, '', { httpOnly: true, secure: config.secure, sameSite: 'lax', path: '/', maxAge: 0 });
  try {
    if (new URL(request.url).origin !== config.origin || !transaction) throw new Error('Invalid transaction');
    const tx = await unseal(transaction, config.secret, 'login');
    if (typeof tx.state !== 'string' || typeof tx.nonce !== 'string' || typeof tx.verifier !== 'string')
      throw new Error('Invalid transaction');
    const server = await provider(config);
    const client: oauth.Client = { client_id: config.clientId, id_token_signed_response_alg: 'RS256' };
    const parameters = oauth.validateAuthResponse(server, client, new URL(request.url), tx.state);
    const response = await oauth.authorizationCodeGrantRequest(server, client,
      oauth.ClientSecretPost(config.clientSecret), parameters, config.origin + '/auth/callback', tx.verifier);
    const result = await oauth.processAuthorizationCodeResponse(server, client, response,
      { expectedNonce: tx.nonce, requireIdToken: true });
    await oauth.validateApplicationLevelSignature(server, response);
    const claims = oauth.getValidatedIdTokenClaims(result);
    if (!claims || typeof claims.sub !== 'string' || claims.sub.length > 255 ||
        claims.email_verified !== true || typeof claims.email !== 'string')
      return redirectTo(config.origin + '/auth?error=verify-email');
    const sid = crypto.randomUUID();
    const ttl = 60 * 60 * 8;
    await database().prepare('INSERT INTO auth_sessions(id,subject,email,display_name,expires_at) VALUES(?,?,?,?,?)')
      .bind(sid, claims.sub, claims.email.slice(0, 254),
        (typeof claims.name === 'string' && claims.name ? claims.name : claims.email).slice(0, 100),
        Date.now() + ttl * 1000).run();
    const session = await seal({ sid, sub: claims.sub }, config.secret, 'session', ttl);
    jar.set(names.session, session, { httpOnly: true, secure: config.secure, sameSite: 'lax', path: '/', maxAge: ttl });
    return redirectTo(config.origin + safeReturnTo(typeof tx.returnTo === 'string' ? tx.returnTo : null));
  } catch {
    return redirectTo(config.origin + '/auth?error=login-failed');
  }
}
