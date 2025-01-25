/**
 * It seems like the jetstream injester isn't able to find previously created records.
 * This class gets a backfill from the service account's repo as a workaround.
 */

import pino, { Logger } from "pino";
import { Database } from "./db/db";
import { env } from "./lib/env";
import { IdResolver } from "@atproto/identity";
import { Firehose, MemoryRunner } from "@atproto/sync";

export class Backfiller {
  private logger: Logger;
  private firehose: Firehose | undefined;
  private latestCursor: number;

  constructor(
    private db: Database,
    private idResolver: IdResolver
  ) {
    this.logger = pino({ name: "backfiller", level: env.LOG_LEVEL });
    this.latestCursor = 86115000;
  }

  async createFirehose() {
    this.latestCursor = await this.getLatestCursor();
    const handle = "pmsky.social";
    const did = await this.idResolver.handle.resolve(handle);
    if (!did) {
      this.logger.error(handle, "could not resolve handle");
      throw new Error("could not resolve handle", { cause: handle });
    }
    const didDoc = await this.idResolver.did.resolve(did);
    const endpoint = didDoc?.service?.at(0)?.serviceEndpoint;
    this.logger.trace(endpoint, "got endpoint");
    const host = "https://earthstar.us-east.host.bsky.network";
    const runner = new MemoryRunner({
      setCursor: async (cursor: number) => {
        const now = Date.now();
        if (cursor > this.latestCursor + 1000) {
          await this.db
            .insertInto("cursor_log")
            .values({ datetime: now, cursor })
            .execute();
          this.logger.trace(`new latest cursor: ${cursor}`);
          this.latestCursor = cursor;
          await this.db
            .deleteFrom("cursor_log")
            .where("datetime", "<", now - 10000)
            .execute();
        }
      },
      startCursor: this.latestCursor,
    });
    const firehose = new Firehose({
      idResolver: this.idResolver,
      service: host,
      handleEvent: this.handleEvent.bind(this),
      onError: this.handleError.bind(this),
      filterCollections: ["social.pmsky.label", "social.pmsky.vote"],
      excludeIdentity: true,
      excludeAccount: true,
      runner,
    });
    this.firehose = firehose;
    this.firehose.start();
  }

  private handleEvent(event: any) {
    this.logger.trace(event, "got event");
  }

  private handleError(err: any) {
    this.logger.error(err, "got error");
  }

  private async getLatestCursor() {
    const res = await this.db
      .selectFrom("cursor_log")
      .select("cursor")
      .orderBy("cursor desc")
      .limit(1)
      .executeTakeFirst();
    if (res === undefined) return this.latestCursor;
    this.logger.trace(`got latest cursor: ${res.cursor}`);
    return res.cursor;
  }
}
