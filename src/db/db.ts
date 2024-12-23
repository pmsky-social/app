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
  labels: Label;
  user_votes: UserVote; // keeps track of which users voted
  label_votes: LabelVote; // keeps track of vote values, these are separate for anonymity
  auth_session: AuthSession;
  auth_state: AuthState;
};

export type Label = {
  uri: string; // record ID (produced by ATProto)
  src: string; // who created the label (always the service act did)
  val: string; // the label itself
  subject: string; // the URI of the resource this label applies to
  embed: string | undefined; // the embedded version of the post
  createdAt: string;
  indexedAt: string;
};

// this struct only tracks the labels and voters, no vote values or record URIs
export type UserVote = {
  // uri: string; // URI of the vote
  src: string; // who voted
  // val: 1 | -1; // we don't save how they voted in this table
  subject: string; // the URI of the resource this vote applies to
  createdAt: string;
  indexedAt: string;
};

// this struct more closely matches the ATP records
export type LabelVote = {
  uri: string; // URI of the vote
  val: 1 | -1; // vote direction
  subject: string; // URI of the label voted on
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
      .createTable("labels")
      .addColumn("uri", "varchar", (col) => col.primaryKey())
      .addColumn("src", "varchar", (col) => col.notNull())
      .addColumn("val", "varchar", (col) => col.notNull())
      .addColumn("subject", "varchar", (col) => col.notNull())
      .addColumn("embed", "varchar")
      .addColumn("createdAt", "varchar", (col) => col.notNull())
      .addColumn("indexedAt", "varchar", (col) => col.notNull())
      .execute();
    await db.schema
      .createTable("user_votes")
      .addColumn("src", "varchar", (col) => col.notNull())
      .addColumn("subject", "varchar", (col) => col.notNull())
      .addColumn("createdAt", "varchar", (col) => col.notNull())
      .addColumn("indexedAt", "varchar", (col) => col.notNull())
      .execute();
    await db.schema
      .createTable("label_votes")
      .addColumn("uri", "varchar", (col) => col.primaryKey())
      .addColumn("val", "varchar", (col) => col.notNull())
      .addColumn("subject", "varchar", (col) => col.notNull()) // todo: foreign key?
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
    await db.schema.dropTable("labels").execute();
    await db.schema.dropTable("user_votes").execute();
    await db.schema.dropTable("label_votes").execute();
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
