import { createAuthClient } from 'better-auth/client';
import { magicLinkClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  plugins: [magicLinkClient()],
});

export type AuthSession = typeof authClient.$Infer.Session;

