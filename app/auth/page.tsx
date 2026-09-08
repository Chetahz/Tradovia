import { chatGPTSignInPath } from '@/app/chatgpt-auth';
import AuthScreen from '@/components/auth-screen';
export default function Auth() {
  return <AuthScreen signInUrl={chatGPTSignInPath('/workspace')} />;
}
