/**
 * It seems like the jetstream injester isn't able to find previously created records.
 * This class backfills records by directly hitting the PDS and requesting all records,
 * while the jetstream listens for new ones.
 */

import pino, { Logger } from "pino";
import { Database } from "./db/migrations";
import { ProposalType, type Proposal, type ProposalVote } from "./db/types";
import { env } from "./lib/env";
import { IdResolver } from "@atproto/identity";
import { Firehose, MemoryRunner } from "@atproto/sync";
import { AtprotoServiceAccount } from "./serviceAccount";
import { type Record } from "@atproto/api/src/client/types/com/atproto/repo/listRecords";
import { type Record as LabelRecord } from "#/lexicon/types/social/pmsky/label";
import { type Record as LabelVoteRecord } from "#/lexicon/types/social/pmsky/vote";

export class Backfiller {
  private logger: Logger;
  constructor(
    private db: Database,
    private agent: AtprotoServiceAccount
  ) {
    this.logger = pino({ name: "backfiller", level: env.LOG_LEVEL });
  }

  async run() {
    const collections = await this.fetchCollections();
    // save records to db
    await this.saveLabels(collections.labels);
    await this.saveLabelVotes(collections.votes);
  }

  async fetchCollections() {
    const labels = await this.fetchLabels();
    const votes = await this.fetchLabelVotes();
    return { labels, votes };
  }

  async fetchLabels(): Promise<Proposal[]> {
    const collection = "social.pmsky.label";
    const records: Record[] = await this.agent.fetchRecords(collection);

    // transform to Label[]
    return records.map(transformLabel);
  }

  async fetchLabelVotes(): Promise<ProposalVote[]> {
    const collection = "social.pmsky.vote";
    const records: Record[] = await this.agent.fetchRecords(collection);
    return records.map((record) => {
      const val: LabelVoteRecord = record.value as unknown as LabelVoteRecord;
      return {
        uri: record.uri,
        val: val.val as 1 | -1,
        subject: val.uri as string,
        createdAt: val.cts,
        indexedAt: new Date().toISOString(),
        indexedBy: "backfiller.fetchLabelVotes",
      };
    });
  }

  async saveLabels(labels: Proposal[]) {
   if (labels.length === 0) {
      return
   }
   // this.logger.trace(labels, "saving labels");
   await this.db
      .insertInto("proposals")
      .values(labels)
      .onConflict((oc) => oc.column("rkey").doNothing())
      .execute();
  }

  async saveLabelVotes(votes: ProposalVote[]) {
    if (votes.length === 0) {
      return
    }
    // this.logger.trace(votes, "saving votes");
    await this.db
      .insertInto("proposal_votes")
      .values(votes)
      .onConflict((oc) => oc.column("uri").doNothing())
      .execute();
  }
}

const transformLabel = (record: Record): Proposal => {
  const val: LabelRecord = record.value as unknown as LabelRecord;
  const rkey = record.uri.split("/").pop();
  if (rkey === undefined) {
    throw new Error(
      "could not get rkey from record when backfilling from PDS",
      { cause: record }
    );
  }
  return {
    rkey,
    src: val.src,
    type: ProposalType.LABEL,
    val: val.val,
    subject: val.uri,
    createdAt: val.cts,
    indexedAt: new Date().toISOString(),
  } as Proposal;
};

export class RelayBackfiller {
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
