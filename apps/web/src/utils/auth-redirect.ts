import { UserRoleEnum } from '@base/core/config/constant';

export function getDashboardUrlForUser(user: { role?: string | null }): string {
  const role = user.role;

  switch (role) {
    case UserRoleEnum.admin:
      return '/admin';
    case UserRoleEnum.ops:
      return '/ops';
    case UserRoleEnum.participant:
      return '/dashboard';
    default:
      return '/';
  }
}
