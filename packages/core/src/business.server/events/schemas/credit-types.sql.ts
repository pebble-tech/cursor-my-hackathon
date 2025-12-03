import { boolean, index, integer, pgTable, text } from 'drizzle-orm/pg-core';

import { CodeDistributionTypeCodes } from '../../../config/constant';
import { cuidId, timestamps } from '../../../drizzle.server/types';

export const CreditTypesTable = pgTable(
  'credit_types',
  {
    id: cuidId('id'),
    name: text('name').notNull().unique(),
    displayName: text('display_name').notNull(),
    emailInstructions: text('email_instructions'),
    webInstructions: text('web_instructions'),
    displayOrder: integer('display_order').notNull().default(0),
    iconUrl: text('icon_url'),
    isActive: boolean('is_active').notNull().default(true),
    distributionType: text('distribution_type', { enum: CodeDistributionTypeCodes }).notNull().default('unique'),
    universalCode: text('universal_code'),
    universalRedeemUrl: text('universal_redeem_url'),
    ...timestamps,
  },
  (table) => [
    index('credit_types_display_order_idx').on(table.displayOrder),
    index('credit_types_is_active_idx').on(table.isActive),
  ]
);

export type CreditType = typeof CreditTypesTable.$inferSelect;
export type NewCreditType = typeof CreditTypesTable.$inferInsert;
