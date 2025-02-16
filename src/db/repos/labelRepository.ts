import type { Database } from "#/db/migrations";
import { ProposalType, type Proposal } from "#/db/types";

export class LabelRepository {
  constructor(private db: Database) {}

  async getProposal(rkey: string): Promise<Proposal | undefined> {
    return await this.db
      .selectFrom("proposals")
      .selectAll()
      .where("rkey", "=", rkey)
      .executeTakeFirst();
  }
}
