import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';

export type DatabaseType = LibSQLDatabase<typeof schema>;
