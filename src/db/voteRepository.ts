import type { Database } from "./db";
import { Logger } from "pino";

export class VoteRepository {
  constructor(
    private db: Database,
    private logger: Logger
  ) {}

  async userVotedAlready(userDid: string, labelUri: string): Promise<boolean> {
    return (
      (await this.db
        .selectFrom("user_votes")
        .selectAll()
        .where("src", "=", userDid)
        .where("subject", "=", labelUri)
        .executeTakeFirst()) !== undefined
    );
  }

  async getLabelScore(uri: string): Promise<number> {
    this.logger.trace(uri, `getting score for label: ${uri}`);
    const votes = await this.db
      .selectFrom("label_votes")
      .select("val")
      .where("subject", "=", uri)
      .execute();
    const score = votes.reduce((acc, vote) => acc + vote.val, 0);
    this.logger.trace(`score: ${score}`);
    return score;
  }

  async getLabelScores(uris: string[]): Promise<{ [uri: string]: number }> {
    const votes = await this.db
      .selectFrom("label_votes")
      .select(["subject", "val"])
      .where("subject", "in", uris)
      .execute();
    const scores: { [uri: string]: number } = {};
    votes.forEach((vote) => {
      if (scores[vote.subject]) {
        scores[vote.subject] += vote.val;
      } else {
        scores[vote.subject] = vote.val;
      }
    });
    return scores;
  }

  async saveVote(
    userDid: string,
    labelUri: string,
    vote: 1 | -1,
    voteRecordUri: string,
    createdAt: string
  ) {
    await Promise.all([
      this.saveUserVote(userDid, labelUri, createdAt),
      this.saveLabelVote(labelUri, vote, voteRecordUri, createdAt),
    ]);
  }

  private async saveUserVote(
    userDid: string,
    labelUri: string,
    createdAt: string
  ): Promise<void> {
    await this.db
      .insertInto("user_votes")
      .values({
        src: userDid,
        subject: labelUri,
        createdAt,
        indexedAt: new Date().toISOString(),
      })
      .execute();
  }

  private async saveLabelVote(
    labelUri: string,
    vote: 1 | -1,
    voteRecordUri: string,
    createdAt: string
  ): Promise<void> {
    await this.db
      .insertInto("label_votes")
      .values({
        uri: voteRecordUri,
        subject: labelUri,
        val: vote,
        createdAt,
        indexedAt: new Date().toISOString(),
      })
      .execute();
  }
}
