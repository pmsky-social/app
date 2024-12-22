import type { Database } from "./db";

export class VoteRepository {
  constructor(private db: Database) {}

  async userVotedAlready(userDid: string, labelUri: string): Promise<boolean> {
    return (
      (await this.db
        .selectFrom("votes")
        .selectAll()
        .where("src", "=", userDid)
        .where("subject", "=", labelUri)
        .executeTakeFirst()) !== undefined
    );
  }
}
