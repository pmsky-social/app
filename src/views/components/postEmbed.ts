import { Database } from "#/db/migrations";
import { html } from "#/lib/view";
import { env } from "node:process";
import pino from "pino";

export async function embeddedPost(db: Database, uri: string) {
  const postId = uri.split("/").pop();
  if (!postId) return html`<p>Invalid post URI: ${uri}</p>`;
  const elId = `post-embed-${postId}`;
  const embedded = await getCachedPostEmbed(db, uri);
  return html` <div id="${elId}" class="post-embed">${embedded}</div> `;
}

function bskyUrl(atUri: string) {
  console.log("atUri: ", atUri);
  const pieces = atUri.split("/");
  const author = pieces[2];
  const postId = pieces[4];
  if (!author || !postId) throw new Error("Invalid bsky post URI");
  return `https://bsky.app/profile/${author}/post/${postId}`;
}

async function getCachedPostEmbed(db: Database, uri: string) {
  console.log("checking for cached embed");
  const cached = await db
    .selectFrom("posts")
    .select("embed")
    .where("uri", "=", uri)
    .executeTakeFirst();

  // @ts-ignore
  if (cached) return html([cached.embed]);

  return await fetchAndCachePostEmbed(db, uri);
}

export async function fetchAndCachePostEmbed(db: Database, uri: string) {
  const logger = pino({ name: "postEmbed", level: env.LOG_LEVEL });
  try {
    const embed = await getPostEmbed(uri);
    await db
      .updateTable("posts")
      .where("uri", "=", uri)
      .set("embed", embed)
      .execute();

    // @ts-ignore
    return html([embed]);
  } catch (e) {
    logger.error(e);
    return html`<p>Failed to load post embed</p>`;
  }
}

async function getPostEmbed(uri: string) {
  const url = uri.startsWith("at://") ? bskyUrl(uri) : uri;
  console.log("fetching embed for url: ", url);
  const response = await fetch(
    `https://embed.bsky.app/oembed?url=${encodeURIComponent(url)}`
  );
  if (!response.ok) throw new Error("Failed to fetch embed");
  const json = await response.json();
  console.log("got embeddded post");
  return json.html as string;
}
