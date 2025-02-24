import { proposalCard } from "#/views/components/labelCard";
import { getCachedPostEmbed } from "#/views/components/postEmbed";
import { Hole, html } from "#/lib/view";
import { shell } from "./shell";
import { Proposal, ProposalType } from "#/db/types";
import { AppContext } from "#/index";
import { feedButtons } from "../components/buttons";

export type FeedProposal = {
  rkey: string;
  uri: string;
  val: string;
  type: ProposalType;
  subject: string;
  voted: boolean;
  score: number;
  embed: Hole | undefined; // only on post labels
  handle: string | undefined; // only on users
  createdAt: string;
  indexedAt: string;
};

export async function feedProposalFromDB(
  row: {
    rkey: string;
    uri: string;
    val: string;
    type: ProposalType;
    subject: string;
    createdAt: string;
    indexedAt: string;
    indexedBy: string;
    alreadyVoted: boolean;
    score: number | null;
    embed: string | null;
  },
  ctx: AppContext
): Promise<FeedProposal> {
  return {
    rkey: row.rkey,
    uri: row.uri,
    val: row.val,
    type: row.type,
    subject: row.subject,
    voted: row.alreadyVoted,
    embed: row.embed
      ? // @ts-ignore
        html([embed])
      : row.type === ProposalType.POST_LABEL
        ? await getCachedPostEmbed(ctx, row.subject)
        : undefined,
    score: row.score || 0,
    handle:
      row.type === ProposalType.ALLOWED_USER
        ? await ctx.resolver.resolveDidToHandle(row.subject)
        : undefined,
    createdAt: row.createdAt,
    indexedAt: row.indexedAt,
  };
}

type Props = {
  proposals: FeedProposal[];
  // didHandleMap: Record<string, string>;
  // profile: { displayName?: string };
  isMeta: boolean; // is the meta feed or not
};

export function home(props: Props) {
  return shell({ path: [], title: "Home", content: content(props) });
}

function content({ proposals, isMeta }: Props) {
  const pageName = isMeta ? "meta proposals" : "proposals";
  return html`
    <div class="container">
      ${feedButtons(pageName, isMeta)}
      <div class="feed">${feed(proposals)}</div>
    </div>
  `;
}

function toBskyLink(did: string) {
  return `https://bsky.app/profile/${did}`;
}

function feed(proposals: FeedProposal[]) {
  // returns a list of labels to vote on
  // TODO: add pagination, filters
  if (proposals.length === 0) {
    return html`<p class="empty-feed">
      Nothing to vote on right now. Create a proposal!
    </p>`;
  }
  return html`${proposals.map(proposalCard)}`;
}
