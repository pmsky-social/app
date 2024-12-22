import { HomepageLabel } from "#/pages/home";
import { html } from "#/lib/view";

export function labelCard(label: HomepageLabel) {
  return html`
    <div class="card">
      <p>${label.val}</p>
      <p>${label.subject}</p>
      <p>${ts(label)}</p>
      <p>${score(label)}</p>
      <p>${voting(label)}</p>
    </div>
  `;
}

function ts(label: HomepageLabel) {
  const createdAt = new Date(label.createdAt);
  const indexedAt = new Date(label.indexedAt);
  if (createdAt < indexedAt) return createdAt.toDateString();
  return indexedAt.toDateString();
}

function score(label: HomepageLabel) {
  const score = Math.floor(label.score);
  return html`<div class="score">${score}</div>`;
}

function voting(label: HomepageLabel) {
  if (label.voted) return html`Thanks for voting!`;
  return html`
    <form method="post" class="upvote" action="/vote" rel="noopener">
      <input name="uri" value="${label.uri}" type="hidden" />
      <button name="direction" value="up">upvote</button>
      <button name="direction" value="down">downvote</button>
    </form>
  `;
}
