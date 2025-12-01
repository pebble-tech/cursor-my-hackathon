import { index, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

import { UsersTable } from '../../../auth/schema';
import { cuidId, timestamps } from '../../../drizzle.server/types';

import { CreditTypesTable } from './credit-types.sql';

export const CODE_STATUS = {
  AVAILABLE: 'available',
  ASSIGNED: 'assigned',
  REDEEMED: 'redeemed',
} as const;

export type CodeStatus = (typeof CODE_STATUS)[keyof typeof CODE_STATUS];

export const CodesTable = pgTable(
  'codes',
  {
    id: cuidId('id'),
    creditTypeId: text('credit_type_id')
      .notNull()
      .references(() => CreditTypesTable.id, { onDelete: 'restrict' }),
    codeValue: text('code_value').notNull(),
    redeemUrl: text('redeem_url'),
    assignedTo: text('assigned_to').references(() => UsersTable.id, { onDelete: 'set null' }),
    assignedAt: timestamp('assigned_at'),
    redeemedAt: timestamp('redeemed_at'),
    status: text('status').notNull().default(CODE_STATUS.AVAILABLE),
    ...timestamps,
  },
  (table) => [
    index('codes_credit_type_status_idx').on(table.creditTypeId, table.status),
    index('codes_assigned_to_idx').on(table.assignedTo),
    unique('codes_credit_type_code_value_unq').on(table.creditTypeId, table.codeValue),
  ]
);

export type Code = typeof CodesTable.$inferSelect;
export type NewCode = typeof CodesTable.$inferInsert;

