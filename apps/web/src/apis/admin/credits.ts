import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { UsersTable } from '@base/core/auth/schema';
import { CheckinRecordsTable, CodesTable, CreditTypesTable } from '@base/core/business.server/events/schemas/schema';
import {
  CodeDistributionTypeEnum,
  CodeStatusEnum,
  CreditCategoryCodes,
  ParticipantTypeEnum,
  UserRoleCodes,
  UserRoleEnum,
} from '@base/core/config/constant';
import { and, asc, count, db, eq, inArray, isNull, sql } from '@base/core/drizzle.server';
import { BATCH_SIZE, sendBatchEmails } from '@base/core/email/client';
import { GIVEAWAY_EMAIL_SUBJECT, generateGiveawayEmailContent } from '@base/core/email/templates/giveaway-notification';
import { logError, logInfo } from '@base/core/utils/logging';

import { requireAdmin } from '~/apis/auth';

type PoolStats = {
  creditTypeId: string;
  total: number;
  assigned: number;
  remaining: number;
};

export const listCreditTypes = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin();

  const creditTypes = await db.select().from(CreditTypesTable).orderBy(asc(CreditTypesTable.displayOrder));

  const creditTypeIds = creditTypes.map((ct) => ct.id);

  let poolStatsMap: Map<string, PoolStats> = new Map();

  if (creditTypeIds.length > 0) {
    const stats = await db
      .select({
        creditTypeId: CodesTable.creditTypeId,
        total: count(),
        assigned: sql<number>`COUNT(*) FILTER (WHERE ${CodesTable.status} != ${CodeStatusEnum.unassigned})`,
        remaining: sql<number>`COUNT(*) FILTER (WHERE ${CodesTable.status} = ${CodeStatusEnum.unassigned})`,
      })
      .from(CodesTable)
      .where(inArray(CodesTable.creditTypeId, creditTypeIds))
      .groupBy(CodesTable.creditTypeId);

    poolStatsMap = new Map(stats.map((s) => [s.creditTypeId, s]));
  }

  const creditTypesWithStats = creditTypes.map((ct) => {
    const stats = poolStatsMap.get(ct.id) ?? { total: 0, assigned: 0, remaining: 0 };
    return {
      ...ct,
      poolStats: stats,
    };
  });

  return { creditTypes: creditTypesWithStats };
});

const createCreditTypeInputSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .regex(/^[a-z0-9_]+$/, 'Name must be lowercase letters, numbers, or underscores only'),
    displayName: z.string().min(1, 'Display name is required'),
    emailInstructions: z.string().min(1, 'Email instructions are required'),
    webInstructions: z.string().min(1, 'Web instructions are required'),
    displayOrder: z.number().int().min(0),
    iconUrl: z.string().url().optional().or(z.literal('')),
    isActive: z.boolean().default(true),
    category: z.enum(CreditCategoryCodes),
    distributionType: z.enum(['unique', 'universal']).default('unique'),
    universalCode: z.string().optional(),
    universalRedeemUrl: z.string().url().optional().or(z.literal('')),
    universalQuantity: z.number().int().min(1).optional(),
  })
  .refine(
    (data) => {
      if (data.distributionType === 'universal') {
        return !!data.universalCode && !!data.universalQuantity;
      }
      return true;
    },
    { message: 'Universal code and quantity are required for universal distribution type' }
  );

export type CreateCreditTypeInput = z.infer<typeof createCreditTypeInputSchema>;

export const createCreditType = createServerFn({ method: 'POST' })
  .validator((data: CreateCreditTypeInput) => createCreditTypeInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const existing = await db.query.creditTypes.findFirst({
      where: eq(CreditTypesTable.name, data.name),
    });

    if (existing) {
      throw new Error('Credit type with this name already exists');
    }

    const { universalQuantity, ...creditTypeData } = data;
    const normalizedUniversalCode = data.universalCode?.toUpperCase() || null;

    const [newCreditType] = await db
      .insert(CreditTypesTable)
      .values({
        ...creditTypeData,
        iconUrl: data.iconUrl || null,
        universalCode: normalizedUniversalCode,
        universalRedeemUrl: data.universalRedeemUrl || null,
      })
      .returning();

    if (data.distributionType === CodeDistributionTypeEnum.universal && universalQuantity && normalizedUniversalCode) {
      const codesToInsert: (typeof CodesTable.$inferInsert)[] = [];
      for (let i = 0; i < universalQuantity; i++) {
        codesToInsert.push({
          creditTypeId: newCreditType.id,
          codeValue: normalizedUniversalCode,
          redeemUrl: data.universalRedeemUrl || null,
          status: CodeStatusEnum.unassigned,
        });
      }

      const batchSize = 100;
      for (let i = 0; i < codesToInsert.length; i += batchSize) {
        const batch = codesToInsert.slice(i, i + batchSize);
        await db.insert(CodesTable).values(batch);
      }
    }

    return { creditType: newCreditType, codesCreated: universalQuantity ?? 0 };
  });

const updateCreditTypeInputSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  displayName: z.string().min(1, 'Display name is required').optional(),
  emailInstructions: z.string().min(1, 'Email instructions are required').optional(),
  webInstructions: z.string().min(1, 'Web instructions are required').optional(),
  displayOrder: z.number().int().min(0).optional(),
  iconUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  category: z.enum(CreditCategoryCodes).optional(),
});

export type UpdateCreditTypeInput = z.infer<typeof updateCreditTypeInputSchema>;

export const updateCreditType = createServerFn({ method: 'POST' })
  .validator((data: UpdateCreditTypeInput) => updateCreditTypeInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const { id, iconUrl, ...updateData } = data;

    const [updatedCreditType] = await db
      .update(CreditTypesTable)
      .set({
        ...updateData,
        ...(iconUrl !== undefined && { iconUrl: iconUrl || null }),
      })
      .where(eq(CreditTypesTable.id, id))
      .returning();

    if (!updatedCreditType) {
      throw new Error('Credit type not found');
    }

    return { creditType: updatedCreditType };
  });

const toggleCreditTypeActiveInputSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export type ToggleCreditTypeActiveInput = z.infer<typeof toggleCreditTypeActiveInputSchema>;

export const toggleCreditTypeActive = createServerFn({ method: 'POST' })
  .validator((data: ToggleCreditTypeActiveInput) => toggleCreditTypeActiveInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const creditType = await db.query.creditTypes.findFirst({
      where: eq(CreditTypesTable.id, data.id),
    });

    if (!creditType) {
      throw new Error('Credit type not found');
    }

    const [updatedCreditType] = await db
      .update(CreditTypesTable)
      .set({ isActive: !creditType.isActive })
      .where(eq(CreditTypesTable.id, data.id))
      .returning();

    if (!updatedCreditType) {
      throw new Error('Credit type not found');
    }

    return { creditType: updatedCreditType };
  });

const deleteCreditTypeInputSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export type DeleteCreditTypeInput = z.infer<typeof deleteCreditTypeInputSchema>;

export const deleteCreditType = createServerFn({ method: 'POST' })
  .validator((data: DeleteCreditTypeInput) => deleteCreditTypeInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const assignedCodesCount = await db
      .select({ count: count() })
      .from(CodesTable)
      .where(and(eq(CodesTable.creditTypeId, data.id), sql`${CodesTable.status} != ${CodeStatusEnum.unassigned}`));

    const countValue = assignedCodesCount[0]?.count ?? 0;

    if (countValue > 0) {
      throw new Error('Cannot delete credit type with assigned codes');
    }

    await db.delete(CodesTable).where(eq(CodesTable.creditTypeId, data.id));

    const [deletedCreditType] = await db.delete(CreditTypesTable).where(eq(CreditTypesTable.id, data.id)).returning();

    if (!deletedCreditType) {
      throw new Error('Credit type not found');
    }

    return { success: true };
  });

const importCodesInputSchema = z.object({
  creditTypeId: z.string().min(1, 'Credit type ID is required'),
  codes: z.array(
    z.object({
      codeValue: z.string().min(1, 'Code value is required'),
      redeemUrl: z.string().url().optional().or(z.literal('')),
    })
  ),
});

export type ImportCodesInput = z.infer<typeof importCodesInputSchema>;

type SkippedCode = {
  codeValue: string;
  reason: string;
};

