import { db, desc, eq } from '~/drizzle.server';
import { logInfo } from '~/utils/logging';

import { CommentsTable, PostsTable, type NewComment, type NewPost } from './schemas/schema';

export async function createPost(data: NewPost) {
  const [post] = await db.insert(PostsTable).values(data).returning();

  logInfo('posts:created', { postId: post.id, slug: post.slug });

  return post;
}

export async function getPostBySlug(slug: string) {
  const post = await db.query.posts.findFirst({
    where: eq(PostsTable.slug, slug),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  return post;
}

export async function listPosts(opts?: { limit?: number; authorId?: string }) {
  const limit = opts?.limit ?? 10;

  const query = db.query.posts.findMany({
    where: opts?.authorId ? eq(PostsTable.authorId, opts.authorId) : undefined,
    orderBy: desc(PostsTable.createdAt),
    limit,
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  return await query;
}

export async function addComment(data: NewComment) {
  const [comment] = await db.insert(CommentsTable).values(data).returning();

  logInfo('posts:comment:created', { commentId: comment.id, postId: comment.postId });

  return comment;
}

export async function getPostComments(postId: string) {
  const comments = await db.query.comments.findMany({
    where: eq(CommentsTable.postId, postId),
    orderBy: desc(CommentsTable.createdAt),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  return comments;
}

export async function deletePost(postId: string, authorId: string) {
  const post = await db.query.posts.findFirst({
    where: eq(PostsTable.id, postId),
  });

  if (!post) {
    throw new Error('Post not found');
  }

  if (post.authorId !== authorId) {
    throw new Error('Unauthorized');
  }

  await db.delete(PostsTable).where(eq(PostsTable.id, postId));

  logInfo('posts:deleted', { postId });
}
