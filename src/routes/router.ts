import path from "node:path";
import express from "express";
import type { AppContext } from "#/index";
import type { ContextualHandler } from "./ContextualHandler";
import { GetHomePage } from "./home";
import { GetLabel, GetLabelsCreate, PostLabel } from "./labels";
import { GetLogin, PostLogin, PostLogout } from "./login";
import { GetClientMetadata, GetOauthCallback } from "./oauth";
import { PostVote } from "./vote";

// Helper function for defining routes
const handler =
  (fn: ContextualHandler) =>
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      await fn.call(req, res, next);
    } catch (err) {
      next(err);
    }
  };

export const createRouter = (ctx: AppContext) => {
  const router = express.Router();

  // Static assets
  router.use(
    "/public",
    express.static(path.join(__dirname, "..", "public")) // TODO: fix path to not need ".."
  );

  router.get("/client-metadata.json", handler(new GetClientMetadata(ctx)));
  router.get("/oauth/callback", handler(new GetOauthCallback(ctx)));
  router.get("/login", handler(new GetLogin(ctx)));
  router.post("/login", handler(new PostLogin(ctx)));
  router.post("/logout", handler(new PostLogout(ctx)));
  router.get("/labels/create", handler(new GetLabelsCreate(ctx)));
  router.get("/label/:uri", handler(new GetLabel(ctx)));
  router.post("/label", handler(new PostLabel(ctx)));
  router.post("/vote", handler(new PostVote(ctx)));
  router.get("/", handler(new GetHomePage(ctx)));

  return router;
};
