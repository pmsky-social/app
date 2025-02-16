import { FeedProposal } from "#/views/pages/home";
import { html } from "#/lib/view";
import { ProposalType } from "#/db/types";

export function proposalCard(proposal: FeedProposal) {
  const href = `/proposal/${proposal.rkey}`;
  const includeEmbed =
    proposal.type == ProposalType.POST_LABEL && proposal.embed;
  const title =
    proposal.type == ProposalType.POST_LABEL
      ? proposal.val
      : `@${proposal.handle}`;
  return html`
    <div class="card">
      <a href="${href}">
        <div class="card-header">
          <p class="proposal-value">${title}</p>
          <p class="proposal-subject">${proposal.subject}</p>
        </div>
      </a>
      ${(includeEmbed && proposal.embed) || ""}
      <a href="${href}">
        <p class="proposal-timestamp">${ts(proposal)}</p>
        <p class="proposal-voting">${voting(proposal)}</p>
      </a>
    </div>
  `;
}

function ts(label: FeedProposal) {
  const createdAt = new Date(label.createdAt);
  const indexedAt = new Date(label.indexedAt);
  if (createdAt < indexedAt) return createdAt.toDateString();
  return indexedAt.toDateString();
}

function voting(label: FeedProposal) {
  const score = Math.floor(label.score);
  return html`
    <form class="vote">
      <input name="uri" value="${label.uri}" type="hidden" />
      <button
        ?disabled=${label.voted}
        title=${label.voted ? "Thanks for voting!" : "Agree"}
        name="direction"
        value="up"
        hx-post="/vote"
      >
        +
      </button>
      <button disabled class="secondary score">${score}</button>
      <button
        ?disabled=${label.voted}
        title=${label.voted ? "Thanks for voting!" : "Disagree"}
        name="direction"
        value="down"
        hx-post="vote"
      >
        -
      </button>
    </form>
  `;
}
