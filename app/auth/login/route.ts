import { startLogin } from '@/lib/auth-flow';
export const GET = (request: Request) => startLogin(request);
