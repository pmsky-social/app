import { sql } from "kysely";
import type { AppContext } from "#/index";
import { type FeedProposal, feedProposalFromDB } from "#/views/pages/home";
import type { Proposal, ProposalType } from "../types";

export class ProposalsRepository {
	constructor(private ctx: AppContext) {}

	async getProposal(rkey: string): Promise<Proposal | undefined> {
		return await this.ctx.db
			.selectFrom("proposals")
			.selectAll()
			.where("rkey", "=", rkey)
			.executeTakeFirst();
	}

	async getHydratedProposal(
		userDid: string,
		rkey: string,
	): Promise<FeedProposal | undefined> {
		const proposals = await this.getProposals(userDid, undefined, 1, 0, rkey);
		if (proposals.length !== 1) {
			this.ctx.logger.warn({ proposals, rkey }, "expected 1 proposal for rkey");
		}
		return proposals[0];
	}

	async getProposals(
		userDid: string,
		proposalType: ProposalType | undefined,
		pageSize = 10,
		page = 0,
		rkey?: string | undefined,
	): Promise<FeedProposal[]> {
		const offset = page * pageSize;
		let query = this.ctx.db
			.selectFrom("proposals as p")
			.orderBy("p.createdAt", "desc")
			.leftJoin("posts", "posts.uri", "p.subject")
			.leftJoin("proposal_votes", "proposal_votes.subject", "p.uri")
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
				sql<boolean>`
        CASE WHEN EXISTS (
          SELECT 1 FROM user_votes uv 
          WHERE uv.subject = p.uri 
            AND uv.src = ${userDid}
        ) THEN true ELSE false END
      `.as("alreadyVoted"),
			]);

		if (proposalType) {
			query = query.where("p.type", "=", proposalType);
		}
		if (rkey) {
			query = query.where("p.rkey", "=", rkey);
		}

		return await query
			.execute()
			.then(
				async (rows) =>
					await Promise.all(
						rows.map((row) => feedProposalFromDB(row, this.ctx)),
					),
			)
			.catch((e) => {
				this.ctx.logger.error(e, "Error fetching proposals!");
				throw e;
			});
	}
}
