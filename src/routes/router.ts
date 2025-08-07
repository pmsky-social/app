import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import type { AppContext } from "#/index";
import type { ContextualHandler } from "./ContextualHandler";
import { PostEmbeddedPost } from "./embeddedPosts";
import { GetHomePage } from "./home";
import { GetProposal, PostProposal } from "./labels";
import { GetLogin, PostLogin, PostLogout } from "./login";
import { GetClientMetadata, GetOauthCallback } from "./oauth";
import { GetCreate } from "./proposals";
import { PostVote } from "./vote";

// Helper function for defining routes
const handler =
	(fn: ContextualHandler) =>
	async (
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => {
		try {
			await fn.call(req, res, next);
		} catch (err) {
			next(err);
		}
	};

export const createRouter = (ctx: AppContext) => {
	const router = express.Router();

	router.get("/client-metadata.json", handler(new GetClientMetadata(ctx)));
	router.get("/oauth/callback", handler(new GetOauthCallback(ctx)));
	router.post("/api/embedPost", handler(new PostEmbeddedPost(ctx)));
	router.get("/login", handler(new GetLogin(ctx)));
	router.post("/login", handler(new PostLogin(ctx)));
	router.post("/logout", handler(new PostLogout(ctx)));
	router.get("/proposals/create", handler(new GetCreate(ctx)));
	router.get("/proposal/:rkey", handler(new GetProposal(ctx)));
	router.post("/proposal", handler(new PostProposal(ctx)));
	router.post("/vote", handler(new PostVote(ctx)));
	router.get("/", handler(new GetHomePage(ctx)));

	return router;
};
