import type { Database, Label } from "./db";

export class LabelRepository {
  constructor(private db: Database) {}

  async getLabel(rkey: string): Promise<Label | undefined> {
    return await this.db
      .selectFrom("labels")
      .selectAll()
      .where("rkey", "=", rkey)
      .executeTakeFirst();
  }
}
