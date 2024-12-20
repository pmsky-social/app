import type { Label } from "#/db";
import { html } from "../lib/view";
import { shell } from "./shell";

const TODAY = new Date().toDateString();

type Props = {
  labels: Label[];
  // didHandleMap: Record<string, string>;
  profile: { displayName?: string };
};

export function home(props: Props) {
  return shell({
    title: "Home",
    header: "PMsky",
    subheader: "Participate in the moderation of the atmosphere.",
    content: content(props),
  });
}

function content({ labels, profile }: Props) {
  return html`
    <div class="container">
      <div class="card">${logout(profile)}</div>
      <div class="card">${createLabelLink()}</div>
      <div class="card">${feed(labels)}</div>
    </div>
  `;
}

function createLabelLink() {
  return html`<p><a href="/labels/create">Create a new label</a></p>`;
}

function toBskyLink(did: string) {
  return `https://bsky.app/profile/${did}`;
}

function ts(label: Label) {
  const createdAt = new Date(label.createdAt);
  const indexedAt = new Date(label.indexedAt);
  if (createdAt < indexedAt) return createdAt.toDateString();
  return indexedAt.toDateString();
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

function feed(labels: Label[]) {
  // returns a list of labels to vote on
  return html`
    <p>Here's a list of posts to vote on:</p>
    ${labels.map((label) => {
      return labelElement(label);
    })}
  `;
}

function labelElement(label: Label) {
  return html`
    <div class="card">
      <p>${label.val}</p>
      <p>${label.subject}</p>
      <p>${ts(label)}</p>
      <p>${upvote(label)} ${downvote(label)}</p>
    </div>
  `;
}

function upvote(label: Label) {
  return html`
    <form class="upvote" target="/vote?direction=up&uri=${label.uri}">
      <button action="submit">upvote</button>
    </form>
  `;
}

function downvote(label: Label) {
  return html`
    <form class="downvote" target="/vote?direction=down&uri=${label.uri}">
      <button action="submit">downvote</button>
    </form>
  `;
}
