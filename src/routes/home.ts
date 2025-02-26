import { page } from "#/lib/view";
import { FeedProposal } from "#/views/pages/home";
import { home } from "#/views/pages/home";
import type { AppContext } from "..";
import { ContextualHandler } from "./ContextualHandler";
import { getSessionAgent } from "./util";
import { ProposalType } from "#/db/types";
import { ProposalsRepository } from "#/db/repos/proposalsRepository";

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
      // @ts-ignore
      let pageNumber = req.query.page ? parseInt(req.query.page) : 0;
      if (pageNumber < 0) pageNumber = 0;
      const pageSize = 10;
      const type = isMeta ? ProposalType.ALLOWED_USER : ProposalType.POST_LABEL;
      let proposals: FeedProposal[] = await new ProposalsRepository(
        ctx
      ).getProposals(agent.assertDid, type, pageSize, pageNumber);

      if (pageNumber > 0 && proposals.length == 0) {
        pageNumber--;
        proposals = await new ProposalsRepository(ctx).getProposals(
          agent.assertDid,
          type,
          pageSize,
          pageNumber
        );
      }

      const pageInfo = {
        current: pageNumber,
        hasPrev: pageNumber > 0,
        hasNext: proposals.length == pageSize,
      };
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
      return res
        .type("html")
        .send(page(home({ proposals, isMeta, pages: pageInfo })));
    });
  }
}
