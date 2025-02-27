import {
  EmbedNotAuthorized,
  FetchEmbedBadResponse,
  PostNotFound,
} from "#/error";
import { AppContext } from "#/index";
import { html } from "#/lib/view";

export async function embeddedPost(ctx: AppContext, uri: string) {
  const postId = uri.split("/").pop();
  if (!postId) return html`<p>Invalid post URI: ${uri}</p>`;
  const elId = `post-embed-${postId}`;
  const embedded = await getCachedPostEmbed(ctx, uri);
  return html` <div id="${elId}" class="post-embed">${embedded}</div> `;
}

function bskyUrl(atUri: string) {
  const pieces = atUri.split("/");
  const author = pieces[2];
  const postId = pieces[4];
  if (!author || !postId) throw new Error("Invalid bsky post URI");
  return `https://bsky.app/profile/${author}/post/${postId}`;
}

export async function getCachedPostEmbed(ctx: AppContext, uri: string) {
  ctx.logger.trace("checking for cached embed");
  const cached = await ctx.db
    .selectFrom("posts")
    .select("embed")
    .where("uri", "=", uri)
    .executeTakeFirst();

  // @ts-ignore
  if (cached) return html([cached.embed]);

  return await fetchAndCachePostEmbed(ctx, uri);
}

async function fetchAndCachePostEmbed(ctx: AppContext, uri: string) {
  try {
    const embed = await getPostEmbed(ctx, uri);
    await ctx.db
      .insertInto("posts")
      .values({ uri, embed })
      .onConflict((oc) => oc.column("uri").doUpdateSet({ embed }))
      .execute();

    // @ts-ignore
    return html([embed]);
  } catch (e) {
    if (e instanceof PostNotFound) {
      return html`<p class="error visible">Post not found: ${uri}</p>`;
    }
    if (e instanceof EmbedNotAuthorized) {
      const href = bskyUrl(uri);
      return html`<p class="warn visible">
        Embed not authorized to logged-out users, but labels can still be
        proposed and voted on.
        <a href="${href}" target="_blank">View the original post on bsky.</a>
      </p>`;
    }
    ctx.logger.error(e, "Failed getting or caching post embed");
    return html`<p class="error visible">Failed to load post embed: ${e}</p>`;
  }
}

async function getPostEmbed(ctx: AppContext, uri: string) {
  const url = uri.startsWith("at://") ? bskyUrl(uri) : uri;
  ctx.logger.trace("fetching embed for url: ", url);
  const response = await fetch(
    `https://embed.bsky.app/oembed?url=${encodeURIComponent(url)}`
  );
  if (!response.ok) {
    if (response.status === 403) {
      throw new EmbedNotAuthorized(uri);
    }
    if (response.status === 404) {
      throw new PostNotFound(uri);
    }
    ctx.logger.error({ res: response }, "Failed to fetch embed");
    throw new FetchEmbedBadResponse(response);
  }
  const json = await response.json();
  ctx.logger.trace("got embed for url: ", url);
  return json.html as string;
}
