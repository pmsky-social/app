import { embeddedPost } from "#/views/components/postEmbed";
import { LabelRepository } from "#/db/repos/labelRepository";
import { VoteRepository } from "#/db/repos/voteRepository";
import { InvalidRecord, LabelExists } from "#/error";
import { page } from "#/lib/view";
import { Label } from "#/views/pages/Label";
import { createLabel } from "#/views/pages/createLabel";
import { HomepageLabel } from "#/views/pages/home";
import type { AppContext } from "..";
import { ContextualHandler } from "./ContextualHandler";
import { getSessionAgent } from "./util";

const ALLOWED_LABEL_VALUES = ["test", "test2"];

export class GetLabelsCreate extends ContextualHandler {
  constructor(ctx: AppContext) {
    super(ctx, async (req, res) => {
      return res
        .type("html")
        .send(page(createLabel({ allowedLabelValues: ALLOWED_LABEL_VALUES })));
    });
  }
}

export class GetLabel extends ContextualHandler {
  constructor(ctx: AppContext) {
    super(ctx, async (req, res) => {
      ctx.logger.trace(req.params, "got request to GET /label/:uri");
      ctx.logger.trace(req.query, "req.query");
      const alreadyExisted = req.query.error === "exists";
      ctx.logger.trace(alreadyExisted, "already exists?");
      const agent = await getSessionAgent(req, res, ctx);
      if (!agent || !agent.did) return res.sendStatus(403); // TODO: redirect, or use auth middleware

      const label = await new LabelRepository(ctx.db).getLabel(req.params.rkey);
      if (!label) return res.sendStatus(404);

      const votes = new VoteRepository(ctx.db, ctx.logger);
      const labelUri = `at://${label.src}/social.pmsky.label/${label.rkey}`;
      const voted = await votes.userVotedAlready(agent.did, labelUri);
      const score = await votes.getLabelScore(labelUri);

      const embed = await embeddedPost(ctx.db, label.subject);

      const hydrated: HomepageLabel = {
        ...label,
        uri: labelUri,
        voted,
        score,
        embed,
      };
      return res
        .type("html")
        .send(page(Label({ label: hydrated, alreadyExisted })));
    });
  }
}

export class PostLabel extends ContextualHandler {
  constructor(ctx: AppContext) {
    super(ctx, async (req, res) => {
      ctx.logger.trace(req.body, "got request to POST /label");
      const agent = await getSessionAgent(req, res, ctx);
      if (!agent) return res.sendStatus(403);
      if (!ctx.atSvcAct.hasValidSession()) {
        ctx.logger.warn("svc account credentials expired");
        return res
          .status(401)
          .type("html")
          .send(
            "<h1>Server Error: our service account's credentials expired.  Please try again after we fix it.</h1>"
          );
      }

      const label = req.body.label;
      let subject = req.body.subject;
      ctx.logger.info(`label: ${label}`);
      ctx.logger.info(`subject: ${subject}`);

      if (!isAllowed(label)) {
        ctx.logger.warn(
          `${agent.did} attempted to create invalid label: ${label}`
        );
        return res.type("html").send(
          page(
            createLabel({
              allowedLabelValues: ALLOWED_LABEL_VALUES,
              error: "label not allowed.",
            })
          )
        );
      }

      if (!subject.startsWith("at://")) {
        ctx.logger.trace(`transforming subject to at:// uri: ${subject}`);
        try {
          subject = transformToAtUri(subject);
        } catch (e) {
          return res.type("html").send(
            page(
              createLabel({
                allowedLabelValues: ALLOWED_LABEL_VALUES,
                error: "expected AT URI or link to a bsky post.",
              })
            )
          );
        }
        ctx.logger.trace(`transformed subject to at:// uri: ${subject}`);
      }

      try {
        const rkey = await ctx.atSvcAct.publishLabel(label, subject);
        return res.redirect(`/label/${rkey}`);
      } catch (e) {
        ctx.logger.error(e, "error publishing label");
        if (e instanceof InvalidRecord) {
          // todo: is this the right way to handle errors?
          return res.type("html").send(
            page(
              createLabel({
                allowedLabelValues: ALLOWED_LABEL_VALUES,
                error: "label failed validation",
              })
            )
          );
        }

        if (e instanceof LabelExists) {
          return res.redirect(`/label/${e.existingUri}?error=exists`);
        }

        return res.type("html").send(
          page(
            createLabel({
              allowedLabelValues: ALLOWED_LABEL_VALUES,
              error: `unknown server error: ${e}`,
            })
          )
        );
      }
    });
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
