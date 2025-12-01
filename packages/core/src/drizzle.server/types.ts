import cuid from 'cuid';
import { bigserial, customType, text, timestamp } from 'drizzle-orm/pg-core';

export const bigSerialId = (name: string) => bigserial(name, { mode: 'number' }).primaryKey();

export const cuidId = (name: string) =>
  text(name)
    .primaryKey()
    .$default(() => cuid());

export const timestamps = {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const bytea = customType<{
  data: Buffer;
  notNull: false;
  default: false;
}>({
  dataType() {
    return 'bytea';
  },
});
