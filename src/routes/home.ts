import type { Agent } from "@atproto/api";
import * as Profile from "#/lexicon/types/app/bsky/actor/profile";
import { page } from "#/lib/view";
import { FeedProposal, feedProposalFromDB } from "#/views/pages/home";
import { home } from "#/views/pages/home";
import type { AppContext } from "..";
import { ContextualHandler } from "./ContextualHandler";
import { getSessionAgent } from "./util";
import { VoteRepository } from "#/db/repos/voteRepository";
import { Proposal, ProposalType } from "#/db/types";
import { sql } from "kysely";

export class GetHomePage extends ContextualHandler {
  constructor(ctx: AppContext) {
    super(ctx, async (req, res) => {
      ctx.logger.trace("home page requested");
      // If the user is signed in, get an agent which communicates with their server
      const agent = await getSessionAgent(req, res, ctx);
      if (!agent) return res.redirect("/login");
      ctx.logger.trace("got agent");

      // Fetch data stored in our SQLite
      const isMeta = req.query.meta === "true";
      ctx.logger.trace(isMeta, "isMeta");
      const type = isMeta ? ProposalType.ALLOWED_USER : ProposalType.POST_LABEL;
      const proposals: FeedProposal[] = await this.getProposals(agent, type);

      // Map user DIDs to their domain-name handles
      // get dids for posts with labels
      // const didHandleMap = await ctx.resolver.resolveDidsToHandles(
      //   labels.map((s) => s.authorDid)
      // );

      // Fetch additional information about the logged-in user
      // const { data: profileRecord } = await agent.com.atproto.repo.getRecord({
      //   repo: agent.assertDid,
      //   collection: "app.bsky.actor.profile",
      //   rkey: "self",
      // });

      // const profile =
      //   Profile.isRecord(profileRecord.value) &&
      //   Profile.validateRecord(profileRecord.value).success
      //     ? profileRecord.value
      //     : {};

      // Serve the logged-in view
      return res.type("html").send(page(home({ proposals, isMeta })));
    });
  }

  async getProposals(
    agent: Agent,
    proposalType: ProposalType = ProposalType.POST_LABEL
  ): Promise<FeedProposal[]> {
    return await this.ctx.db
      .selectFrom("proposals as p")
      .where("type", "=", proposalType)
      .whereRef("p.createdAt", ">=", sql`date('now', '-1 day')`)
      .orderBy("p.createdAt", "desc")
      .leftJoin("posts", "posts.uri", "p.subject")
      .leftJoin("proposal_votes", "proposal_votes.subject", "p.uri")
      .leftJoin("user_votes", "user_votes.subject", "p.uri")
      .where("user_votes.src", "=", agent.assertDid)
      .groupBy("p.uri")
      .limit(10)
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
        throw new Error(e);
      });
  }
}
