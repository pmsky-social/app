import { html } from "#/lib/view";
import type { HomepageLabel } from "./home";
import { shell } from "./shell";
import { labelCard } from "#/components/labelCard";

// view an individual label
type Props = {
  label: HomepageLabel;
  alreadyExisted: boolean;
};

export function Label(props: Props) {
  let msg = "";
  if (props.alreadyExisted) msg = "This label already exists";
  return shell({
    path: ["label"],
    title: "View Label",
    header: "PMsky",
    subheader: "Viewing a label",
    msg,
    content: content(props),
  });
}

function content({ label }: Props) {
  return html` <div class="container">${labelCard(label)}</div> `;
}
