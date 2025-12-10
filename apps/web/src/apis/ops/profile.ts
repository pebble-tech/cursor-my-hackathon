import { createServerFn } from '@tanstack/react-start';
import { getWebRequest } from '@tanstack/react-start/server';

import { auth } from '@base/core/auth/auth';
import { UsersTable } from '@base/core/auth/schema';
import { db, eq } from '@base/core/drizzle.server';
import { validateCertificateName } from '@base/core/utils/certificate-name';

export const getOpsProfile = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getWebRequest();
  if (!request) throw new Error('No request context');

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new Error('Unauthorized');

  const userId = session.user.id;

  const user = await db.query.users.findFirst({
    where: eq(UsersTable.id, userId),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      isNameUpdated: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
});

export const updateOpsProfileName = createServerFn({ method: 'POST' })
  .validator((data: { name: string }) => data)
  .handler(async ({ data }) => {
    const request = getWebRequest();
    if (!request) throw new Error('No request context');

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) throw new Error('Unauthorized');

    const userId = session.user.id;

    const currentUser = await db.query.users.findFirst({
      where: eq(UsersTable.id, userId),
      columns: {
        isNameUpdated: true,
      },
    });

    if (!currentUser) {
      throw new Error('User not found');
    }

    if (currentUser.isNameUpdated) {
      throw new Error('Certificate name cannot be changed after it has been saved');
    }

    const trimmedName = data.name.trim();
    const validation = validateCertificateName(trimmedName);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid name');
    }

    await db
      .update(UsersTable)
      .set({
        name: trimmedName,
        isNameUpdated: true,
      })
      .where(eq(UsersTable.id, userId));

    const updatedUser = await db.query.users.findFirst({
      where: eq(UsersTable.id, userId),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        isNameUpdated: true,
      },
    });

    if (!updatedUser) {
      throw new Error('User not found after update');
    }

    return updatedUser;
  });
