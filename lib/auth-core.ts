import { EncryptJWT, jwtDecrypt, type JWTPayload } from 'jose';

export type AuthSettings = {
  APP_ORIGIN?: string;
  AUTH_ISSUER?: string;
  AUTH_CLIENT_ID?: string;
  AUTH_CLIENT_SECRET?: string;
  AUTH_SESSION_SECRET?: string;
  AUTH_OWNER_SUBJECT?: string;
};

export function authConfig(values: AuthSettings) {
  const { APP_ORIGIN, AUTH_ISSUER, AUTH_CLIENT_ID, AUTH_CLIENT_SECRET, AUTH_SESSION_SECRET } = values;
  if (!APP_ORIGIN || !AUTH_ISSUER || !AUTH_CLIENT_ID || !AUTH_CLIENT_SECRET || !AUTH_SESSION_SECRET)
    throw new Error('Authentication is not configured');
  const origin = new URL(APP_ORIGIN);
  if (origin.origin !== APP_ORIGIN || (origin.protocol !== 'https:' &&
      !(origin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(origin.hostname))))
    throw new Error('Invalid application origin');
  const issuer = new URL(AUTH_ISSUER);
  if (issuer.protocol !== 'https:' || issuer.username || issuer.password || issuer.search || issuer.hash)
    throw new Error('Invalid issuer');
  if (!/^[a-f0-9]{64}$/i.test(AUTH_SESSION_SECRET))
    throw new Error('Invalid session key');
  return {
    origin: origin.origin, issuer, clientId: AUTH_CLIENT_ID, clientSecret: AUTH_CLIENT_SECRET,
    secret: AUTH_SESSION_SECRET, secure: origin.protocol === 'https:',
    ownerSubject: values.AUTH_OWNER_SUBJECT || '',
  };
}

export function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith('/') || value.includes('\\') ||
      Array.from(value).some((char) => char.charCodeAt(0) <= 32)) return '/workspace';
  const parsed = new URL(value, 'https://tradovia.invalid');
  if (parsed.origin !== 'https://tradovia.invalid' || !/^\/(?:workspace|admin)\/?$/.test(parsed.pathname))
    return '/workspace';
  return parsed.pathname + parsed.search + parsed.hash;
}

function key(secret: string) {
  if (!/^[a-f0-9]{64}$/i.test(secret)) throw new Error('Invalid session key');
  return Uint8Array.from(secret.match(/../g)!, (part) => parseInt(part, 16));
}
export async function seal(payload: JWTPayload, secret: string, purpose: string, ttl: number) {
  return new EncryptJWT(payload).setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt().setIssuer('tradovia').setAudience(purpose)
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttl).encrypt(key(secret));
}
export async function unseal(token: string, secret: string, purpose: string) {
  const { payload } = await jwtDecrypt(token, key(secret), {
    issuer: 'tradovia', audience: purpose, keyManagementAlgorithms: ['dir'],
    contentEncryptionAlgorithms: ['A256GCM'],
  });
  return payload;
}

export function cookieNames(secure: boolean) {
  const prefix = secure ? '__Host-' : '';
  return { session: prefix + 'tradovia_session', transaction: prefix + 'tradovia_login' };
}
export function isOwner(subject: string, configuredSubject: string) {
  return Boolean(configuredSubject) && subject === configuredSubject;
}
