import assert from "node:assert";
import {
  type Agent,
  type AtpSessionData,
  type AtpSessionEvent,
  AtpAgent,
} from "@atproto/api";
import { TID } from "@atproto/common";
import type { Logger } from "pino";
import { v4 as uuid } from "uuid";
import { env } from "#/lib/env";
import { SvcActCredsStore } from "./auth/storage";
import { SOCIAL_PMSKY_PROPOSAL, SVC_ACT_SESSION_KEY } from "./constants";
import type { Database } from "./db/migrations";
import {
  AlreadyVoted,
  BadRequest,
  InvalidRecord,
  InvalidVote,
  ProposalExists,
  ProposalNotFound as ProposalNotFound,
} from "./error";
import {
  validateRecord as validateProposal,
  Record as ProposalRecord,
} from "./lexicon/types/social/pmsky/proposal";
import { VoteRepository } from "./db/repos/voteRepository";
import { Record as VoteRecord } from "./lexicon/types/social/pmsky/vote";
import { Proposal, ProposalType } from "./db/types";

///
/// this agent is used to perform actions on behalf of the platform,
/// currently uses an app password (from the environment) to login,
/// but those will eventually be deprecated
/// see this github discussion for (hopefully) a response
/// https://github.com/bluesky-social/atproto/discussions/2656#discussioncomment-11600163

