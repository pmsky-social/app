import { type Hole, html } from "#/lib/view";
import { shell } from "./shell";

type Props = {
  allowedLabelValues: string[];
  error?: string;
};

export function createLabel(props: Props) {
  return shell({
    path: ["createLabel"],
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
        <form
          class="createLabel"
          action="/label"
          method="post"
          class="create-label"
        >
          <input
            type="text"
            name="subject"
            placeholder="Paste a link from Bsky..."
            required
          />
          <select
            type="text"
            name="label"
            placeholder="Choose a label"
            required
          >
            ${allowedLabelValues.map(labelValueOption)}
          </select>
          <button type="submit">Create</button>
        </form>
      </div>
    </div>
  `;
}

function labelValueOption(labelValue: string) {
  return html`<option value="${labelValue}">${labelValue}</option>`;
}
