import { index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { UsersTable } from '../../../auth/schema';
import { cuidId, timestamps } from '../../../drizzle.server/types';

export const PostsTable = pgTable(
  'posts',
  {
    id: cuidId('id'),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    content: text('content').notNull(),
    excerpt: text('excerpt'),
    published: timestamp('published'),
    authorId: text('author_id')
      .notNull()
      .references(() => UsersTable.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [index('posts_author_id_idx').on(table.authorId)]
);

export type Post = typeof PostsTable.$inferSelect;
export type NewPost = typeof PostsTable.$inferInsert;
