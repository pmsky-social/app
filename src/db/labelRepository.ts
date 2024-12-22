import type { Database, Label } from "./db";

export class LabelRepository {
  constructor(private db: Database) {}

  async getLabel(uri: string): Promise<Label | undefined> {
    return await this.db
      .selectFrom("labels")
      .selectAll()
      .where("uri", "=", uri)
      .executeTakeFirst();
  }
}
