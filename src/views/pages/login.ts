import { ClientError } from "#/errors";
import { Hole, html } from "#/lib/view";
import { shell } from "./shell";

type Props = { error?: string | ClientError };

export function login(props: Props) {
  return shell({ path: ["login"], title: "Log in", content: content(props) });
}

function content({ error }: Props) {
  const renderedError = renderError(error);
  return html`<div id="root">
    <div class="container">
      ${renderedError}
      <form action="/login" method="post" class="login">
        <input
          type="text"
          name="handle"
          placeholder="Enter your handle (eg alice.bsky.social)"
          required
        />
        <button type="submit">Log in</button>
      </form>
      <div class="signup-cta">
        Don't have an account on the <a href="//atproto.com">Atmosphere</a>?
        <a href="https://bsky.app">Sign up on Bluesky</a> to create one now!
      </div>
    </div>
  </div>`;
}

function renderError(error: string | ClientError | undefined): Hole {
  if (error === undefined) return html``;
  if (typeof error === "string") {
    return html`<p class="error visible">Error: <i>${error}</i></p>`;
  }
  return error.render();
}
