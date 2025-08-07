import { html } from "#/lib/view";
import { proposalCard } from "#/views/components/labelCard";
import { feedButtons } from "../components/buttons";
import type { FeedProposal } from "./home";
import { shell } from "./shell";

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
		msg,
		content: content(props),
	});
}

function content({ proposal }: Props) {
	return html`
    <div class="container">
      ${feedButtons("a proposal", true)} ${proposalCard(proposal)}
    </div>
  `;
}
