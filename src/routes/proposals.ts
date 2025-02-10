import { ALL_PROPOSAL_TYPES, ProposalType } from "#/db/types";
import { page } from "#/lib/view";
import { createProposal } from "#/views/pages/createProposal";
import { AppContext } from "..";
import { ContextualHandler } from "./ContextualHandler";

export const ALLOWED_LABEL_VALUES = ["test", "test2"];

export class GetCreate extends ContextualHandler {
  constructor(ctx: AppContext) {
    super(ctx, async (req, res) => {
      return res.type("html").send(
        page(
          createProposal({
            allowedLabelValues: ALLOWED_LABEL_VALUES,
            proposalTypes: ALL_PROPOSAL_TYPES,
          })
        )
      );
    });
  }
}
