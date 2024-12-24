import type express from "express";
import type { AppContext } from "..";

export class ContextualHandler {
  ctx: AppContext;
  fn: express.Handler;
  constructor(ctx: AppContext, fn: express.Handler) {
    this.ctx = ctx;
    this.fn = fn;
  }

  async call(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    this.ctx.logger.trace(
      { body: req.body, params: req.params, query: req.query },
      `got request to ${req.method} ${req.url}`
    );
    return this.fn(req, res, next);
  }
}
