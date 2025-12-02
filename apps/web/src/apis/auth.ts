import { UserRoleEnum, type UserRole } from '@base/core/config/constant';
import { createServerFn } from '@tanstack/react-start';
import { getWebRequest } from '@tanstack/react-start/server';

export type { UserRole };

export type Session = {
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
  };
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    participantType: string;
    status: string;
    image?: string | null;
  };
};

export type User = Session['user'];

export const getServerSession = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getWebRequest();
  if (!request) return null;
  const { auth } = await import('@base/core/auth/auth');
  return await auth.api.getSession({ headers: request.headers });
});

export async function requireSession(): Promise<Session> {
  const request = getWebRequest();
  if (!request) throw new Error('No request context');

  const { auth } = await import('@base/core/auth/auth');
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new Error('Unauthorized');

  return session as Session;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<Session> {
  const session = await requireSession();

  const userRole = session.user.role as UserRole;
  if (!allowedRoles.includes(userRole)) {
    throw new Error('Forbidden');
  }

  return session;
}

export async function requireAdmin(): Promise<Session> {
  return requireRole([UserRoleEnum.admin]);
}

export async function requireOpsOrAdmin(): Promise<Session> {
  return requireRole([UserRoleEnum.ops, UserRoleEnum.admin]);
}
