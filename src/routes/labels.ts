import { InvalidRecord, ProposalExists } from "#/error";
import { page } from "#/lib/view";
import { Proposal } from "#/views/pages/Label";
import { createProposal } from "#/views/pages/createProposal";
import type { AppContext } from "..";
import { ContextualHandler } from "./ContextualHandler";
import { getSessionAgent } from "./util";
import { ALLOWED_LABEL_VALUES } from "./proposals";
import { ALL_PROPOSAL_TYPES, ProposalType } from "#/db/types";
import { Agent } from "@atproto/api";
import type express from "express";
import { AllowedUsersRepository } from "#/db/repos/allowedUsersRepository";
import { isValidHandle } from "@atproto/syntax";
import { ProposalsRepository } from "#/db/repos/proposalsRepository";

export class GetProposal extends ContextualHandler {
  constructor(ctx: AppContext) {
    super(ctx, async (req, res) => {
      const alreadyExisted = req.query.error === "exists";
      const agent = await getSessionAgent(req, res, ctx);
      if (!agent || !agent.did) return res.sendStatus(403); // TODO: redirect, or use auth middleware

      const proposal = await new ProposalsRepository(ctx).getHydratedProposal(
        agent.assertDid,
        req.params.rkey
      );
      if (!proposal) {
        this.ctx.logger.error(
          { rkey: req.params.rkey },
          "proposal not found for rkey"
        );
        return res.sendStatus(404);
      }

      return res
        .type("html")
        .send(page(Proposal({ proposal, alreadyExisted })));
    });
  }
}

export class PostProposal extends ContextualHandler {
  constructor(ctx: AppContext) {
    super(ctx, async (req, res) => {
      ctx.logger.trace(req.body, "got request to POST /proposal");
      const agent = await getSessionAgent(req, res, ctx);
      if (!agent) return res.sendStatus(403);

      if (req.body.type === ProposalType.LABEL) {
        return this.createPostLabelProposal(req, res, agent);
      } else if (req.body.type === ProposalType.ALLOWED_USER) {
        return this.createAllowedUserProposal(req, res, agent);
      } else {
        return res
          .status(400)
          .send(backToPageWithErrorMsg("invalid proposal type"));
      }
    });
  }

  async createPostLabelProposal(
    req: express.Request,
    res: express.Response,
    agent: Agent
  ) {
    const label = req.body.label;
    let subject = req.body.subject;
    this.ctx.logger.trace(`label: ${label}`);
    this.ctx.logger.trace(`subject: ${subject}`);

    if (!isAllowed(label)) {
      this.ctx.logger.warn(
        `${agent.did} attempted to create invalid label: ${label}`
      );
      return res
        .type("html")
        .send(
          backToPageWithErrorMsg("label not allowed.", ProposalType.LABEL)
        );
    }

    if (!subject.startsWith("at://")) {
      this.ctx.logger.trace(`transforming subject to at:// uri: ${subject}`);
      try {
        subject = transformToAtUri(subject);
      } catch (e) {
        return res
          .type("html")
          .send(
            backToPageWithErrorMsg(
              "expected AT URI or link to a bsky post.",
              ProposalType.LABEL
            )
          );
      }
      this.ctx.logger.trace(`transformed subject to at:// uri: ${subject}`);
    }

    if (!this.ctx.atSvcAct.hasValidSession()) {
      this.ctx.logger.warn("svc account credentials expired");
      return res
        .status(503)
        .type("html")
        .header({ "Retry-After": "1 * 60 * 60" })
        .send(
          "<h1>Server Error: our service account's credentials expired.  Please try again after we fix it.</h1>"
        );
    }

    try {
      const rkey = await this.ctx.atSvcAct.publishLabel(label, subject);
      return res.redirect(`/proposal/${rkey}`);
    } catch (e) {
      this.ctx.logger.error(e, "error publishing label");
      if (e instanceof InvalidRecord) {
        // todo: is this the right way to handle errors?
        return res
          .type("html")
          .send(
            backToPageWithErrorMsg(
              "Label record failed validation",
              ProposalType.LABEL
            )
          );
      }

      if (e instanceof ProposalExists) {
        return res.redirect(`/proposal/${e.existingUri}?error=exists`);
      }

      return res
        .type("html")
        .send(backToPageWithErrorMsg(`unknown server error: ${e}`));
    }
  }

  async createAllowedUserProposal(
    req: express.Request,
    res: express.Response,
    agent: Agent
  ) {
    let handle = req.body.handle;
    if (handle.startsWith("@")) handle = handle.slice(1);

    if (!isValidHandle(handle)) {
      return res
        .type("html")
        .send(
          backToPageWithErrorMsg(
            `Invalid handle: ${handle}`,
            ProposalType.ALLOWED_USER
          )
        );
    }

    const did = await agent
      .resolveHandle({ handle })
      .then((r) => r.data.did)
      .catch((e) => {
        this.ctx.logger.error(e, "error resolving handle");
      });

    if (!did)
      return res
        .type("html")
        .send(
          backToPageWithErrorMsg(`Account not found`, ProposalType.ALLOWED_USER)
        );

    const repo = new AllowedUsersRepository(this.ctx);
    const existing = await repo.getProposalByUser(did);
    // if handle already in proposals,
    if (existing !== undefined) {
      // redirect to existing proposal page (w "already exists" msg)
      return res.redirect(`/proposal/${existing.rkey}?error=exists`);
    }

    // add handle to db
    const rkey = await repo.proposeAllowUser(did);

    return res.redirect(`/proposal/${rkey}`);
  }
}

function isAllowed(label: string): boolean {
  return ALLOWED_LABEL_VALUES.includes(label);
}

// given a link, convert it to an at:// uri
function transformToAtUri(uri: string): string {
  const pieces = uri.split("/");
  if (
    pieces[2] !== "bsky.app" ||
    pieces[3] !== "profile" ||
    pieces[5] !== "post"
  ) {
    throw new Error("invalid link, expected a link to a bsky post");
  }
  const handle = pieces[4];
  const rkey = pieces[6];
  return `at://${handle}/app.bsky.feed.post/${rkey}`;
}

// test transformToAtUri
// url: https://bsky.app/profile/drewmca.dev/post/3ld34i7vl722w
// uri: at://drewmca.dev/app.bsky.feed.post/3ld34i7vl722w

function backToPageWithErrorMsg(msg: string, init?: ProposalType) {
  return page(
    createProposal({
      initProposalType: init,
      proposalTypes: ALL_PROPOSAL_TYPES,
      allowedLabelValues: ALLOWED_LABEL_VALUES,
      error: msg,
    })
  );
}
