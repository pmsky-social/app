import type { IdResolver } from "@atproto/identity";
import {
  type CommitCreateEvent,
  type CommitUpdateEvent,
  Jetstream,
} from "@skyware/jetstream";

import pino from "pino";
import type { Database } from "#/db/db";
import {
  type Record as Label,
  isRecord as isLabel,
  validateRecord as validateLabel,
} from "#/lexicon/types/social/pmsky/label";
import {
  isRecord,
  validateRecord,
  Record as Vote,
} from "#/lexicon/types/social/pmsky/vote";
import { env } from "./lib/env";
import { SOCIAL_PMSKY_LABEL, SOCIAL_PMSKY_VOTE } from "./constants";

const ALL_SOCIAL_PMSKY_RECORDS = "social.pmsky.*";
const DESIRED_COLLECTIONS = [
  // SOCIAL_PMSKY_LABEL,
  // SOCIAL_PMSKY_VOTE,
  ALL_SOCIAL_PMSKY_RECORDS,
];

export function createIngester(db: Database, idResolver: IdResolver) {
  const logger = pino({ name: "firehose", level: env.LOG_LEVEL });
  if (!env.PUBLISH_TO_ATPROTO) {
    logger.warn("PUBLISH_TO_ATPROTO off, not running ingester");
    return;
  }
  const jetstream = new Jetstream({
    wantedCollections: DESIRED_COLLECTIONS,
    wantedDids: [env.SVC_ACT_DID],
    cursor: 1737429693000000,
    // 3rd label created at:
    // cursor: 1737410063753314
    // 4th
    // cursor: 1737411385065087
  });

  jetstream.on("open", () => {
    logger.info("jetstream opened");
  });

  jetstream.on("close", () => {
    logger.info("jetstream closed");
  });

  jetstream.on("error", (err) => {
    logger.error(err, "jetstream error");
  });

  jetstream.on("commit", (evt) => {
    logger.trace(evt, "received commit");
  });

  jetstream.onCreate(SOCIAL_PMSKY_LABEL, async (evt) => {
    logger.trace(evt, "creating label");
    if (
      isLabel(evt.commit.record) &&
      validateLabel(evt.commit.record).success
    ) {
      saveLabel(db, evt);
    } else {
      logger.warn(evt, "invalid label record");
    }
  });

  jetstream.onUpdate(SOCIAL_PMSKY_LABEL, async (evt) => {
    logger.trace(evt, "updating label");
    saveLabel(db, evt);
  });

  jetstream.onDelete(SOCIAL_PMSKY_LABEL, async (evt) => {
    logger.trace(evt, "deleting label");
    await db
      .deleteFrom("labels")
      .where("uri", "=", evt.commit.rkey.toString())
      .execute();
  });

  jetstream.onCreate(SOCIAL_PMSKY_VOTE, async (evt) => {
    if (
      isRecord(evt.commit.record) &&
      validateRecord(evt.commit.record).success
    ) {
      logger.trace(evt, "creating vote");
      saveVote(db, evt);
    } else {
      logger.warn(evt, "invalid vote record");
    }
  });

  jetstream.onUpdate(SOCIAL_PMSKY_VOTE, async (evt) => {
    logger.trace(evt, "updating vote");
    saveVote(db, evt);
  });

  jetstream.onDelete(SOCIAL_PMSKY_VOTE, async (evt) => {
    logger.trace(evt, "deleting vote");
    await db
      .deleteFrom("label_votes")
      .where("uri", "=", evt.commit.rkey.toString())
      .execute();
  });

  return jetstream;
}

async function saveLabel(
  db: Database,
  evt:
    | CommitCreateEvent<"social.pmsky.label">
    | CommitUpdateEvent<"social.pmsky.label">
) {
  const record: Label = evt.commit.record as unknown as Label;
  const now = new Date();
  await db
    .insertInto("labels")
    .values({
      rkey: evt.commit.rkey.toString(),
      uri: `at://${evt.did}/social.pmsky.label/${evt.commit.rkey}`,
      src: evt.did,
      val: record.val,
      subject: record.uri,
      createdAt: record.cts,
      indexedAt: now.toISOString(),
    })
    .onConflict((oc) =>
      oc.column("rkey").doUpdateSet({
        val: record.val,
        subject: record.uri,
        indexedAt: now.toISOString(),
      })
    )
    .execute();
}

async function saveVote(
  db: Database,
  evt:
    | CommitCreateEvent<"social.pmsky.vote">
    | CommitUpdateEvent<"social.pmsky.vote">
) {
  const record: Vote = evt.commit.record as unknown as Vote;
  const now = new Date();
  if (record.val !== 1 && record.val !== -1) {
    throw new Error("invalid vote value");
  }
  await db
    .insertInto("label_votes")
    .values({
      uri: evt.commit.rkey.toString(), // is this right?
      val: record.val,
      subject: record.uri,
      createdAt: record.cts,
      indexedAt: now.toISOString(),
    })
    .onConflict((oc) =>
      oc.column("uri").doUpdateSet({
        val: record.val as 1 | -1,
        subject: record.uri,
        indexedAt: now.toISOString(),
      })
    )
    .execute();
}
