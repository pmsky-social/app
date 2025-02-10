import { labelCard } from "#/views/components/labelCard";
import { getCachedPostEmbed } from "#/views/components/postEmbed";
import { Database } from "#/db/migrations";
import { Hole, html } from "#/lib/view";
import { shell } from "./shell";
import { Proposal } from "#/db/types";
import { AppContext } from "#/index";

export type HomepageLabel = {
  uri: string;
  val: string;
  subject: string;
  voted: boolean;
  score: number;
  embed: Hole;
  createdAt: string;
  indexedAt: string;
};

export async function homepageLabelFromDB(
  l: Proposal,
  embed: string | undefined,
  alreadyVoted: { subject: string }[],
  scores: { [uri: string]: number },
  ctx: AppContext
): Promise<HomepageLabel> {
  return {
    uri: l.uri(),
    val: l.val,
    subject: l.subject,
    voted: alreadyVoted.some((v) => v.subject === l.uri()),
    embed: embed
      ? // @ts-ignore
        html([embed])
      : await getCachedPostEmbed(ctx, l.subject),
    score: scores[l.uri()] || 0,
    createdAt: l.createdAt,
    indexedAt: l.indexedAt,
  };
}

type Props = {
  labels: HomepageLabel[];
  // didHandleMap: Record<string, string>;
  profile: { displayName?: string };
};

export function home(props: Props) {
  return shell({
    path: [],
    title: "Home",
    header: "PMsky",
    subheader: "Participate in the moderation of the atmosphere.",
    content: content(props),
  });
}

function content({ labels, profile }: Props) {
  return html`
    <div class="container">
      <div>${logout(profile)}</div>
      <div>${createProposalLink()}</div>
      <div>${feed(labels)}</div>
    </div>
  `;
}

function createProposalLink() {
  return html`<p>
    <a href="/proposals/create"
      ><button title="Create a new label">Create</button></a
    >
  </p>`;
}

function toBskyLink(did: string) {
  return `https://bsky.app/profile/${did}`;
}

function logout(profile: { displayName?: string }) {
  return html`
    <form action="/logout" method="post" class="session-form">
      <div>Welcome, <strong>${profile.displayName || "friend"}</strong>.</div>
      <div>
        <button type="submit">Log out</button>
      </div>
    </form>
  `;
}

function feed(labels: HomepageLabel[]) {
  // returns a list of labels to vote on
  return html`
    <p>Here's a list of posts to vote on:</p>
    ${labels.map((label) => {
      const href = `/label/${label.uri}`;
      return html`<a href="${href}">${labelCard(label)}</a>`;
    })}
  `;
}
