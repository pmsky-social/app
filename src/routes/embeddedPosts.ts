import { html, page } from "#/lib/view";
import { embeddedPost } from "#/views/components/postEmbed";
import { AppContext } from "..";
import { ContextualHandler } from "./ContextualHandler";

// todo: cache post embed
export class PostEmbeddedPost extends ContextualHandler {
  constructor(ctx: AppContext) {
    super(ctx, async (req, res) => {
      const { subject } = req.body;
      const url: string = subject;

      if (!url) {
        return res.status(400).json({ error: "Missing 'url' in request body" });
      }

      try {
        const postfragment = await embeddedPost(ctx.db, url);
        res.send(page(postfragment));
      } catch (err) {
        ctx.logger.error("Error fetching oEmbed:", err);
        res.status(500).json({ error: "Failed to fetch oEmbed data" });
      }
    });
  }
}
