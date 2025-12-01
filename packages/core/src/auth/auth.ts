import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { env } from '~/config/env';
import { db } from '~/drizzle.server';

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
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
