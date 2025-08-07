import { type Hole, html } from "#/lib/view";

export class ClientError extends Error {
	render(): Hole {
		return html`<p class="error visible">Error: <i>${this.message}</i></p>`;
	}
}

export class HandleNotWhitelisted extends Error {
	constructor(private handle: string) {
		super(`handle is not whitelisted`);
	}

	render(): Hole {
		return html`<p class="error visible" title=${`Handle: ${this.handle}`}>
      Error: <i>${this.message}.</i>
      <a href="https://docs.pmsky.social/getting-started/request-access"
        >Learn how to request access.</a
      >
    </p>`;
	}
}
