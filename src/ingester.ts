import type { IdResolver } from "@atproto/identity";
import {
  type CommitCreateEvent,
  type CommitUpdateEvent,
  Jetstream,
} from "@skyware/jetstream";

import pino from "pino";
import type { Database } from "#/db/db";
import {
  type Label,
  isLabel,
  validateLabel,
} from "#/lexicon/types/com/atproto/label/defs";
import { env } from "./lib/env";

const COM_ATPROTO_LABEL = "com.atproto.label.defs#label";
const DESIRED_COLLECTIONS = [COM_ATPROTO_LABEL, "app.pmsky.label.vote"];

export function createIngester(db: Database, idResolver: IdResolver) {
  const logger = pino({ name: "firehose ingestion" });
  if (!env.PUBLISH_TO_ATPROTO) {
    logger.warn("PUBLISH_TO_ATPROTO off, not running ingester");
    return;
  }
  const jetstream = new Jetstream({
    wantedCollections: DESIRED_COLLECTIONS,
    wantedDids: [env.SVC_ACT_DID],
    cursor: new Date("2024-12-22").getTime(),
  });

  jetstream.onCreate(COM_ATPROTO_LABEL, async (evt) => {
    if (
      isLabel(evt.commit.record) &&
      validateLabel(evt.commit.record).success
    ) {
      saveEvent(db, evt);
    }
  });
  jetstream.onUpdate(COM_ATPROTO_LABEL, async (evt) => {
    saveEvent(db, evt);
  });
  jetstream.onDelete(COM_ATPROTO_LABEL, async (evt) => {
    await db
      .deleteFrom("labels")
      .where("uri", "=", evt.commit.rkey.toString())
      .execute();
  });
  return jetstream;
}

async function saveEvent(
  db: Database,
  evt:
    | CommitCreateEvent<"com.atproto.label.defs#label">
    | CommitUpdateEvent<"com.atproto.label.defs#label">
) {
  const record: Label = evt.commit.record as unknown as Label;
  const now = new Date();
  await db
    .insertInto("labels")
    .values({
      uri: evt.commit.rkey.toString(), // is this right?
      src: evt.did,
      val: record.val,
      subject: record.uri,
      createdAt: record.cts,
      indexedAt: now.toISOString(),
    })
    .onConflict((oc) =>
      oc.column("uri").doUpdateSet({
        val: record.val,
        subject: record.uri,
        indexedAt: now.toISOString(),
      })
    )
    .execute();
}