export const importCodes = createServerFn({ method: 'POST' })
  .validator((data: ImportCodesInput) => importCodesInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const { creditTypeId, codes } = data;

    if (codes.length === 0) {
      return { imported: 0, skipped: [] as SkippedCode[] };
    }

    const creditType = await db.query.creditTypes.findFirst({
      where: eq(CreditTypesTable.id, creditTypeId),
    });

    if (!creditType) {
      throw new Error('Credit type not found');
    }

    const normalizedCodes = codes.map((c) => ({
      codeValue: c.codeValue.toUpperCase(),
      redeemUrl: c.redeemUrl,
    }));

    const codeValues = normalizedCodes.map((c) => c.codeValue);
    const existingCodes = await db
      .select({ codeValue: CodesTable.codeValue })
      .from(CodesTable)
      .where(and(eq(CodesTable.creditTypeId, creditTypeId), inArray(CodesTable.codeValue, codeValues)));

    const existingCodeValues = new Set(existingCodes.map((c) => c.codeValue));

    const toInsert: (typeof CodesTable.$inferInsert)[] = [];
    const skipped: SkippedCode[] = [];
    const seenInBatch = new Set<string>();

    normalizedCodes.forEach((code) => {
      if (existingCodeValues.has(code.codeValue)) {
        skipped.push({
          codeValue: code.codeValue,
          reason: 'Code already exists in database',
        });
        return;
      }

      if (seenInBatch.has(code.codeValue)) {
        skipped.push({
          codeValue: code.codeValue,
          reason: 'Duplicate code in import file',
        });
        return;
      }

      seenInBatch.add(code.codeValue);

      toInsert.push({
        creditTypeId,
        codeValue: code.codeValue,
        redeemUrl: code.redeemUrl || null,
        status: CodeStatusEnum.unassigned,
      });
    });

    if (toInsert.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        await db.insert(CodesTable).values(batch);
      }
    }

    return {
      imported: toInsert.length,
      skipped,
    };
  });

const giveawayPreviewInputSchema = z.object({
  creditTypeId: z.string().min(1, 'Credit type ID is required'),
  roles: z.array(z.enum(UserRoleCodes)).min(1, 'At least one role is required'),
  checkinTypeId: z.string().optional(),
});

export type GiveawayPreviewInput = z.infer<typeof giveawayPreviewInputSchema>;

export type GiveawayPreviewResult = {
  matchingUsers: number;
  availableCodes: number;
  canProceed: boolean;
  creditType: {
    id: string;
    name: string;
    displayName: string;
    isActive: boolean;
  };
};

export const getGiveawayPreview = createServerFn({ method: 'POST' })
  .validator((data: GiveawayPreviewInput) => giveawayPreviewInputSchema.parse(data))
  .handler(async ({ data }): Promise<GiveawayPreviewResult> => {
    await requireAdmin();

    const { creditTypeId, roles, checkinTypeId } = data;

    const creditType = await db.query.creditTypes.findFirst({
      where: eq(CreditTypesTable.id, creditTypeId),
    });

    if (!creditType) {
      throw new Error('Credit type not found');
    }

    const matchingUserIds = await getMatchingUserIds(roles, checkinTypeId);

    const [availableCodesResult] = await db
      .select({ count: count() })
      .from(CodesTable)
      .where(
        and(
          eq(CodesTable.creditTypeId, creditTypeId),
          eq(CodesTable.status, CodeStatusEnum.unassigned),
          isNull(CodesTable.assignedTo)
        )
      );

    const availableCodes = availableCodesResult?.count ?? 0;
    const matchingUsers = matchingUserIds.length;

    return {
      matchingUsers,
      availableCodes,
      canProceed: creditType.isActive && availableCodes >= matchingUsers && matchingUsers > 0,
      creditType: {
        id: creditType.id,
        name: creditType.name,
        displayName: creditType.displayName,
        isActive: creditType.isActive,
      },
    };
  });

