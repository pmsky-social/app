import { Hole, html } from "./lib/view";

export class ClientError extends Error {
  render(): Hole {
    return html`<p class="error visible">Error: <i>${this.message}</i></p>`;
  }
}

export class HandleNotWhitelisted extends Error {
  constructor(handle: string) {
    super(`handle (@${handle}) is not whitelisted`);
  }

  render(): Hole {
    return html`<p class="error visible">Error: <i>${this.message}.</i></p>
      <p class="error visible">
        <a href="https://docs.pmsky.social/getting-started/request-access"
          >Learn how to request access.</a
        >
      </p>`;
  }
}
