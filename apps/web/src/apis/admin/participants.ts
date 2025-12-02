import { createServerFn } from '@tanstack/react-start';
import cuid from 'cuid';
import { z } from 'zod';

import { UsersTable } from '@base/core/auth/schema';
import { generateQRCodeValue } from '@base/core/business.server/events/events';
import { and, asc, count, db, desc, eq, inArray, like, or, type SQL } from '@base/core/drizzle.server';

import { requireAdmin } from '~/apis/auth';

const listParticipantsInputSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['registered', 'checked_in']).optional(),
  participantType: z.enum(['regular', 'vip']).optional(),
  role: z.enum(['participant', 'ops', 'admin']).optional(),
  sortBy: z.enum(['name', 'email', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListParticipantsInput = z.infer<typeof listParticipantsInputSchema>;

export const listParticipants = createServerFn({ method: 'GET' })
  .validator((data: ListParticipantsInput) => listParticipantsInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const { page, pageSize, search, status, participantType, role, sortBy, sortOrder } = data;
    const offset = (page - 1) * pageSize;

    const conditions: SQL[] = [];

    if (search) {
      const searchPattern = `%${search}%`;
      const searchCondition = or(like(UsersTable.name, searchPattern), like(UsersTable.email, searchPattern));
      if (searchCondition) conditions.push(searchCondition);
    }

    if (status) {
      conditions.push(eq(UsersTable.status, status));
    }

    if (participantType) {
      conditions.push(eq(UsersTable.participantType, participantType));
    }

    if (role) {
      conditions.push(eq(UsersTable.role, role));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn = {
      name: UsersTable.name,
      email: UsersTable.email,
      createdAt: UsersTable.createdAt,
    }[sortBy];

    const orderFn = sortOrder === 'asc' ? asc : desc;

    const [users, totalResult] = await Promise.all([
      db
        .select({
          id: UsersTable.id,
          name: UsersTable.name,
          email: UsersTable.email,
          role: UsersTable.role,
          participantType: UsersTable.participantType,
          status: UsersTable.status,
          createdAt: UsersTable.createdAt,
          checkedInAt: UsersTable.checkedInAt,
        })
        .from(UsersTable)
        .where(whereClause)
        .orderBy(orderFn(sortColumn))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: count() }).from(UsersTable).where(whereClause),
    ]);

    const total = totalResult[0]?.count ?? 0;

    return {
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  });

const createUserInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  userType: z.enum(['vip', 'ops', 'admin']),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createUser = createServerFn({ method: 'POST' })
  .validator((data: CreateUserInput) => createUserInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const { name, email, userType } = data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await db.query.users.findFirst({
      where: eq(UsersTable.email, normalizedEmail),
    });

    if (existing) {
      throw new Error('Email already registered');
    }

    const userId = cuid();
    const qrCodeValue = generateQRCodeValue(userId);

    let role: 'participant' | 'ops' | 'admin' = 'participant';
    let participantType: 'regular' | 'vip' = 'regular';

    if (userType === 'vip') {
      participantType = 'vip';
    } else if (userType === 'ops') {
      role = 'ops';
    } else if (userType === 'admin') {
      role = 'admin';
    }

    const [newUser] = await db
      .insert(UsersTable)
      .values({
        id: userId,
        name,
        email: normalizedEmail,
        emailVerified: false,
        role,
        participantType,
        status: 'registered',
        qrCodeValue,
      })
      .returning();

    return { user: newUser };
  });

const importParticipantsInputSchema = z.object({
  participants: z.array(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
      lumaId: z.string().optional(),
    })
  ),
});

export type ImportParticipantsInput = z.infer<typeof importParticipantsInputSchema>;

type SkippedRow = {
  row: number;
  email: string;
  reason: string;
};

export const importParticipants = createServerFn({ method: 'POST' })
  .validator((data: ImportParticipantsInput) => importParticipantsInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const { participants } = data;

    if (participants.length === 0) {
      return { imported: 0, skipped: [] as SkippedRow[] };
    }

    const emails = participants.map((p) => p.email.toLowerCase().trim());
    const existingUsers = await db
      .select({ email: UsersTable.email })
      .from(UsersTable)
      .where(inArray(UsersTable.email, emails));

    const existingEmails = new Set(existingUsers.map((u) => u.email));

    const toInsert: (typeof UsersTable.$inferInsert)[] = [];
    const skipped: SkippedRow[] = [];

    participants.forEach((p, index) => {
      const normalizedEmail = p.email.toLowerCase().trim();

      if (existingEmails.has(normalizedEmail)) {
        skipped.push({
          row: index + 1,
          email: normalizedEmail,
          reason: 'Email already registered',
        });
        return;
      }

      if (toInsert.some((u) => u.email === normalizedEmail)) {
        skipped.push({
          row: index + 1,
          email: normalizedEmail,
          reason: 'Duplicate email in import file',
        });
        return;
      }

      const userId = cuid();
      const qrCodeValue = generateQRCodeValue(userId);

      toInsert.push({
        id: userId,
        name: p.name,
        email: normalizedEmail,
        emailVerified: false,
        role: 'participant',
        participantType: 'regular',
        status: 'registered',
        lumaId: p.lumaId || null,
        qrCodeValue,
      });
    });

    if (toInsert.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        await db.insert(UsersTable).values(batch);
      }
    }

    return {
      imported: toInsert.length,
      skipped,
    };
  });
