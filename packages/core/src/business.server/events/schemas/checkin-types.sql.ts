import { boolean, index, integer, pgTable, text } from 'drizzle-orm/pg-core';

import { cuidId, timestamps } from '../../../drizzle.server/types';

export const CHECKIN_TYPE = {
  ATTENDANCE: 'attendance',
  MEAL: 'meal',
} as const;

export type CheckinTypeCategory = (typeof CHECKIN_TYPE)[keyof typeof CHECKIN_TYPE];

export const CheckinTypesTable = pgTable(
  'checkin_types',
  {
    id: cuidId('id'),
    name: text('name').notNull().unique(),
    type: text('type').notNull(),
    description: text('description'),
    displayOrder: integer('display_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index('checkin_types_display_order_idx').on(table.displayOrder),
    index('checkin_types_is_active_idx').on(table.isActive),
  ]
);

export type CheckinType = typeof CheckinTypesTable.$inferSelect;
export type NewCheckinType = typeof CheckinTypesTable.$inferInsert;

