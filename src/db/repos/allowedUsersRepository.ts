import { Database } from "../migrations";

export class AllowedUsersRepository {
  constructor(private db: Database) {}

  async getWhitelistedHandles() {
    return this.db
      .selectFrom("allowed_users")
      .selectAll()
      .execute()
      .then((rows) => rows.map((row) => row.handle));
  }
}