async function getMatchingUserIds(roles: string[], checkinTypeId?: string): Promise<string[]> {
  type UserRole = (typeof UserRoleCodes)[number];
  const roleConditions: ReturnType<typeof eq>[] = [];

  for (const role of roles) {
    if (role === UserRoleEnum.participant) {
      roleConditions.push(
        and(eq(UsersTable.role, UserRoleEnum.participant), eq(UsersTable.participantType, ParticipantTypeEnum.regular))!
      );
    } else {
      roleConditions.push(eq(UsersTable.role, role as UserRole));
    }
  }

  if (roleConditions.length === 0) {
    return [];
  }

  const roleFilter = roleConditions.length === 1 ? roleConditions[0] : sql`(${sql.join(roleConditions, sql` OR `)})`;

  if (checkinTypeId) {
    const usersWithCheckin = await db
      .selectDistinct({ id: UsersTable.id })
      .from(UsersTable)
      .innerJoin(CheckinRecordsTable, eq(UsersTable.id, CheckinRecordsTable.participantId))
      .where(and(roleFilter, eq(CheckinRecordsTable.checkinTypeId, checkinTypeId)));

    return usersWithCheckin.map((u) => u.id);
  }

  const users = await db.select({ id: UsersTable.id }).from(UsersTable).where(roleFilter);

  return users.map((u) => u.id);
}

const executeGiveawayInputSchema = z.object({
  creditTypeId: z.string().min(1, 'Credit type ID is required'),
  roles: z.array(z.enum(UserRoleCodes)).min(1, 'At least one role is required'),
  checkinTypeId: z.string().optional(),
});

export type ExecuteGiveawayInput = z.infer<typeof executeGiveawayInputSchema>;

type AssignedCodeForEmail = {
  userId: string;
  userName: string;
  userEmail: string;
  codeValue: string;
  redeemUrl: string | null;
};

export type ExecuteGiveawayResult = {
  success: boolean;
  codesAssigned: number;
  assignedCodes: AssignedCodeForEmail[];
  creditType: {
    id: string;
    name: string;
    displayName: string;
    emailInstructions: string | null;
  };
};

export const executeGiveaway = createServerFn({ method: 'POST' })
  .validator((data: ExecuteGiveawayInput) => executeGiveawayInputSchema.parse(data))
  .handler(async ({ data }): Promise<ExecuteGiveawayResult> => {
    await requireAdmin();

    const { creditTypeId, roles, checkinTypeId } = data;

    const creditType = await db.query.creditTypes.findFirst({
      where: eq(CreditTypesTable.id, creditTypeId),
    });

    if (!creditType) {
      throw new Error('Credit type not found');
    }

    if (!creditType.isActive) {
      throw new Error('Credit type is not active');
    }

    const userIds = await getMatchingUserIds(roles, checkinTypeId);

    if (userIds.length === 0) {
      throw new Error('No users match the selected criteria');
    }

    const users = await db
      .select({ id: UsersTable.id, name: UsersTable.name, email: UsersTable.email })
      .from(UsersTable)
      .where(inArray(UsersTable.id, userIds));

    const userMap = new Map(users.map((u) => [u.id, u]));

    const assignedCodes: AssignedCodeForEmail[] = [];

    await db.transaction(async (tx) => {
      for (const userId of userIds) {
        const [code] = await tx
          .select()
          .from(CodesTable)
          .where(
            and(
              eq(CodesTable.creditTypeId, creditTypeId),
              eq(CodesTable.status, CodeStatusEnum.unassigned),
              isNull(CodesTable.assignedTo)
            )
          )
          .limit(1)
          .for('update', { skipLocked: true });

        if (!code) {
          throw new Error(
            `Insufficient codes in pool. Only ${assignedCodes.length} codes were available for ${userIds.length} users.`
          );
        }

        await tx
          .update(CodesTable)
          .set({
            assignedTo: userId,
            assignedAt: new Date(),
            status: CodeStatusEnum.available,
          })
          .where(eq(CodesTable.id, code.id));

        const user = userMap.get(userId);
        if (user) {
          assignedCodes.push({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            codeValue: code.codeValue,
            redeemUrl: code.redeemUrl,
          });
        }
      }
    });

    logInfo('Giveaway executed successfully', {
      creditTypeId,
      creditTypeName: creditType.name,
      codesAssigned: assignedCodes.length,
      roles,
      checkinTypeId,
    });

    await sendGiveawayEmails(assignedCodes, creditType);

    return {
      success: true,
      codesAssigned: assignedCodes.length,
      assignedCodes,
      creditType: {
        id: creditType.id,
        name: creditType.name,
        displayName: creditType.displayName,
        emailInstructions: creditType.emailInstructions,
      },
    };
  });

