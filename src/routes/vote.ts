import { voting } from "#/views/components/labelCard";
import type { AppContext } from "..";
import { ContextualHandler } from "./ContextualHandler";
import { getSessionAgent } from "./util";

export class PostVote extends ContextualHandler {
  constructor(ctx: AppContext) {
    super(ctx, async (req, res) => {
      ctx.logger.info(req.body, "got request to POST /vote");
      const agent = await getSessionAgent(req, res, ctx);
      if (!agent || !agent.did) return res.sendStatus(403);

      const { direction, uri, prevScore } = req.body;
      if (direction !== "up" && direction !== "down") res.status(400);

      const vote = direction === "up" ? 1 : -1;
      try {
        await ctx.atSvcAct.publishVote(vote, uri, agent.did);
      } catch (err) {
        ctx.logger.error({ err }, "publish vote failed");
        return res.status(500).send(err);
      }
      const score = prevScore + vote;
      res.send(voting(uri, true, score).toDOM().toString());
    });
  }
}
