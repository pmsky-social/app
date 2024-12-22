import { html } from "#/lib/view";
import type { HomepageLabel } from "./home";
import { shell } from "./shell";
import { labelCard } from "#/components/labelCard";

// view an individual label
type Props = {
  label: HomepageLabel;
};

export function Label(props: Props) {
  return shell({
    title: "View Label",
    header: "PMsky",
    subheader: "Viewing a label",
    content: content(props),
  });
}

function content({ label }: Props) {
  return html`
    <div class="container">
      <div class="card">${labelCard(label)}</div>
    </div>
  `;
}
