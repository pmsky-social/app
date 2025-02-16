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
      const { data: profileRecord } = await agent.com.atproto.repo.getRecord({
        repo: agent.assertDid,
        collection: "app.bsky.actor.profile",
        rkey: "self",
      });

      const profile =
        Profile.isRecord(profileRecord.value) &&
        Profile.validateRecord(profileRecord.value).success
          ? profileRecord.value
          : {};

      // Serve the logged-in view
      return res.type("html").send(
        page(
          home({
            proposals,
            // didHandleMap,
            profile,
            isMeta,
          })
        )
      );
    });
  }

  async getProposals(
    agent: Agent,
    proposalType: ProposalType = ProposalType.POST_LABEL
  ): Promise<FeedProposal[]> {
    const proposals = await this.ctx.db
      .selectFrom("proposals")
      .selectAll()
      .where("type", "=", proposalType)
      .orderBy("indexedAt", "desc")
      .limit(10)
      .execute()
      .then((rows) => rows.map((r) => Proposal.fromDB(r)));

    const uris = proposals.map(
      (l) => `at://${l.src}/social.pmsky.label/${l.rkey}`
    );

    const embeds = await this.ctx.db
      .selectFrom("posts")
      .selectAll()
      .where("uri", "in", uris)
      .execute()
      .then((rows) =>
        rows.reduce(
          (acc, row) => {
            acc[row.uri] = row.embed;
            return acc;
          },
          {} as Record<string, string>
        )
      );

    this.ctx.logger.trace(uris, "fetched proposals for route /home");
    const alreadyVoted = await this.ctx.db
      .selectFrom("user_votes")
      .select("subject")
      .where("src", "=", agent.assertDid)
      .where("subject", "in", uris)
      .execute();

    // this.ctx.logger.trace(
    //   alreadyVoted,
    //   "fetched which votes already happened for route /home"
    // );

    const scores = await new VoteRepository(
      this.ctx.db,
      this.ctx.logger
    ).getLabelScores(uris);

    // this.ctx.logger.trace(scores, "fetched scores for labels");
    return await Promise.all(
      proposals.map(
        async (l) =>
          await feedProposalFromDB(
            l,
            embeds[l.subject],
            alreadyVoted,
            scores,
            this.ctx
          )
      )
    );
  }
}
