import { LabelRepository } from "#/db/labelRepository";
import { VoteRepository } from "#/db/voteRepository";
import { InvalidRecord, LabelExists } from "#/error";
import { page } from "#/lib/view";
import { Label } from "#/pages/Label";
import { createLabel } from "#/pages/createLabel";
import { HomepageLabel } from "#/pages/home";
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
      ctx.logger.trace(req, "got request to GET /label/:uri");
      const agent = await getSessionAgent(req, res, ctx);
      if (!agent || !agent.did) return res.sendStatus(403);

      const label = await new LabelRepository(ctx.db).getLabel(req.params.uri);
      if (!label) return res.sendStatus(404);

      const voted = await new VoteRepository(ctx.db).userVotedAlready(
        agent.did,
        label.uri
      );

      const hydrated: HomepageLabel = {
        ...label,
        voted,
      };
      return res.type("html").send(page(Label({ label: hydrated })));
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
        const uri = await ctx.atSvcAct.publishLabel(label, subject);
        return res.redirect(`/label/${uri}`);
      } catch (e) {
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
          return res.redirect(`/label/${e.existingUri}`);
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
