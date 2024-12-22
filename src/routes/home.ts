import type { Agent } from "@atproto/api";
import * as Profile from "#/lexicon/types/app/bsky/actor/profile";
import { page } from "#/lib/view";
import type { HomepageLabel } from "#/pages/home";
import { home } from "#/pages/home";
import type { AppContext } from "..";
import { ContextualHandler } from "./ContextualHandler";
import { getSessionAgent } from "./util";

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
      .selectFrom("labels")
      .selectAll()
      .orderBy("indexedAt", "desc")
      .limit(10)
      .execute();

    const labelUris = labels.map((s) => s.uri);
    this.ctx.logger.trace(labelUris, "fetched labels for route /home");
    const alreadyVoted = await this.ctx.db
      .selectFrom("votes")
      .selectAll()
      .where("src", "=", agent.assertDid)
      .where("subject", "in", labelUris)
      .execute();

    this.ctx.logger.trace(
      alreadyVoted,
      "fetched which votes already happened for route /home"
    );

    return labels.map((l) => {
      return {
        uri: l.uri,
        val: l.val,
        subject: l.subject,
        voted: alreadyVoted.some((v) => v.subject === l.uri),
        createdAt: l.createdAt,
        indexedAt: l.indexedAt,
      };
    });
  }
}
