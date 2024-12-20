import * as Profile from "#/lexicon/types/app/bsky/actor/profile";
import { page } from "#/lib/view";
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
      const labels = await ctx.db
        .selectFrom("labels")
        .selectAll()
        .orderBy("indexedAt", "desc")
        .limit(10)
        .execute();

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
}
