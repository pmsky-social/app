import { ClientError } from "#/errors";
import { html } from "#/lib/view";
import { shell } from "./shell";

type Props = { error?: string; errorType?: ClientError };

export function login(props: Props) {
  return shell({ path: ["login"], title: "Log in", content: content(props) });
}

// todo: link to docs on requesting access if error == "unauthorized handle"
function content({ error, errorType }: Props) {
  return html`<div id="root">
    <div class="container">
      ${error
        ? html`<p class="error visible">Error: <i>${error}</i></p>`
        : undefined}
      ${errorType ? errorType.render() : undefined}
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
