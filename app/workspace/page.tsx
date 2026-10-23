import Workspace from '@/components/workspace';
import { currentSession } from '@/lib/auth-session';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function App() {
  const session = await currentSession();
  if (!session) redirect('/auth');
  return <Workspace mode="real" admin={session.role === 'owner'} />;
}
