import AuthScreen from '@/components/auth-screen';
export default async function Auth({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <AuthScreen signInUrl="/auth/login" error={error === 'verify-email' ? 'verify-email' : error ? 'login-failed' : undefined} />;
}
