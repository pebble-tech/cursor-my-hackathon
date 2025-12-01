import { index, pgTable, text } from 'drizzle-orm/pg-core';

import { UsersTable } from '../../../auth/schema';
import { bigSerialId, timestamps } from '../../../drizzle.server/types';
import { PostsTable } from './posts.sql';

export const CommentsTable = pgTable(
  'comments',
  {
    id: bigSerialId('id'),
    content: text('content').notNull(),
    postId: text('post_id')
      .notNull()
      .references(() => PostsTable.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references(() => UsersTable.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [index('comments_post_id_idx').on(table.postId), index('comments_author_id_idx').on(table.authorId)]
);

export type Comment = typeof CommentsTable.$inferSelect;
export type NewComment = typeof CommentsTable.$inferInsert;
