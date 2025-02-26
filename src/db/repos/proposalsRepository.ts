import { AppContext } from "#/index";
import { FeedProposal, feedProposalFromDB } from "#/views/pages/home";
import { sql } from "kysely";
import { ProposalType } from "../types";

export class ProposalsRepository {
  constructor(private ctx: AppContext) {}

  async getProposals(
    userDid: string,
    proposalType: ProposalType = ProposalType.POST_LABEL,
    pageSize: number = 10,
    page: number = 0
  ): Promise<FeedProposal[]> {
    const offset = page * pageSize;
    return await this.ctx.db
      .selectFrom("proposals as p")
      .where("type", "=", proposalType)
      .orderBy("p.createdAt", "desc")
      .leftJoin("posts", "posts.uri", "p.subject")
      .leftJoin("proposal_votes", "proposal_votes.subject", "p.uri")
      .leftJoin("user_votes", "user_votes.subject", "p.uri")
      .where((eb) =>
        eb.or([
          eb("user_votes.src", "=", userDid),
          eb("user_votes.src", "is", null),
        ])
      )
      .groupBy("p.uri")
      .limit(pageSize)
      .offset(offset)
      .select((eb) => [
        "p.rkey",
        "p.src",
        "p.subject",
        "p.type",
        "p.uri",
        "p.val",
        "p.createdAt",
        "p.indexedAt",
        "p.indexedBy",
        "posts.embed",
        sql<number>`SUM(${sql.ref("proposal_votes.val")})`.as("score"),
        sql<boolean>`case when ${sql.ref("user_votes.src")} is null then false else true end`.as(
          "alreadyVoted"
        ),
      ])
      .execute()
      .then(
        async (rows) =>
          await Promise.all(
            rows.map((row) => feedProposalFromDB(row, this.ctx))
          )
      )
      .catch((e) => {
        this.ctx.logger.error(e, "Error fetching proposals!");
        throw e;
      });
  }
}
