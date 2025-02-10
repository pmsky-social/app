import type { Database } from "#/db/migrations";
import { ProposalType, type Proposal } from "#/db/types";

export class LabelRepository {
  constructor(private db: Database) {}

  async getLabel(rkey: string): Promise<Proposal | undefined> {
    return await this.db
      .selectFrom("proposals")
      .selectAll()
      .where("rkey", "=", rkey)
      .where("type", "=", ProposalType.POST_LABEL)
      .executeTakeFirst();
  }
}
