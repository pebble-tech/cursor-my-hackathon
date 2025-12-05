import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { UsersTable } from '@base/core/auth/schema';
import { and, count, db, eq, isNotNull, isNull } from '@base/core/drizzle.server';
import { sendWelcomeEmail } from '@base/core/email/templates/welcome';
import { sendVIPWelcomeEmail } from '@base/core/email/templates/welcome-vip';
import { logError, logInfo } from '@base/core/utils/logging';

import { requireAdmin } from '~/apis/auth';

export const getWelcomeEmailStats = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin();

  const [pendingResult, sentResult] = await Promise.all([
    db
      .select({ count: count() })
      .from(UsersTable)
      .where(and(isNull(UsersTable.welcomeEmailSentAt), eq(UsersTable.role, 'participant'))),
    db
      .select({ count: count() })
      .from(UsersTable)
      .where(and(isNotNull(UsersTable.welcomeEmailSentAt), eq(UsersTable.role, 'participant'))),
  ]);

  return {
    pendingCount: pendingResult[0]?.count ?? 0,
    sentCount: sentResult[0]?.count ?? 0,
  };
});

type SendWelcomeEmailsResult = {
  sentCount: number;
  failedCount: number;
  failures: Array<{ email: string; error: string }>;
};

const EMAIL_BATCH_SIZE = 100;
const DELAY_BETWEEN_EMAILS_MS = 600;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const sendWelcomeEmails = createServerFn({ method: 'POST' }).handler(
  async (): Promise<SendWelcomeEmailsResult> => {
    await requireAdmin();

    const usersToEmail = await db
      .select({
        id: UsersTable.id,
        name: UsersTable.name,
        email: UsersTable.email,
        participantType: UsersTable.participantType,
        qrCodeValue: UsersTable.qrCodeValue,
      })
      .from(UsersTable)
      .where(and(isNull(UsersTable.welcomeEmailSentAt), eq(UsersTable.role, 'participant')))
      .limit(EMAIL_BATCH_SIZE);

    if (usersToEmail.length === 0) {
      return { sentCount: 0, failedCount: 0, failures: [] };
    }

    logInfo('Starting welcome email batch', { count: usersToEmail.length, batchSize: EMAIL_BATCH_SIZE });

    let sentCount = 0;
    const failures: Array<{ email: string; error: string }> = [];

    for (let i = 0; i < usersToEmail.length; i++) {
      const user = usersToEmail[i];

      try {
        if (user.participantType === 'vip' && !user.qrCodeValue) {
          logError('VIP user missing QR code value', { email: user.email });
          failures.push({ email: user.email, error: 'VIP user missing QR code' });
        } else {
          let result: { success: boolean; error?: string };

          if (user.participantType === 'vip') {
            result = await sendVIPWelcomeEmail({
              to: user.email,
              name: user.name,
              qrCodeValue: user.qrCodeValue!,
            });
          } else {
            result = await sendWelcomeEmail({
              to: user.email,
              name: user.name,
            });
          }

          if (result.success) {
            await db.update(UsersTable).set({ welcomeEmailSentAt: new Date() }).where(eq(UsersTable.id, user.id));
            sentCount++;
          } else {
            failures.push({ email: user.email, error: result.error ?? 'Unknown error' });
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logError('Failed to send welcome email', { email: user.email, error: errorMessage });
        failures.push({ email: user.email, error: errorMessage });
      }

      if (i < usersToEmail.length - 1) {
        await sleep(DELAY_BETWEEN_EMAILS_MS);
      }
    }

    logInfo('Welcome email batch complete', { sentCount, failedCount: failures.length });

    return {
      sentCount,
      failedCount: failures.length,
      failures,
    };
  }
);

const sendWelcomeEmailToUserInputSchema = z.object({
  userId: z.string(),
});

export const sendWelcomeEmailToUser = createServerFn({ method: 'POST' })
  .validator((data: { userId: string }) => sendWelcomeEmailToUserInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const { userId } = data;

    const user = await db.query.users.findFirst({
      where: eq(UsersTable.id, userId),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        participantType: true,
        qrCodeValue: true,
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.role !== 'participant') {
      return { success: false, error: 'User is not a participant' };
    }

    try {
      if (user.participantType === 'vip' && !user.qrCodeValue) {
        logError('VIP user missing QR code value', { email: user.email });
        return { success: false, error: 'VIP user missing QR code' };
      }

      let result: { success: boolean; error?: string };

      if (user.participantType === 'vip') {
        result = await sendVIPWelcomeEmail({
          to: user.email,
          name: user.name,
          qrCodeValue: user.qrCodeValue!,
        });
      } else {
        result = await sendWelcomeEmail({
          to: user.email,
          name: user.name,
        });
      }

      if (result.success) {
        await db.update(UsersTable).set({ welcomeEmailSentAt: new Date() }).where(eq(UsersTable.id, user.id));
        logInfo('Welcome email sent to user', { email: user.email });
        return { success: true };
      } else {
        logError('Failed to send welcome email to user', { email: user.email, error: result.error });
        return { success: false, error: result.error ?? 'Unknown error' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logError('Failed to send welcome email to user', { email: user.email, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  });
