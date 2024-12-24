import { html } from "#/lib/view";
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
        const response = await fetch(
          `https://embed.bsky.app/oembed?url=${encodeURIComponent(url)}`
        );

        if (!response.ok) {
          ctx.logger.error(response, "Failed to fetch oEmbed:");
          throw new Error(`Failed to fetch oEmbed: ${response.statusText}`);
        }

        const oembedData = await response.json();
        res.send(oembedData.html);
      } catch (error) {
        ctx.logger.error("Error fetching oEmbed:", error);
        res.status(500).json({ error: "Failed to fetch oEmbed data" });
      }
    });
  }
}
