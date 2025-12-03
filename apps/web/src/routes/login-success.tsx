import { createFileRoute, redirect } from '@tanstack/react-router';

import { getServerSession } from '~/apis/auth';
import { getDashboardUrlForUser } from '~/utils/auth-redirect';

export const Route = createFileRoute('/login-success')({
  beforeLoad: async () => {
    const session = await getServerSession();
    if (!session) {
      throw redirect({ to: '/login' });
    }
    const dashboardUrl = getDashboardUrlForUser(session.user);
    throw redirect({ to: dashboardUrl });
  },
});
