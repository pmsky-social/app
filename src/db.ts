import SqliteDb from "better-sqlite3";
import {
  Kysely,
  type Migration,
  type MigrationProvider,
  Migrator,
  SqliteDialect,
} from "kysely";

// Types

export type DatabaseSchema = {
  label: Label;
  votes: VoteTable;
  auth_session: AuthSession;
  auth_state: AuthState;
};

export type Label = {
  uri: string;
  src: string;
  val: string;
  subject: string;
  createdAt: string;
  indexedAt: string;
};

export type VoteTable = {
  uri: string;
  src: string;
  val: 1 | -1;
  subject: string;
  createdAt: string;
  indexedAt: string;
};

export type AuthSession = {
  key: string;
  session: AuthSessionJson;
};

export type AuthState = {
  key: string;
  state: AuthStateJson;
};

type AuthStateJson = string;

type AuthSessionJson = string;

// Migrations

const migrations: Record<string, Migration> = {};

const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations;
  },
};

migrations["001"] = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .createTable("label")
      .addColumn("uri", "varchar", (col) => col.primaryKey())
      .addColumn("src", "varchar", (col) => col.notNull())
      .addColumn("val", "varchar", (col) => col.notNull())
      .addColumn("subject", "varchar", (col) => col.notNull())
      .addColumn("createdAt", "varchar", (col) => col.notNull())
      .addColumn("indexedAt", "varchar", (col) => col.notNull())
      .execute();
    await db.schema
      .createTable("votes")
      .addColumn("uri", "varchar", (col) => col.primaryKey())
      .addColumn("src", "varchar", (col) => col.notNull())
      .addColumn("val", "boolean", (col) => col.notNull())
      .addColumn("subject", "varchar", (col) => col.notNull())
      .addColumn("createdAt", "varchar", (col) => col.notNull())
      .addColumn("indexedAt", "varchar", (col) => col.notNull())
      .execute();
    await db.schema
      .createTable("auth_session")
      .addColumn("key", "varchar", (col) => col.primaryKey())
      .addColumn("session", "varchar", (col) => col.notNull())
      .execute();
    await db.schema
      .createTable("auth_state")
      .addColumn("key", "varchar", (col) => col.primaryKey())
      .addColumn("state", "varchar", (col) => col.notNull())
      .execute();
  },
  async down(db: Kysely<unknown>) {
    await db.schema.dropTable("auth_state").execute();
    await db.schema.dropTable("auth_session").execute();
    await db.schema.dropTable("status").execute();
  },
};

// APIs

export const createDb = (location: string): Database => {
  return new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({
      database: new SqliteDb(location),
    }),
  });
};

export const migrateToLatest = async (db: Database) => {
  const migrator = new Migrator({ db, provider: migrationProvider });
  const { error } = await migrator.migrateToLatest();
  if (error) throw error;
};

export type Database = Kysely<DatabaseSchema>;
