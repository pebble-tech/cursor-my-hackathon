import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { CheckinRecordsTable, CheckinTypesTable } from '@base/core/business.server/events/schemas/schema';
import { CheckinTypeCategoryCodes } from '@base/core/config/constant';
import { asc, count, db, eq } from '@base/core/drizzle.server';

import { requireAdmin } from '~/apis/auth';

export const listCheckinTypes = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin();

  const checkinTypes = await db.select().from(CheckinTypesTable).orderBy(asc(CheckinTypesTable.displayOrder));

  return { checkinTypes };
});

const createCheckinTypeInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(CheckinTypeCategoryCodes),
  description: z.string().optional(),
  displayOrder: z.number().int().min(0),
  isActive: z.boolean().default(true),
});

export type CreateCheckinTypeInput = z.infer<typeof createCheckinTypeInputSchema>;

export const createCheckinType = createServerFn({ method: 'POST' })
  .validator((data: CreateCheckinTypeInput) => createCheckinTypeInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const existing = await db.query.checkinTypes.findFirst({
      where: eq(CheckinTypesTable.name, data.name),
    });

    if (existing) {
      throw new Error('Check-in type with this name already exists');
    }

    const [newCheckinType] = await db.insert(CheckinTypesTable).values(data).returning();

    return { checkinType: newCheckinType };
  });

const updateCheckinTypeInputSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required').optional(),
  type: z.enum(CheckinTypeCategoryCodes).optional(),
  description: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCheckinTypeInput = z.infer<typeof updateCheckinTypeInputSchema>;

export const updateCheckinType = createServerFn({ method: 'POST' })
  .validator((data: UpdateCheckinTypeInput) => updateCheckinTypeInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const { id, ...updateData } = data;

    if (updateData.name) {
      const existing = await db.query.checkinTypes.findFirst({
        where: eq(CheckinTypesTable.name, updateData.name),
      });

      if (existing && existing.id !== id) {
        throw new Error('Check-in type with this name already exists');
      }
    }

    const [updatedCheckinType] = await db
      .update(CheckinTypesTable)
      .set(updateData)
      .where(eq(CheckinTypesTable.id, id))
      .returning();

    if (!updatedCheckinType) {
      throw new Error('Check-in type not found');
    }

    return { checkinType: updatedCheckinType };
  });

const toggleCheckinTypeActiveInputSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export type ToggleCheckinTypeActiveInput = z.infer<typeof toggleCheckinTypeActiveInputSchema>;

export const toggleCheckinTypeActive = createServerFn({ method: 'POST' })
  .validator((data: ToggleCheckinTypeActiveInput) => toggleCheckinTypeActiveInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const checkinType = await db.query.checkinTypes.findFirst({
      where: eq(CheckinTypesTable.id, data.id),
    });

    if (!checkinType) {
      throw new Error('Check-in type not found');
    }

    const [updatedCheckinType] = await db
      .update(CheckinTypesTable)
      .set({ isActive: !checkinType.isActive })
      .where(eq(CheckinTypesTable.id, data.id))
      .returning();

    if (!updatedCheckinType) {
      throw new Error('Check-in type not found');
    }

    return { checkinType: updatedCheckinType };
  });

const deleteCheckinTypeInputSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export type DeleteCheckinTypeInput = z.infer<typeof deleteCheckinTypeInputSchema>;

export const deleteCheckinType = createServerFn({ method: 'POST' })
  .validator((data: DeleteCheckinTypeInput) => deleteCheckinTypeInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const recordCount = await db
      .select({ count: count() })
      .from(CheckinRecordsTable)
      .where(eq(CheckinRecordsTable.checkinTypeId, data.id));

    const countValue = recordCount[0]?.count ?? 0;

    if (countValue > 0) {
      throw new Error(`Cannot delete check-in type: ${countValue} check-in record(s) exist`);
    }

    const [deletedCheckinType] = await db
      .delete(CheckinTypesTable)
      .where(eq(CheckinTypesTable.id, data.id))
      .returning();

    if (!deletedCheckinType) {
      throw new Error('Check-in type not found');
    }

    return { checkinType: deletedCheckinType };
  });
