import { TID } from "@atproto/common";
import { Database } from "../migrations";
import { Proposal, ProposalType } from "../types";
import { sql } from "kysely";
import { AtprotoServiceAccount } from "#/serviceAccount";
import { AppContext } from "#/index";

export class AllowedUsersRepository {
  constructor(private ctx: AppContext) {}

  async getWhitelistedDids() {
    return await this.ctx.db
      .selectFrom("proposals as p")
      .leftJoin("proposal_votes as pv", "pv.subject", "p.rkey")
      .select("p.subject")
      .groupBy("p.subject")
      .having(sql`SUM(${sql.ref("pv.val")})`, ">", 0)
      .execute()
      .then((rows) => rows.map((row) => row.subject));
  }

  async getProposalByUser(did: string) {
    return await this.ctx.db
      .selectFrom("proposals")
      .selectAll()
      .where("type", "=", ProposalType.ALLOWED_USER)
      .where("subject", "=", did)
      .executeTakeFirst()
      .then((row) => (row ? Proposal.fromDB(row) : undefined));
  }

  async proposeAllowUser(did: string) {
    const rkey = TID.nextStr();
    await this.ctx.db
      .insertInto("proposals")
      .values(
        new Proposal(
          rkey,
          this.ctx.atSvcAct.did(),
          ProposalType.ALLOWED_USER,
          "Whitelist?",
          did,
          new Date().toISOString(),
          new Date().toISOString(),
          "allowedUsersRepository.proposeAllowUser"
        )
      )
      .execute();
    return rkey;
  }
}
