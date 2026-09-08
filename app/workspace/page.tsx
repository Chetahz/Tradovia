import Workspace from '@/components/workspace';
import { requireChatGPTUser } from '@/app/chatgpt-auth';
export const dynamic = 'force-dynamic';
export default async function App() {
  await requireChatGPTUser('/workspace');
  return <Workspace mode="real" />;
}
