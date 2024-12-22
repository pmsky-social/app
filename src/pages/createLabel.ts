import { type Hole, html } from "../lib/view";
import { shell } from "./shell";

type Props = {
  allowedLabelValues: string[];
  error?: string;
};

export function createLabel(props: Props) {
  return shell({
    title: "Create Label",
    header: "PMsky",
    subheader: html`Welcome to
      <a href="//pmsky.social"><em>AfternoonSky</em></a>`,
    content: content(props),
  });
}

function content({ error, allowedLabelValues }: Props): Hole {
  return html`
    <div class="container">
      ${error && html`<div class="error visible">${error}</div>`}
      <div class="card">
        <form action="/label" method="post" class="create-label">
          <select
            type="text"
            name="label"
            placeholder="Choose a label"
            required
          >
            ${allowedLabelValues.map(labelValueOption)}
          </select>
          <input
            type="text"
            name="subject"
            placeholder="at://did:plc:44ybard42vv44zksie28o7ez/app.bsky.feed.post/3jwdxj2crlk16"
            required
          />
          <button type="submit">Create</button>
        </form>
      </div>
    </div>
  `;
}

function labelValueOption(labelValue: string) {
  return html`<option value="${labelValue}">${labelValue}</option>`;
}