/// TODO: figure out how to persist the session? refresh tokens?

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
        logger.trace(evt, "svc act agent persist session");
        if (!sess) {
          logger.warn("tried to persist session, but session was undefined");
          return;
        }
        const store = new SvcActCredsStore(db);
        store.set(SVC_ACT_SESSION_KEY, sess);
      },
    });

    const store = new SvcActCredsStore(db);
    const session_data = await store.get(SVC_ACT_SESSION_KEY);
    if (session_data) {
      logger.trace("resuming svc account session");
      await agent.resumeSession(session_data);
    }
    if (agent.did === undefined) {
      logger.trace("creating session by logging in");
      await agent.login({
        identifier: SVC_ACT_EMAIL,
        password: SVC_ACT_APP_PW,
      });
    }

    return new AtprotoServiceAccount(agent, db, logger);
  }

  hasValidSession(): boolean {
    return !!this.agent;
  }

  did() {
    if (!this.agent.did) {
      this.logger.warn("No DID for service account when requested");
      return env.SVC_ACT_DID;
    }
    assert(this.agent.did);
    return this.agent.did;
  }

  private async putRecord(
    record: ProposalRecord | VoteRecord,
    collection: string,
    rkey: string
  ) {
    let uri: string;
    const req = { repo: this.did(), collection, rkey, record, validate: false };
    if (env.PUBLISH_TO_ATPROTO) {
      this.logger.trace(req, "publishing record to atproto");
      const res = await this.agent.com.atproto.repo.putRecord(req);
      // this.logger.trace(res, "got response");
      uri = res.data.uri;
    } else {
      this.logger.warn(
        req,
        "PUBLISH_TO_ATPROTO off, would have published this record"
      );
      uri = `at://${this.did()}/${collection}/${rkey}`;
    }
    return uri;
  }

  async publishLabel(label: string, subject: string) {
    const existing = await this.getLabelUri(label, subject);
    if (existing !== undefined) {
      throw new ProposalExists(existing);
    }
    // Construct & validate label record
    const rkey = TID.nextStr();
    const record: ProposalRecord = {
      $type: SOCIAL_PMSKY_PROPOSAL,
      typ: ProposalType.LABEL,
      src: this.did(),
      uri: subject,
      val: label,
      cts: new Date().toISOString(),
    };

    const validationResult = validateProposal(record);
    if (!validationResult.success) {
      this.logger.error(validationResult, "invalid proposal record: ");
      throw new InvalidRecord(SOCIAL_PMSKY_PROPOSAL);
    }

    // todo: make sure if this fails, it's handled correctly
    const uri = await this.putRecord(record, SOCIAL_PMSKY_PROPOSAL, rkey);
    this.logger.trace({ uri }, "published label to atproto");

    try {
      // Optimistically update our SQLite
      // This isn't strictly necessary because the write event will be
      // handled in #/firehose/ingestor.ts, but it ensures that future reads
      // will be up-to-date after this method finishes.
      await this.db
        .insertInto("proposals")
        .values({
          rkey,
          src: record.src,
          type: ProposalType.LABEL,
          val: record.val,
          subject,
          createdAt: record.cts,
          indexedAt: new Date().toISOString(),
          uri: `at://${record.src}/social.pmsky.proposal/${rkey}`,
        } as Proposal)
        .execute();
      this.logger.trace("saved new label to local db");
    } catch (err) {
      this.logger.warn(
        { err },
        "failed to update computed view; ignoring as it should be caught by the firehose"
      );
    }

    return rkey;
  }

  private async getLabelUri(label: string, subject: string) {
    const row = await this.db
      .selectFrom("proposals")
      .select("rkey")
      .select("src")
      .where("val", "=", label)
      .where("subject", "=", subject)
      .executeTakeFirst();
    if (!row) {
      this.logger.trace({ label, subject }, "no label found");
      return undefined;
    }
    const { rkey, src } = row;
    const uri = `at://${src}/${SOCIAL_PMSKY_PROPOSAL}/${rkey}`;
    return uri;
  }

  // todo: why is this on the svc acct?
  private async proposalExists({
    proposalUri,
    labelValue,
    subject,
  }: {
    proposalUri?: string;
    labelValue?: string;
    subject?: string;
  }): Promise<boolean> {
    let query = this.db.selectFrom("proposals").select("rkey");

    if (proposalUri) {
      const rkey = proposalUri.split("/").pop();
      const src = proposalUri.split("/")[2];
      if (rkey === undefined) {
        throw new BadRequest("missing rkey");
      }
      query = query.where("rkey", "=", rkey).where("src", "=", src);
    } else if (labelValue && subject) {
      query = query
        .where("val", "=", labelValue)
        .where("subject", "=", subject);
    } else {
      throw new BadRequest("missing labelUri or (labelValue and subject)");
    }

    return (await query.executeTakeFirst()) !== undefined;
  }

  private async userVotedAlready(
    userDid: string,
    labelUri: string
  ): Promise<boolean> {
    return (
      (await this.db
        .selectFrom("user_votes")
        .selectAll()
        .where("src", "=", userDid)
        .where("subject", "=", labelUri)
        .executeTakeFirst()) !== undefined
    );
  }

  async publishVote(vote: 1 | -1, proposalUri: string, userDid: string) {
    this.logger.trace(
      { vote, subject: proposalUri, userDid },
      "svc act publish vote"
    );
    // check that labelUri exists in DB, if not throw error
    if (!(await this.proposalExists({ proposalUri: proposalUri })))
      throw new ProposalNotFound(proposalUri);
    if (await this.userVotedAlready(userDid, proposalUri))
      throw new AlreadyVoted(proposalUri);
    if (vote !== 1 && vote !== -1) throw new InvalidVote(vote);

    // TODO: move this to a constant somewhere
    const recordType = "social.pmsky.vote";
    const rkey = TID.nextStr();
    const record: VoteRecord = {
      $type: recordType,
      src: this.did(),
      uri: proposalUri,
      val: vote,
      cts: new Date().toISOString(),
    };
    const voteRecordUri = await this.putRecord(record, recordType, rkey);

    try {
      await new VoteRepository(this.db, this.logger).saveVote(
        userDid,
        proposalUri,
        vote,
        voteRecordUri,
        record.cts
      );
    } catch (err) {
      this.logger.warn(
        { err },
        "failed to update computed view; ignoring as it should be caught by the firehose"
      );
    }
  }

  async fetchRecords(collection: string) {
    const records = await this.agent.com.atproto.repo.listRecords({
      repo: this.did(),
      collection,
    });
    return records.data.records;
  }

  async resolveHandle(handle: string) {
    return await this.agent.resolveHandle({ handle }).then((r) => r.data.did);
  }
}
