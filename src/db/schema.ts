import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('users', {
  id: text('id').primaryKey().unique(),
  name: text('name').notNull(),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
});
