import { createServerFn } from '@tanstack/react-start';

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
      .where(and(isNull(UsersTable.welcomeEmailSentAt), eq(UsersTable.role, 'participant')));

    if (usersToEmail.length === 0) {
      return { sentCount: 0, failedCount: 0, failures: [] };
    }

    logInfo('Starting welcome email batch', { count: usersToEmail.length });

    let sentCount = 0;
    const failures: Array<{ email: string; error: string }> = [];

    for (const user of usersToEmail) {
      try {
        if (user.participantType === 'vip' && !user.qrCodeValue) {
          logError('VIP user missing QR code value', { email: user.email });
          failures.push({ email: user.email, error: 'VIP user missing QR code' });
          continue;
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
          sentCount++;
        } else {
          failures.push({ email: user.email, error: result.error ?? 'Unknown error' });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logError('Failed to send welcome email', { email: user.email, error: errorMessage });
        failures.push({ email: user.email, error: errorMessage });
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
