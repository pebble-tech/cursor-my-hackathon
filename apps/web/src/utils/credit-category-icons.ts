import { Code, Gift, UtensilsCrossed } from 'lucide-react';

import type { CreditCategory } from '@base/core/config/constant';

export const categoryIcons = {
  food_voucher: UtensilsCrossed,
  software_credit: Code,
  swag: Gift,
} as const satisfies Record<CreditCategory, typeof UtensilsCrossed>;
