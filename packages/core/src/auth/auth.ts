import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';

import { ParticipantStatuses, ParticipantTypes } from '~/config/constant';
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
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
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
