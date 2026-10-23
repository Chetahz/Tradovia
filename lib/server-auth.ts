import { cookies } from 'next/headers';
import { currentSession } from '@/lib/auth-session';
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function owner(request: Request) {
  const mode = new URL(request.url).searchParams.get('mode');
  if (mode === 'demo') {
    const jar = await cookies();
    let id = jar.get('tradovia_demo')?.value;
    if (!id || !/^[-a-f0-9]{36}$/.test(id)) {
      id = crypto.randomUUID();
      jar.set('tradovia_demo', id, {
        httpOnly: true,
        sameSite: 'strict',
        secure: new URL(request.url).protocol === 'https:',
        maxAge: 604800,
        path: '/',
      });
    }
    return { id: `demo:${id}`, mode: 'demo' as const };
  }
  const user = await currentSession();
  if (!user) throw new ApiError(401, 'Sign in to access your workspace');
  return { id: `auth0:${user.subject}`, mode: 'real' as const, role: user.role };
}
export function checkOrigin(request: Request) {
  if (request.method !== 'GET') {
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin)
      throw new ApiError(403, 'Origin not allowed');
  }
}
export function apiFailure(e: unknown) {
  return Response.json(
    {
      error:
        e instanceof ApiError
          ? e.message
          : e instanceof Error && e.message.startsWith('Invalid')
            ? e.message
            : 'Unable to save. Please check your input and try again.',
    },
    { status: e instanceof ApiError ? e.status : 400 },
  );
}
