import { drizzle } from 'drizzle-orm/node-postgres';

import { AccountsTable, SessionsTable, UsersTable, VerificationsTable } from '~/auth/schema';
import { CommentsTable, PostsTable, commentsRelations, postsRelations } from '~/business.server/posts/schemas/schema';
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
  comments: CommentsTable,
  posts: PostsTable,
  commentsRelations,
  postsRelations,
};

export const db = drizzle(env.DATABASE_URL, {
  schema,
  logger: false,
});
