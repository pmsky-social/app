import type { AppContext } from "..";
import { ContextualHandler } from "./ContextualHandler";

export class PostVote extends ContextualHandler {
  constructor(ctx: AppContext) {
    super(ctx, async (req, res) => {
      ctx.logger.info(req.params, "got request to POST /vote");
      const { direction, labelUri } = req.params;
      if (direction !== "up" && direction !== "down") {
        res.status(400);
      }
      const vote = direction === "up" ? 1 : -1;
      const userDid = "did"; // todo: get user agent's did
      await ctx.atSvcAct.publishVote(vote, labelUri, userDid);
    });
  }
}
