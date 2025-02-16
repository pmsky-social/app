import { OAuthResolverError } from "@atproto/oauth-client-node";
import { isValidHandle } from "@atproto/syntax";
import { page } from "#/lib/view";
import { login } from "#/views/pages/login";
import type { AppContext } from "..";
import { ContextualHandler } from "./ContextualHandler";
import { getSession } from "./util";
import { AllowedUsersRepository } from "#/db/repos/allowedUsersRepository";

export class GetLogin extends ContextualHandler {
  constructor(ctx: AppContext) {
    super(ctx, async (_req, res) => {
      return res.type("html").send(page(login({})));
    });
  }
}

export class PostLogin extends ContextualHandler {
  constructor(ctx: AppContext) {
    super(ctx, async (req, res) => {
      // Validate
      const handle = req.body?.handle;
      if (typeof handle !== "string" || !isValidHandle(handle)) {
        return res.type("html").send(page(login({ error: "invalid handle" })));
      }
      const did = await ctx.atSvcAct.resolveHandle(handle);
      if (handle !== "drewmca.dev" && !(await isWhitelisted(ctx, did))) {
        return res
          .type("html")
          .send(page(login({ error: "unauthorized handle" })));
      }
      // Initiate the OAuth flow
      try {
        const url = await ctx.oauthClient.authorize(handle, {
          scope: "atproto transition:generic",
        });
        ctx.logger.debug({ url }, "oauth client authorized, redirecting...");
        return res.redirect(url.toString());
      } catch (err) {
        ctx.logger.error({ err }, "oauth authorize failed");
        return res.type("html").send(
          page(
            login({
              error:
                err instanceof OAuthResolverError
                  ? err.message
                  : "couldn't initiate login",
            })
          )
        );
      }
    });
  }
}

export class PostLogout extends ContextualHandler {
  constructor(ctx: AppContext) {
    super(ctx, async (req, res) => {
      const session = await getSession(req, res);
      await session.destroy();
      return res.redirect("/");
    });
  }
}

async function isWhitelisted(ctx: AppContext, did: string) {
  const repo = new AllowedUsersRepository(ctx);
  const whitelistedDids = await repo.getWhitelistedDids();
  ctx.logger.trace("whitelisted handles {whitelistedHandles}", whitelistedDids);
  return whitelistedDids.includes(did);
}
