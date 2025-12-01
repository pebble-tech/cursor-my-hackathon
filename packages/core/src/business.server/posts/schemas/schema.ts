import { relations } from 'drizzle-orm';

import { UsersTable } from '~/auth/schema';

import { CommentsTable } from './comments.sql';
import { PostsTable } from './posts.sql';

export const postsRelations = relations(PostsTable, ({ one, many }) => ({
  author: one(UsersTable, {
    fields: [PostsTable.authorId],
    references: [UsersTable.id],
  }),
  comments: many(CommentsTable),
}));

export const commentsRelations = relations(CommentsTable, ({ one }) => ({
  post: one(PostsTable, {
    fields: [CommentsTable.postId],
    references: [PostsTable.id],
  }),
  author: one(UsersTable, {
    fields: [CommentsTable.authorId],
    references: [UsersTable.id],
  }),
}));

export { CommentsTable, type Comment, type NewComment } from './comments.sql';
export { PostsTable, type Post, type NewPost } from './posts.sql';
