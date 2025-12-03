import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError } from 'better-auth/api';
import { magicLink } from 'better-auth/plugins';

import { ParticipantStatusEnum, ParticipantTypeEnum, UserRoleEnum } from '~/config/constant';
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
        defaultValue: UserRoleEnum.participant,
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
        defaultValue: ParticipantTypeEnum.regular,
        input: false,
      },
      status: {
        type: 'string',
        required: false,
        defaultValue: ParticipantStatusEnum.registered,
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

            if (user.participantType === ParticipantTypeEnum.vip) {
              logWarning('VIP user attempted Google OAuth login', {
                email: user.email,
                userId: account.userId,
              });
              throw new APIError('FORBIDDEN', {
                message: 'VIP users cannot login.',
              });
            }
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const user = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.id, session.userId),
          });

          if (user && user.participantType === ParticipantTypeEnum.vip) {
            logWarning('VIP user attempted to create session', {
              email: user.email,
              userId: session.userId,
            });
            throw new APIError('FORBIDDEN', {
              message: 'VIP users cannot login.',
            });
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

        if (existingUser.participantType === ParticipantTypeEnum.vip) {
          logWarning('VIP user attempted magic link login', { email });
          throw new Error('VIP users cannot login');
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
