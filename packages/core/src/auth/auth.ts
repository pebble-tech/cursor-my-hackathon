import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError } from 'better-auth/api';
import { magicLink } from 'better-auth/plugins';

import { ParticipantStatuses, ParticipantTypes, UserRoles } from '~/config/constant';
import { env } from '~/config/env';
import { db } from '~/drizzle.server';
import { sendMagicLinkEmail } from '~/email/templates/magic-link';
import { logError, logInfo, logWarning } from '~/utils/logging';

export const auth = betterAuth({
  baseURL: env.APP_BASE_URL,
  trustedOrigins: [env.APP_BASE_URL],
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
  }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? '',
      disableImplicitSignUp: true,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: UserRoles.PARTICIPANT.code,
        input: false,
      },
      lumaId: {
        type: 'string',
        required: false,
        input: false,
      },
      participantType: {
        type: 'string',
        required: false,
        defaultValue: ParticipantTypes.REGULAR.code,
        input: false,
      },
      status: {
        type: 'string',
        required: false,
        defaultValue: ParticipantStatuses.REGISTERED.code,
        input: false,
      },
      checkedInAt: {
        type: 'date',
        required: false,
        input: false,
      },
      checkedInBy: {
        type: 'string',
        required: false,
        input: false,
      },
      qrCodeValue: {
        type: 'string',
        required: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    account: {
      create: {
        after: async (account) => {
          // Validate Google OAuth users must have ops or admin role
          if (account.providerId === 'google') {
            const user = await db.query.users.findFirst({
              where: (users, { eq }) => eq(users.id, account.userId),
            });

            if (!user) {
              logWarning('Google OAuth account creation attempted for non-existent user', {
                userId: account.userId,
              });
              throw new APIError('BAD_REQUEST', {
                message: 'Email not registered. Please contact administrator.',
              });
            }

            if (user.role !== UserRoles.OPS.code && user.role !== UserRoles.ADMIN.code) {
              logWarning('Google OAuth account creation attempted by non-ops/admin user', {
                email: user.email,
                role: user.role,
                userId: account.userId,
              });
              throw new APIError('FORBIDDEN', {
                message: 'Google OAuth is only available for ops and admin users. Please use magic link.',
              });
            }
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          // Check if user has a Google account - if so, validate role
          const googleAccount = await db.query.accounts.findFirst({
            where: (accounts, { and, eq }) =>
              and(eq(accounts.userId, session.userId), eq(accounts.providerId, 'google')),
          });

          if (googleAccount) {
            const user = await db.query.users.findFirst({
              where: (users, { eq }) => eq(users.id, session.userId),
            });

            if (user && user.role !== UserRoles.OPS.code && user.role !== UserRoles.ADMIN.code) {
              logWarning('Google OAuth session creation attempted by non-ops/admin user', {
                email: user.email,
                role: user.role,
                userId: session.userId,
              });
              throw new APIError('FORBIDDEN', {
                message: 'Google OAuth is only available for ops and admin users. Please use magic link.',
              });
            }
          }

          return { data: session };
        },
      },
    },
  },
  plugins: [
    magicLink({
      expiresIn: 3600,
      disableSignUp: true,
      sendMagicLink: async ({ email, url }) => {
        const existingUser = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, email),
        });

        if (!existingUser) {
          logWarning('Magic link requested for non-existent user', { email });
          throw new Error('Email not registered');
        }

        if (existingUser.participantType === ParticipantTypes.VIP.code) {
          logWarning('VIP user attempted magic link login', { email });
          throw new Error('VIP users cannot login via magic link');
        }

        if (existingUser.role === UserRoles.OPS.code || existingUser.role === UserRoles.ADMIN.code) {
          logWarning('Ops/Admin user attempted magic link login', { email, role: existingUser.role });
          throw new Error('Ops and admin users must login via Google OAuth');
        }

        const result = await sendMagicLinkEmail({
          to: email,
          url,
          name: existingUser.name,
        });

        if (!result.success) {
          logError('Failed to send magic link email', { email, error: result.error });
          throw new Error('Failed to send magic link email');
        }

        logInfo('Magic link sent', { email, userId: existingUser.id });
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
