import { html } from "#/lib/view";

function createProposalLink() {
  return html`<a href="/proposals/create"
    ><button title="Create a new label">Create</button></a
  >`;
}

export function metaLink(curr: boolean) {
  const url = curr ? "/" : "/?meta=true";
  const title = curr ? "View proposals" : "View meta proposals";
  const label = curr ? "Main" : "Meta";
  return html`<a href="${url}"
    ><button class="secondary" title="${title}">${label}</button></a
  >`;
}

export function feedButtons(linkToMain: boolean) {
  return html`<div class="row">
    ${metaLink(linkToMain)}<span class="feed-header-text"
      >Viewing the ${!linkToMain ? "main" : "meta"} feed</span
    >${createProposalLink()}
  </div>`;
}
