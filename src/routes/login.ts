import { OAuthResolverError } from "@atproto/oauth-client-node";
import { isValidHandle } from "@atproto/syntax";
import { page } from "#/lib/view";
import { login } from "#/pages/login";
import type { AppContext } from "..";
import { ContextualHandler } from "./ContextualHandler";
import { getSession } from "./util";

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
      if (!isWhitelistedHandle(handle)) {
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

function isWhitelistedHandle(handle: string) {
  const whitelistedHandles = [
    "drewmca.dev",
    "pmsky.social",
    "alliejorlin.bsky.social",
    "ntnsndr.in",
  ];
  return whitelistedHandles.includes(handle);
}
