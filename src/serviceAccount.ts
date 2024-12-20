import assert from "node:assert";
import AtpAgent, {
  type Agent,
  type AtpSessionData,
  type AtpSessionEvent,
} from "@atproto/api";
import { TID } from "@atproto/common";
import type { Logger } from "pino";
import { v4 as uuid } from "uuid";
import { env } from "#/lib/env";
import { SvcActCredsStore } from "./auth/storage";
import { SVC_ACT_SESSION_KEY } from "./constants";
import type { Database } from "./db";
import { InvalidRecord, InvalidVote, LabelNotFound } from "./error";
import { validateLabel } from "./lexicon/types/com/atproto/label/defs";

///
/// this agent is used to perform actions on behalf of the platform,
/// currently uses an app password (from the environment) to login,
/// but those will eventually be deprecated
/// see this github discussion for (hopefully) a response
/// https://github.com/bluesky-social/atproto/discussions/2656#discussioncomment-11600163

/// TODO: figure out how to persist the session? refresh tokens?

type Record = {
  $type: string;
  src: string;
  uri: string;
  val: string | number; // TODO: need different record types? maybe LabelRecord and VoteRecord?
  cts: string;
};

export class AtprotoServiceAccount {
  constructor(
    private agent: Agent,
    private db: Database,
    private logger: Logger
  ) {}

  static async create(db: Database, logger: Logger) {
    const { SVC_ACT_EMAIL, SVC_ACT_APP_PW } = env;

    const agent = new AtpAgent({
      service: "https://bsky.social",
      persistSession: (evt: AtpSessionEvent, sess?: AtpSessionData) => {
        if (!sess) {
          logger.warn("tried to persist session, but session was undefined");
          return;
        }
        const store = new SvcActCredsStore(db);
        store.set(SVC_ACT_SESSION_KEY, sess);
      },
    });

    if (env.PUBLISH_TO_ATPROTO)
      await agent.login({
        identifier: SVC_ACT_EMAIL,
        password: SVC_ACT_APP_PW,
      });

    return new AtprotoServiceAccount(agent, db, logger);
  }

  hasValidSession(): boolean {
    return !!this.agent;
  }

  did() {
    assert(this.agent.did);
    return this.agent.did;
  }

  private async putRecord(record: Record, recordType: string, rkey: string) {
    let uri: string;
    if (env.PUBLISH_TO_ATPROTO) {
      const res = await this.agent.com.atproto.repo.putRecord({
        repo: this.did(),
        collection: recordType,
        rkey,
        record,
        validate: false,
      });
      uri = res.data.uri;
    } else {
      uri = uuid();
    }
    return uri;
  }

  async publishLabel(label: string, subject: string) {
    // Construct & validate their status record
    const recordType = "com.atproto.label.defs#label";
    const rkey = TID.nextStr();
    const record = {
      $type: recordType,
      src: this.did(),
      uri: subject, // todo: is this right? maybe should publish subject as subject
      val: label,
      cts: new Date().toISOString(),
    };

    if (!validateLabel(record).success) {
      throw new InvalidRecord(recordType);
    }

    // todo: make sure if this fails, it's handled correctly
    const uri = await this.putRecord(record, recordType, rkey);

    try {
      // Optimistically update our SQLite
      // This isn't strictly necessary because the write event will be
      // handled in #/firehose/ingestor.ts, but it ensures that future reads
      // will be up-to-date after this method finishes.
      await this.db
        .insertInto("label")
        .values({
          uri,
          src: record.src,
          val: record.val,
          subject: record.uri,
          createdAt: record.cts,
          indexedAt: new Date().toISOString(),
        })
        .execute();
    } catch (err) {
      this.logger.warn(
        { err },
        "failed to update computed view; ignoring as it should be caught by the firehose"
      );
    }
  }

  private async labelExists(labelUri: string) {
    const row = await this.db
      .selectFrom("label")
      .select("uri")
      .where("uri", "=", labelUri)
      .executeTakeFirst();

    return row !== undefined;
  }

  async publishVote(vote: 1 | -1, labelUri: string, userDid: string) {
    // check that labelUri exists in DB, if not throw error
    if (!(await this.labelExists(labelUri))) throw new LabelNotFound(labelUri);
    if (vote !== 1 && vote !== -1) throw new InvalidVote(vote);

    const recordType = "social.pmsky.label.vote";
    const rkey = TID.nextStr();
    const record = {
      $type: recordType,
      src: this.did(),
      uri: labelUri, // TODO: see line 98
      val: vote,
      cts: new Date().toISOString(),
    };
    const voteRecordUri = await this.putRecord(record, recordType, rkey);

    try {
      await this.db
        .insertInto("votes")
        .values({
          uri: voteRecordUri,
          src: userDid,
          val: record.val,
          subject: record.uri,
          createdAt: record.cts,
          indexedAt: new Date().toISOString(),
        })
        .execute();
    } catch (err) {
      this.logger.warn(
        { err },
        "failed to update computed view; ignoring as it should be caught by the firehose"
      );
    }
  }
}