const DELAY_BETWEEN_BATCHES_MS = 600;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendGiveawayEmails(
  assignedCodes: AssignedCodeForEmail[],
  creditType: { displayName: string; emailInstructions: string | null }
) {
  logInfo('Starting giveaway email batch', { count: assignedCodes.length, batchSize: BATCH_SIZE });

  const batches: AssignedCodeForEmail[][] = [];
  for (let i = 0; i < assignedCodes.length; i += BATCH_SIZE) {
    batches.push(assignedCodes.slice(i, i + BATCH_SIZE));
  }

  let totalSent = 0;
  let totalFailed = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];

    const batchEmails = batch.map((assigned) => {
      const { html, text } = generateGiveawayEmailContent(assigned.userName, [
        {
          creditType: {
            displayName: creditType.displayName,
            emailInstructions: creditType.emailInstructions,
          },
          code: {
            codeValue: assigned.codeValue,
            redeemUrl: assigned.redeemUrl,
          },
        },
      ]);

      return {
        to: assigned.userEmail,
        subject: GIVEAWAY_EMAIL_SUBJECT,
        html,
        text,
      };
    });

    const result = await sendBatchEmails(batchEmails, { batchValidation: 'permissive' });

    if (!result.success) {
      logError('Failed to send giveaway email batch', {
        batchIndex,
        batchSize: batch.length,
        error: result.error,
      });
      totalFailed += batch.length;
    } else {
      result.results.forEach((emailResult) => {
        const assigned = batch[emailResult.emailIndex];
        if (emailResult.success) {
          totalSent++;
        } else {
          totalFailed++;
          logError('Failed to send giveaway notification email', {
            userId: assigned.userId,
            email: assigned.userEmail,
            error: emailResult.error,
          });
        }
      });
    }

    if (batchIndex < batches.length - 1) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  logInfo('Giveaway email batch complete', {
    total: assignedCodes.length,
    sent: totalSent,
    failed: totalFailed,
    batches: batches.length,
  });
}

const assignCodeToUserInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  creditTypeId: z.string().min(1, 'Credit type ID is required'),
  sendEmail: z.boolean().default(false),
});

export type AssignCodeToUserInput = z.infer<typeof assignCodeToUserInputSchema>;

