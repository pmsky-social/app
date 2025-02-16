import { html } from "#/lib/view";
import type { FeedProposal } from "./home";
import { shell } from "./shell";
import { proposalCard } from "#/views/components/labelCard";

// view an individual label
type Props = {
  proposal: FeedProposal;
  alreadyExisted: boolean;
};

export function Proposal(props: Props) {
  let msg = "";
  if (props.alreadyExisted) msg = "This label already exists";
  return shell({
    path: ["proposal", props.proposal.rkey],
    title: "View Proposal",
    header: "PMsky",
    subheader: "Viewing a proposal",
    msg,
    content: content(props),
  });
}

function content({ proposal }: Props) {
  return html` <div class="container">${proposalCard(proposal)}</div> `;
}
