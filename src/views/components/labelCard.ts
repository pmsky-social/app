import { FeedProposal } from "#/views/pages/home";
import { html } from "#/lib/view";
import { ProposalType } from "#/db/types";
import pino from "pino";

export function proposalCard(proposal: FeedProposal) {
  if (proposal.type == ProposalType.POST_LABEL) {
    return html`
      <div class="card">
        <div class="card-header">
          <p class="proposal-value">${proposal.val}</p>
          <p class="proposal-subject">${proposal.subject}</p>
        </div>
        ${proposal.embed}
        <p>${ts(proposal)}</p>
        <p>${score(proposal)}</p>
        <p>${voting(proposal)}</p>
      </div>
    `;
  }
  if (proposal.type == ProposalType.ALLOWED_USER) {
    return html`
      <div class="card">
        <div class="card-header">
          <p class="proposal-value">@${proposal.handle}</p>
          <p class="proposal-subject">${proposal.subject}</p>
        </div>
        <p class="proposal-timestamp">${ts(proposal)}</p>
        <p class="proposal-score">${score(proposal)}</p>
        <p class="proposal-voting">${voting(proposal)}</p>
      </div>
    `;
  }
  const logger = pino({ name: "proposalCard" });
  logger.error("unknown proposal type", proposal);
}

function ts(label: FeedProposal) {
  const createdAt = new Date(label.createdAt);
  const indexedAt = new Date(label.indexedAt);
  if (createdAt < indexedAt) return createdAt.toDateString();
  return indexedAt.toDateString();
}

function score(label: FeedProposal) {
  const score = Math.floor(label.score);
  return html`<div class="score">${score}</div>`;
}

function voting(label: FeedProposal) {
  if (label.voted) return html`Thanks for voting!`;
  return html`
    <form method="post" class="upvote" action="/vote" rel="noopener">
      <input name="uri" value="${label.uri}" type="hidden" />
      <button name="direction" value="up">upvote</button>
      <button name="direction" value="down">downvote</button>
    </form>
  `;
}
