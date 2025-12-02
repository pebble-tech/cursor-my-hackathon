import { createServerFn } from '@tanstack/react-start';
import { getWebRequest } from '@tanstack/react-start/server';

import { auth } from '@base/core/auth/auth';
import { UserRoleEnum, type UserRole } from '@base/core/config/constant';

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
  return await auth.api.getSession({ headers: request.headers });
});

export const requireSession = createServerFn({ method: 'GET' }).handler(async (): Promise<Session> => {
  const request = getWebRequest();
  if (!request) throw new Error('No request context');

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new Error('Unauthorized');

  return session as Session;
});

export const requireRole = createServerFn({ method: 'GET' })
  .validator((allowedRoles: UserRole[]) => allowedRoles)
  .handler(async ({ data: allowedRoles }): Promise<Session> => {
    const session = await requireSession();

    const userRole = session.user.role as UserRole;
    if (!allowedRoles.includes(userRole)) {
      throw new Error('Forbidden');
    }

    return session;
  });

export const requireAdmin = createServerFn({ method: 'GET' }).handler(async (): Promise<Session> => {
  return requireRole({ data: [UserRoleEnum.admin] });
});

export const requireOpsOrAdmin = createServerFn({ method: 'GET' }).handler(async (): Promise<Session> => {
  return requireRole({ data: [UserRoleEnum.ops, UserRoleEnum.admin] });
});
