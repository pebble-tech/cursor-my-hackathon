import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient();

export type AuthSession = typeof authClient.$Infer.Session;

