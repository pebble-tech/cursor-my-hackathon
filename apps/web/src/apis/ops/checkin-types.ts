import { createServerFn } from '@tanstack/react-start';

import { CheckinTypesTable } from '@base/core/business.server/events/schemas/schema';
import { asc, db, eq } from '@base/core/drizzle.server';

import { requireOpsOrAdmin } from '~/apis/auth';

export const listCheckinTypes = createServerFn({ method: 'GET' }).handler(async () => {
  await requireOpsOrAdmin();

  const checkinTypes = await db
    .select()
    .from(CheckinTypesTable)
    .where(eq(CheckinTypesTable.isActive, true))
    .orderBy(asc(CheckinTypesTable.displayOrder));

  return { checkinTypes };
});
