import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { CodesTable, CreditTypesTable } from '@base/core/business.server/events/schemas/schema';
import { CodeDistributionTypeEnum, CodeStatusEnum, CreditCategoryCodes } from '@base/core/config/constant';
import { and, asc, count, db, eq, inArray, sql } from '@base/core/drizzle.server';

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
