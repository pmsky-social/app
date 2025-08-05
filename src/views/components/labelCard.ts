import { FeedProposal } from "#/views/pages/home";
import { html } from "#/lib/view";
import { ProposalType } from "#/db/types";

export function proposalCard(proposal: FeedProposal) {
  const href = `/proposal/${proposal.rkey}`;
  const includeEmbed =
    proposal.type == ProposalType.LABEL && proposal.embed;
  const title =
    proposal.type == ProposalType.LABEL
      ? html`Label: <i>${proposal.val}</i>`
      : `${proposal.val} @${proposal.handle}`;
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
        <p class="proposal-voting">
          ${voting(proposal.uri, proposal.voted, proposal.score)}
        </p>
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

// public so we can return this component from hx-POST /vote
// subject: the uri of the proposal being voted on
export function voting(subject: string, alreadyVoted: boolean, score: number) {
  score = Math.floor(score);
  return html`
    <form class="vote">
      <input name="uri" value="${subject}" type="hidden" />
      <input name="prevScore" value="${score}" type="hidden" />
      <button
        ?disabled=${alreadyVoted}
        title=${alreadyVoted ? "Thanks for voting!" : "Agree"}
        name="direction"
        value="up"
        hx-post="/vote"
        hx-target="closest form.vote"
        hx-swap="outerHTML"
      >
        +
      </button>
      <button disabled class="secondary score">${score}</button>
      <button
        ?disabled=${alreadyVoted}
        title=${alreadyVoted ? "Thanks for voting!" : "Disagree"}
        name="direction"
        value="down"
        hx-post="vote"
        hx-target="closest form.vote"
        hx-swap="outerHTML"
      >
        -
      </button>
    </form>
  `;
}
