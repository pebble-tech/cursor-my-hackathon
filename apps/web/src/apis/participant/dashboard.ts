import { createServerFn } from '@tanstack/react-start';
import { getWebRequest } from '@tanstack/react-start/server';

import { auth } from '@base/core/auth/auth';
import { UsersTable } from '@base/core/auth/schema';
import { CodesTable } from '@base/core/business.server/events/schemas/schema';
import { ParticipantStatusEnum } from '@base/core/config/constant';
import { db, eq } from '@base/core/drizzle.server';
import { validateCertificateName } from '@base/core/utils/certificate-name';

export const getParticipantDashboard = createServerFn({ method: 'GET' }).handler(async () => {
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
      status: true,
      qrCodeValue: true,
      checkedInAt: true,
      role: true,
      isNameUpdated: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const credits = await db.query.codes.findMany({
    where: eq(CodesTable.assignedTo, userId),
    with: {
      creditType: true,
    },
  });

  const sortedCredits = credits.sort((a, b) => (a.creditType?.displayOrder ?? 0) - (b.creditType?.displayOrder ?? 0));

  return {
    user,
    credits: sortedCredits,
  };
});

export const markCreditRedeemed = createServerFn({ method: 'POST' })
  .validator((data: { codeId: string; redeemed: boolean }) => data)
  .handler(async ({ data }) => {
    const request = getWebRequest();
    if (!request) throw new Error('No request context');

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) throw new Error('Unauthorized');

    const userId = session.user.id;

    const code = await db.query.codes.findFirst({
      where: eq(CodesTable.id, data.codeId),
    });

    if (!code || code.assignedTo !== userId) {
      throw new Error('Code not found or not assigned to you');
    }

    await db
      .update(CodesTable)
      .set({
        redeemedAt: data.redeemed ? new Date() : null,
      })
      .where(eq(CodesTable.id, data.codeId));

    return { success: true };
  });

export const updateProfileName = createServerFn({ method: 'POST' })
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
        status: true,
      },
    });

    if (!currentUser) {
      throw new Error('User not found');
    }

    if (currentUser.status !== ParticipantStatusEnum.checked_in) {
      throw new Error('You must check in at the event before you can set your certificate name');
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
        status: true,
        qrCodeValue: true,
        checkedInAt: true,
        role: true,
        isNameUpdated: true,
      },
    });

    if (!updatedUser) {
      throw new Error('User not found after update');
    }

    return updatedUser;
  });
