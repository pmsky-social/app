import type { IncomingMessage, ServerResponse } from "node:http";
import { Agent } from "@atproto/api";
import { getIronSession } from "iron-session";
import type { AppContext } from "#/index";
import { env } from "#/lib/env";

export type Session = { did: string };

export function getSession(
	req: IncomingMessage,
	res: ServerResponse<IncomingMessage>,
) {
	return getIronSession<Session>(req, res, {
		cookieName: "sid",
		password: env.COOKIE_SECRET,
		cookieOptions: {
			secure: env.NODE_ENV === "production",
		},
	});
}

// Helper function to get the Atproto Agent for the active session
export async function getSessionAgent(
	req: IncomingMessage,
	res: ServerResponse<IncomingMessage>,
	ctx: AppContext,
) {
	ctx.logger.debug("getting session agent from cookie sid");
	const session = await getSession(req, res);
	ctx.logger.debug("got session");
	if (!session.did) return null;
	try {
		const oauthSession = await ctx.oauthClient.restore(session.did);
		return oauthSession ? new Agent(oauthSession) : null;
	} catch (err) {
		ctx.logger.warn({ err }, "oauth restore failed");
		await session.destroy();
		return null;
	}
}
