import { Database } from "../migrations";

export class AllowedUsersRepository {
  constructor(private db: Database) {}

  getWhitelistedHandles() {
    return this.db
      .selectFrom("allowed_users")
      .selectAll()
      .execute()
      .then((rows) => rows.map((row) => row.handle));
  }
}
