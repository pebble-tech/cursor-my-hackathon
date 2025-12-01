import { drizzle } from 'drizzle-orm/node-postgres';

import { AccountsTable, SessionsTable, UsersTable, VerificationsTable } from '~/auth/schema';
import {
  CreditTypesTable,
  CodesTable,
  CheckinTypesTable,
  CheckinRecordsTable,
  usersRelations,
  creditTypesRelations,
  codesRelations,
  checkinTypesRelations,
  checkinRecordsRelations,
} from '~/business.server/events/schemas/schema';
import { env } from '~/config/env';

export {
  sql,
  and,
  or,
  not,
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  isNull,
  isNotNull,
  inArray,
  count,
  like,
  notLike,
  asc,
  desc,
} from 'drizzle-orm';

export const schema = {
  users: UsersTable,
  sessions: SessionsTable,
  accounts: AccountsTable,
  verifications: VerificationsTable,
  creditTypes: CreditTypesTable,
  codes: CodesTable,
  checkinTypes: CheckinTypesTable,
  checkinRecords: CheckinRecordsTable,
  usersRelations,
  creditTypesRelations,
  codesRelations,
  checkinTypesRelations,
  checkinRecordsRelations,
};

export const db = drizzle(env.DATABASE_URL, {
  schema,
  logger: false,
});