export type AssignCodeToUserResult = {
  success: boolean;
  message: string;
  assignedCode?: {
    codeValue: string;
    redeemUrl: string | null;
  };
  creditType?: {
    id: string;
    name: string;
    displayName: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

export const assignCodeToUser = createServerFn({ method: 'POST' })
  .validator((data: AssignCodeToUserInput) => assignCodeToUserInputSchema.parse(data))
  .handler(async ({ data }): Promise<AssignCodeToUserResult> => {
    await requireAdmin();

    const { userId, creditTypeId, sendEmail } = data;

    const user = await db.query.users.findFirst({
      where: eq(UsersTable.id, userId),
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const creditType = await db.query.creditTypes.findFirst({
      where: eq(CreditTypesTable.id, creditTypeId),
    });

    if (!creditType) {
      return { success: false, message: 'Credit type not found' };
    }

    let assignedCode: typeof CodesTable.$inferSelect | undefined;

    await db.transaction(async (tx) => {
      const [code] = await tx
        .select()
        .from(CodesTable)
        .where(
          and(
            eq(CodesTable.creditTypeId, creditTypeId),
            eq(CodesTable.status, CodeStatusEnum.unassigned),
            isNull(CodesTable.assignedTo)
          )
        )
        .limit(1)
        .for('update', { skipLocked: true });

      if (!code) {
        throw new Error(`No available codes in pool for ${creditType.displayName}`);
      }

      await tx
        .update(CodesTable)
        .set({
          assignedTo: userId,
          assignedAt: new Date(),
          status: CodeStatusEnum.available,
        })
        .where(eq(CodesTable.id, code.id));

      assignedCode = code;
    });

    if (!assignedCode) {
      return {
        success: false,
        message: `Failed to assign code for ${creditType.displayName}`,
      };
    }

    logInfo('Ad-hoc code assignment completed', {
      userId,
      userName: user.name,
      creditTypeId,
      creditTypeName: creditType.name,
      codeId: assignedCode.id,
    });

    if (sendEmail) {
      const { html, text } = generateGiveawayEmailContent(user.name, [
        {
          creditType: {
            displayName: creditType.displayName,
            emailInstructions: creditType.emailInstructions,
          },
          code: {
            codeValue: assignedCode.codeValue,
            redeemUrl: assignedCode.redeemUrl,
          },
        },
      ]);

      const emailResult = await sendBatchEmails(
        [
          {
            to: user.email,
            subject: GIVEAWAY_EMAIL_SUBJECT,
            html,
            text,
          },
        ],
        { batchValidation: 'permissive' }
      );

      if (!emailResult.success) {
        logError('Failed to send ad-hoc assignment email', {
          userId,
          email: user.email,
          error: emailResult.error,
        });
      } else {
        logInfo('Ad-hoc assignment email sent', {
          userId,
          email: user.email,
        });
      }
    }

    return {
      success: true,
      message: `Successfully assigned ${creditType.displayName} code to ${user.name}`,
      assignedCode: {
        codeValue: assignedCode.codeValue,
        redeemUrl: assignedCode.redeemUrl,
      },
      creditType: {
        id: creditType.id,
        name: creditType.name,
        displayName: creditType.displayName,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  });

const getUserCodesInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export type GetUserCodesInput = z.infer<typeof getUserCodesInputSchema>;

export type UserCodeAssignment = {
  id: string;
  codeValue: string;
  redeemUrl: string | null;
  status: string;
  assignedAt: Date | null;
  redeemedAt: Date | null;
  creditType: {
    id: string;
    name: string;
    displayName: string;
    category: string;
  };
};

export const getUserCodes = createServerFn({ method: 'POST' })
  .validator((data: GetUserCodesInput) => getUserCodesInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const { userId } = data;

    const user = await db.query.users.findFirst({
      where: eq(UsersTable.id, userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    const codes = await db
      .select({
        id: CodesTable.id,
        codeValue: CodesTable.codeValue,
        redeemUrl: CodesTable.redeemUrl,
        status: CodesTable.status,
        assignedAt: CodesTable.assignedAt,
        redeemedAt: CodesTable.redeemedAt,
        creditTypeId: CreditTypesTable.id,
        creditTypeName: CreditTypesTable.name,
        creditTypeDisplayName: CreditTypesTable.displayName,
        creditTypeCategory: CreditTypesTable.category,
      })
      .from(CodesTable)
      .innerJoin(CreditTypesTable, eq(CodesTable.creditTypeId, CreditTypesTable.id))
      .where(eq(CodesTable.assignedTo, userId))
      .orderBy(asc(CodesTable.assignedAt));

    const assignments: UserCodeAssignment[] = codes.map((code) => ({
      id: code.id,
      codeValue: code.codeValue,
      redeemUrl: code.redeemUrl,
      status: code.status,
      assignedAt: code.assignedAt,
      redeemedAt: code.redeemedAt,
      creditType: {
        id: code.creditTypeId,
        name: code.creditTypeName,
        displayName: code.creditTypeDisplayName,
        category: code.creditTypeCategory,
      },
    }));

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      codes: assignments,
    };
  });

const unassignCodeFromUserInputSchema = z.object({
  codeId: z.string().min(1, 'Code ID is required'),
});

export type UnassignCodeFromUserInput = z.infer<typeof unassignCodeFromUserInputSchema>;

export const unassignCodeFromUser = createServerFn({ method: 'POST' })
  .validator((data: UnassignCodeFromUserInput) => unassignCodeFromUserInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const { codeId } = data;

    const code = await db.query.codes.findFirst({
      where: eq(CodesTable.id, codeId),
    });

    if (!code) {
      throw new Error('Code not found');
    }

    if (!code.assignedTo) {
      throw new Error('Code is not assigned to any user');
    }

    if (code.status === CodeStatusEnum.redeemed) {
      throw new Error('Cannot unassign a redeemed code');
    }

    const [updatedCode] = await db
      .update(CodesTable)
      .set({
        assignedTo: null,
        assignedAt: null,
        status: CodeStatusEnum.unassigned,
      })
      .where(eq(CodesTable.id, codeId))
      .returning();

    logInfo('Code unassigned from user', {
      codeId: updatedCode.id,
      previouslyAssignedTo: code.assignedTo,
    });

    return {
      success: true,
      message: 'Code successfully unassigned and returned to pool',
    };
  });
