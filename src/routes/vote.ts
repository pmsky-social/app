import { voting } from "#/views/components/labelCard";
import type { AppContext } from "..";
import { ContextualHandler } from "./ContextualHandler";
import { getSessionAgent } from "./util";

export class PostVote extends ContextualHandler {
  constructor(ctx: AppContext) {
    super(ctx, async (req, res) => {
      const agent = await getSessionAgent(req, res, ctx);
      if (!agent || !agent.did) {
        ctx.logger.warn("no agent, user not logged in attempted to vote");
        return res.sendStatus(403);
      }

      const { direction, uri, prevScore } = req.body;
      if (direction !== "up" && direction !== "down") {
        ctx.logger.warn({ direction }, "invalid vote direction");
        return res.status(400);
      }

      let score;
      try {
        score = parseInt(prevScore);
      } catch (err) {
        ctx.logger.warn({ err }, "invalid prevScore");
        return res.status(400);
      }

      const vote = direction === "up" ? 1 : -1;
      try {
        await ctx.atSvcAct.publishVote(vote, uri, agent.did);
      } catch (err) {
        // todo: handle proposal not found and already voted errors diff
        ctx.logger.error({ err }, "publish vote failed");
        return res.status(500).send(err);
      }
      score += vote;
      return res.send(voting(uri, true, score).toDOM().toString());
    });
  }
}
