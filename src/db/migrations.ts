import SqliteDb from "better-sqlite3";
import {
  Kysely,
  type Migration,
  type MigrationProvider,
  Migrator,
  sql,
  SqliteDialect,
} from "kysely";
import { DatabaseSchema, ProposalType } from "./types";

const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations;
  },
};

const migrations: Record<string, Migration> = {
  "001": {
    async up(db: Kysely<unknown>) {
      await db.schema
        .createTable("labels")
        .addColumn("rkey", "varchar", (col) => col.primaryKey())
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
  },

  "002": {
    async up(db: Kysely<unknown>) {
      await db.schema
        .createTable("cursor_log")
        .addColumn("datetime", "datetime", (col) => col.notNull())
        .addColumn("cursor", "bigint", (col) => col.notNull())
        .execute();
    },
    async down(db: Kysely<unknown>) {
      await db.schema.dropTable("cursor_log").execute();
    },
  },

  "003": {
    async up(db: Kysely<unknown>) {
      await db.schema
        .createTable("allowed_users")
        .addColumn("id", "integer", (col) => col.primaryKey())
        .addColumn("handle", "varchar", (col) => col.notNull())
        .execute();
    },
  },

  "004": {
    async up(db: Kysely<DatabaseSchema>) {
      const init_whitelist = [
        "drewmca.dev",
        // "ntnsndr.in",
        // "sarahdawn.bsky.social",
        // "bmann.ca",
        // "purplesnail.craves.pizza",
        // "wake.st",
        // "jdp23.thenexus.today",
        // "laurenshof.online",
      ];
      await db
        .insertInto("allowed_users")
        .values(init_whitelist.map((handle, i) => ({ id: i, handle })))
        .execute();
    },
  },

  "005": {
    async up(db: Kysely<DatabaseSchema>) {
      // rename labels table to proposals (which includes labels)
      await db.schema.alterTable("labels").renameTo("proposals").execute();
      await db.schema
        .alterTable("label_votes")
        .renameTo("proposal_votes")
        .execute();

      await db.schema
        .alterTable("proposals")
        .addColumn("type", "varchar")
        .execute();
    },
  },
  "006": {
    async up(db: Kysely<DatabaseSchema>) {
      // create posts table
      await db.schema
        .createTable("posts")
        .addColumn("uri", "varchar", (col) => col.primaryKey())
        .addColumn("embed", "varchar")
        .execute();

      await db.schema.alterTable("proposals").dropColumn("embed").execute();
    },
  },
  "007": {
    async up(db: Kysely<DatabaseSchema>) {
      await db
        .updateTable("proposals")
        .where("type", "is", null)
        .set("type", ProposalType.LABEL)
        .execute();
    },
  },

  "008": {
    async up(db: Kysely<DatabaseSchema>) {
      await db.schema
        .alterTable("proposals")
        .addColumn("indexedBy", "varchar")
        .execute();
      await db.schema
        .alterTable("proposal_votes")
        .addColumn("indexedBy", "varchar")
        .execute();
      await db.schema
        .alterTable("user_votes")
        .addColumn("indexedBy", "varchar")
        .execute();
    },
  },
  "009": {
    async up(db: Kysely<DatabaseSchema>) {
      await db.schema
        .alterTable("proposals")
        .addColumn("uri", "varchar")
        .execute();

      await db
        .updateTable("proposals")
        .where("uri", "is", null)
        .set(
          "uri",
          sql`CONCAT('at://did:plc:xhkqwjmxuo65vwbwuiz53qor/social.pmsky.label/', rkey)`
        )
        .execute();
    },
  },
};

// APIs

export const createDb = (location: string): Database => {
  return new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({ database: new SqliteDb(location) }),
  });
};

export const migrateToLatest = async (db: Database) => {
  const migrator = new Migrator({ db, provider: migrationProvider });
  const { error } = await migrator.migrateToLatest();
  if (error) throw error;
};

export type Database = Kysely<DatabaseSchema>;
