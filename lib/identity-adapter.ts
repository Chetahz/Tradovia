// Public identity is deliberately separate from the private Sites dispatcher.
// Bind a provider implementing this contract before enabling email/password or Google buttons.
export type IdentitySession = {
  subject: string;
  email: string;
  name: string;
  expiresAt: number;
};
export interface IdentityAdapter {
  signInWithPassword(email: string, password: string): Promise<IdentitySession>;
  signUp(
    email: string,
    password: string,
    returnTo: string,
  ): Promise<{ verificationRequired: boolean }>;
  startGoogleOAuth(
    state: string,
    codeChallenge: string,
    redirectUri: string,
  ): Promise<{ authorizeUrl: string }>;
  completeGoogleOAuth(
    code: string,
    state: string,
    codeVerifier: string,
  ): Promise<IdentitySession>;
  requestPasswordReset(email: string, redirectUri: string): Promise<void>;
  updatePassword(recoveryToken: string, password: string): Promise<void>;
  verifySession(request: Request): Promise<IdentitySession | null>;
  refreshSession(request: Request): Promise<IdentitySession | null>;
  revokeSession(request: Request): Promise<void>;
}
export const publicAuthRequirements = {
  sessionCookie: { httpOnly: true, secure: true, sameSite: 'lax', path: '/' },
  oauth: { pkce: 'S256', stateRequired: true, redirectAllowlistRequired: true },
  passwordReset: { oneTimeToken: true, expires: true, enumerationSafe: true },
  authorization:
    'Every server query scoped to verified subject; never accept owner IDs from the client',
} as const;
