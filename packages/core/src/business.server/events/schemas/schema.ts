import { relations } from 'drizzle-orm';

import { UsersTable } from '../../../auth/schema';
import {
  CheckinTypeCategoryCodes,
  CheckinTypeCategoryEnum,
  CodeStatusCodes,
  CodeStatusEnum,
  type CheckinTypeCategory,
  type CodeStatus,
} from '../../../config/constant';
import { CheckinRecordsTable, type CheckinRecord, type NewCheckinRecord } from './checkin-records.sql';
import { CheckinTypesTable, type CheckinType, type NewCheckinType } from './checkin-types.sql';
import { CodesTable, type Code, type NewCode } from './codes.sql';
import { CreditTypesTable, type CreditType, type NewCreditType } from './credit-types.sql';

export const usersRelations = relations(UsersTable, ({ many, one }) => ({
  assignedCodes: many(CodesTable, { relationName: 'assignedCodes' }),
  checkinRecords: many(CheckinRecordsTable, { relationName: 'participantCheckins' }),
  processedCheckins: many(CheckinRecordsTable, { relationName: 'processedByCheckins' }),
  checkedInByUser: one(UsersTable, {
    fields: [UsersTable.checkedInBy],
    references: [UsersTable.id],
    relationName: 'checkedInByUser',
  }),
}));

export const creditTypesRelations = relations(CreditTypesTable, ({ many }) => ({
  codes: many(CodesTable),
}));

export const codesRelations = relations(CodesTable, ({ one }) => ({
  creditType: one(CreditTypesTable, {
    fields: [CodesTable.creditTypeId],
    references: [CreditTypesTable.id],
  }),
  assignedToUser: one(UsersTable, {
    fields: [CodesTable.assignedTo],
    references: [UsersTable.id],
    relationName: 'assignedCodes',
  }),
}));

export const checkinTypesRelations = relations(CheckinTypesTable, ({ many }) => ({
  checkinRecords: many(CheckinRecordsTable),
}));

export const checkinRecordsRelations = relations(CheckinRecordsTable, ({ one }) => ({
  checkinType: one(CheckinTypesTable, {
    fields: [CheckinRecordsTable.checkinTypeId],
    references: [CheckinTypesTable.id],
  }),
  participant: one(UsersTable, {
    fields: [CheckinRecordsTable.participantId],
    references: [UsersTable.id],
    relationName: 'participantCheckins',
  }),
  processedBy: one(UsersTable, {
    fields: [CheckinRecordsTable.checkedInBy],
    references: [UsersTable.id],
    relationName: 'processedByCheckins',
  }),
}));

export { CreditTypesTable, type CreditType, type NewCreditType };
export { CodesTable, CodeStatusCodes, CodeStatusEnum, type Code, type NewCode, type CodeStatus };
export {
  CheckinTypesTable,
  CheckinTypeCategoryCodes,
  CheckinTypeCategoryEnum,
  type CheckinType,
  type NewCheckinType,
  type CheckinTypeCategory,
};
export { CheckinRecordsTable, type CheckinRecord, type NewCheckinRecord };
