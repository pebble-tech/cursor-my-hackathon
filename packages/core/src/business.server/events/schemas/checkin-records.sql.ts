import { index, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

import { UsersTable } from '../../../auth/schema';
import { cuidId } from '../../../drizzle.server/types';
import { CheckinTypesTable } from './checkin-types.sql';

export const CheckinRecordsTable = pgTable(
  'checkin_records',
  {
    id: cuidId('id'),
    checkinTypeId: text('checkin_type_id')
      .notNull()
      .references(() => CheckinTypesTable.id, { onDelete: 'restrict' }),
    participantId: text('participant_id')
      .notNull()
      .references(() => UsersTable.id, { onDelete: 'cascade' }),
    checkedInBy: text('checked_in_by')
      .notNull()
      .references(() => UsersTable.id, { onDelete: 'restrict' }),
    checkedInAt: timestamp('checked_in_at').notNull().defaultNow(),
  },
  (table) => [
    unique('checkin_records_type_participant_unq').on(table.checkinTypeId, table.participantId),
    index('checkin_records_participant_idx').on(table.participantId),
    index('checkin_records_checked_in_at_idx').on(table.checkedInAt),
    index('checkin_records_checked_in_by_idx').on(table.checkedInBy),
  ]
);

export type CheckinRecord = typeof CheckinRecordsTable.$inferSelect;
export type NewCheckinRecord = typeof CheckinRecordsTable.$inferInsert;
