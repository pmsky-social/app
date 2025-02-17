import assert from "node:assert";
import type { AppContext } from "..";
import { ContextualHandler } from "./ContextualHandler";
import { getSession } from "./util";

export class GetClientMetadata extends ContextualHandler {
  constructor(ctx: AppContext) {
    super(ctx, (req, res, next) => res.json(ctx.oauthClient.clientMetadata));
  }
}

export class GetOauthCallback extends ContextualHandler {
  constructor(ctx: AppContext) {
    super(ctx, async (req, res) => {
      ctx.logger.trace("oauth callback received");
      const params = new URLSearchParams(req.originalUrl.split("?")[1]);
      try {
        const { session } = await ctx.oauthClient.callback(params);
        const clientSession = await getSession(req, res);
        assert(session.did, "no did in session");
        assert(!clientSession.did, "session already exists");
        clientSession.did = session.did;
        await clientSession.save();
      } catch (err) {
        ctx.logger.error({ err }, "oauth callback failed");
        return res.redirect("/?error");
      }
      return res.redirect("/");
    });
  }
}
