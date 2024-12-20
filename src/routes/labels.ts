import { InvalidRecord } from "#/error";
import { page } from "#/lib/view";
import { createLabel } from "#/pages/createLabel";
import type { AppContext } from "..";
import { ContextualHandler } from "./ContextualHandler";

export class GetLabelsCreate extends ContextualHandler {
  constructor(ctx: AppContext) {
    super(ctx, async (req, res) => {
      return res.type("html").send(page(createLabel({})));
    });
  }
}

export class PostLabel extends ContextualHandler {
  constructor(ctx: AppContext) {
    super(ctx, async (req, res) => {
      const user = {
        did: "todo: get user session here, make sure they're logged in",
      };
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
        // todo: replace with user did
        ctx.logger.warn(
          `${user.did} attempted to create invalid label: ${label}`
        );
        return res.type("html").send(
          page(
            createLabel({
              error: 'invalid label, only "test" is supported at this time.',
            })
          )
        );
      }

      if (!subject.startsWith("at://")) {
        ctx.logger.trace(`transforming subject to at:// uri: ${subject}`);
        subject = transformToAtUri(subject);
        ctx.logger.trace(`transformed subject to at:// uri: ${subject}`);
      }

      try {
        ctx.atSvcAct.publishLabel(label, subject);
      } catch (e) {
        if (e instanceof InvalidRecord) {
          // todo: is this the right way to handle errors?
          return res
            .type("html")
            .send(page(createLabel({ error: "label failed validation" })));
        }

        return res
          .type("html")
          .send(page(createLabel({ error: `unknown server error: ${e}` })));
      }

      // todo: add success message?
      return res.redirect("/");
    });
  }
}

function isAllowed(label: string): boolean {
  const whitelistedLabels = ["test"];
  return whitelistedLabels.includes(label);
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
