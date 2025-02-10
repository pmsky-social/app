import type { Agent } from "@atproto/api";
import * as Profile from "#/lexicon/types/app/bsky/actor/profile";
import { page } from "#/lib/view";
import { HomepageLabel, homepageLabelFromDB } from "#/views/pages/home";
import { home } from "#/views/pages/home";
import type { AppContext } from "..";
import { ContextualHandler } from "./ContextualHandler";
import { getSessionAgent } from "./util";
import { VoteRepository } from "#/db/repos/voteRepository";
import { Proposal } from "#/db/types";

export class GetHomePage extends ContextualHandler {
  constructor(ctx: AppContext) {
    super(ctx, async (req, res) => {
      ctx.logger.trace("home page requested");
      // If the user is signed in, get an agent which communicates with their server
      const agent = await getSessionAgent(req, res, ctx);
      if (!agent) return res.redirect("/login");
      ctx.logger.trace("got agent");

      // Fetch data stored in our SQLite
      const labels: HomepageLabel[] = await this.getLabels(agent);

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
            labels,
            // didHandleMap,
            profile,
          })
        )
      );
    });
  }

  async getLabels(agent: Agent): Promise<HomepageLabel[]> {
    const labels = await this.ctx.db
      .selectFrom("proposals")
      .selectAll()
      .orderBy("indexedAt", "desc")
      .limit(10)
      .execute()
      .then((rows) => rows.map((r) => Proposal.fromDB(r)));

    const labelUris = labels.map(
      (l) => `at://${l.src}/social.pmsky.label/${l.rkey}`
    );

    const embeds = await this.ctx.db
      .selectFrom("posts")
      .selectAll()
      .where("uri", "in", labelUris)
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

    this.ctx.logger.trace(labelUris, "fetched labels for route /home");
    const alreadyVoted = await this.ctx.db
      .selectFrom("user_votes")
      .select("subject")
      .where("src", "=", agent.assertDid)
      .where("subject", "in", labelUris)
      .execute();

    // this.ctx.logger.trace(
    //   alreadyVoted,
    //   "fetched which votes already happened for route /home"
    // );

    const scores = await new VoteRepository(
      this.ctx.db,
      this.ctx.logger
    ).getLabelScores(labelUris);

    // this.ctx.logger.trace(scores, "fetched scores for labels");
    return await Promise.all(
      labels.map(
        async (l) =>
          await homepageLabelFromDB(
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
